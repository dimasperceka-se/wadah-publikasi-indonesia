import { Router, type IRouter } from "express";
import { eq, and, or, ilike, sql, desc } from "drizzle-orm";
import { db, papersTable, usersTable, reviewsTable, statusHistoryTable } from "@workspace/db";
import {
  ListPublishedPapersQueryParams,
  CreatePaperBody,
  UpdatePaperBody,
  UpdatePaperParams,
  GetPaperParams,
  GetMyPaperParams,
  SubmitPaperParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";
import { runAiReview } from "../lib/aiReview";
import { consumeOneSubmission } from "../lib/billing";

const router: IRouter = Router();

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function buildPaperDetail(paperId: number) {
  const [paper] = await db
    .select({
      paper: papersTable,
      authorName: usersTable.name,
      assignedVerifierName: usersTable.name,
    })
    .from(papersTable)
    .leftJoin(usersTable, eq(papersTable.authorId, usersTable.id))
    .where(eq(papersTable.id, paperId));

  if (!paper) return null;

  const reviews = await db
    .select({
      review: reviewsTable,
      reviewerName: usersTable.name,
    })
    .from(reviewsTable)
    .leftJoin(usersTable, eq(reviewsTable.reviewerId, usersTable.id))
    .where(eq(reviewsTable.paperId, paperId))
    .orderBy(desc(reviewsTable.createdAt));

  const history = await db
    .select()
    .from(statusHistoryTable)
    .where(eq(statusHistoryTable.paperId, paperId))
    .orderBy(statusHistoryTable.createdAt);

  let assignedVerifierName: string | null = null;
  if (paper.paper.assignedVerifierId) {
    const [v] = await db
      .select({ name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.id, paper.paper.assignedVerifierId));
    assignedVerifierName = v?.name ?? null;
  }

  return {
    ...paper.paper,
    authorName: paper.authorName ?? "Unknown",
    assignedVerifierName,
    aiReport: paper.paper.aiReport ?? null,
    reviews: reviews.map((r) => ({
      ...r.review,
      reviewerName: r.reviewerName ?? "Unknown",
      inlineNotes: r.review.inlineNotes ?? [],
    })),
    statusHistory: history.map((h) => ({
      ...h,
      fromStatus: h.fromStatus ?? null,
      note: h.note ?? null,
    })),
    doi: paper.paper.doi ?? null,
    publishedAt: paper.paper.publishedAt?.toISOString() ?? null,
  };
}

async function addStatusHistory(
  paperId: number,
  fromStatus: string | null,
  toStatus: string,
  changedBy: string,
  note?: string
) {
  await db.insert(statusHistoryTable).values({
    paperId,
    fromStatus,
    toStatus,
    changedBy,
    note: note ?? null,
  });
}

// ─── Public endpoints ─────────────────────────────────────────────────────────

router.get("/papers/stats", async (_req, res): Promise<void> => {
  const [published] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(papersTable)
    .where(eq(papersTable.status, "PUBLISHED"));

  const [submitted] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(papersTable)
    .where(sql`status != 'DRAFT'`);

  const [usersCount] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable);

  const categories = await db
    .select({
      category: papersTable.category,
      count: sql<number>`count(*)::int`,
    })
    .from(papersTable)
    .where(eq(papersTable.status, "PUBLISHED"))
    .groupBy(papersTable.category);

  res.json({
    totalPublished: published.count,
    totalSubmitted: submitted.count,
    totalUsers: usersCount.count,
    categories,
  });
});

router.get("/papers", async (req, res): Promise<void> => {
  const parsed = ListPublishedPapersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { search, category, page, limit } = parsed.data;
  const offset = ((page ?? 1) - 1) * (limit ?? 12);

  const conditions = [eq(papersTable.status, "PUBLISHED")];
  if (search) {
    conditions.push(
      or(
        ilike(papersTable.title, `%${search}%`),
        ilike(papersTable.abstract, `%${search}%`)
      )!
    );
  }
  if (category) {
    conditions.push(eq(papersTable.category, category));
  }

  const where = and(...conditions);

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(papersTable)
    .where(where);

  const papers = await db
    .select({
      paper: papersTable,
      authorName: usersTable.name,
    })
    .from(papersTable)
    .leftJoin(usersTable, eq(papersTable.authorId, usersTable.id))
    .where(where)
    .orderBy(desc(papersTable.publishedAt))
    .limit(limit ?? 12)
    .offset(offset);

  res.json({
    papers: papers.map((p) => ({
      ...p.paper,
      authorName: p.authorName ?? "Unknown",
      doi: p.paper.doi ?? null,
      publishedAt: p.paper.publishedAt?.toISOString() ?? null,
    })),
    total,
    page: page ?? 1,
    limit: limit ?? 12,
  });
});

router.get("/papers/:id", async (req, res): Promise<void> => {
  const params = GetPaperParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const detail = await buildPaperDetail(params.data.id);
  if (!detail) {
    res.status(404).json({ error: "Paper not found" });
    return;
  }
  res.json(detail);
});

// ─── My papers (author) ───────────────────────────────────────────────────────

router.get("/my/papers", requireAuth, async (req, res): Promise<void> => {
  const papers = await db
    .select({
      paper: papersTable,
      authorName: usersTable.name,
    })
    .from(papersTable)
    .leftJoin(usersTable, eq(papersTable.authorId, usersTable.id))
    .where(eq(papersTable.authorId, req.user!.userId))
    .orderBy(desc(papersTable.updatedAt));

  res.json(
    papers.map((p) => ({
      ...p.paper,
      authorName: p.authorName ?? "Unknown",
      doi: p.paper.doi ?? null,
      publishedAt: p.paper.publishedAt?.toISOString() ?? null,
    }))
  );
});

router.post("/my/papers", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreatePaperBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, abstract, keywords, category, pdfUrl, content, coAuthors } = parsed.data;

  const [paper] = await db
    .insert(papersTable)
    .values({
      title,
      abstract,
      keywords,
      category,
      pdfUrl,
      content,
      coAuthors: coAuthors ?? [],
      authorId: req.user!.userId,
    })
    .returning();

  await addStatusHistory(paper.id, null, "DRAFT", req.user!.userId.toString(), "Paper created");

  const detail = await buildPaperDetail(paper.id);
  res.status(201).json(detail);
});

router.get("/my/papers/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetMyPaperParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [paper] = await db
    .select()
    .from(papersTable)
    .where(and(eq(papersTable.id, params.data.id), eq(papersTable.authorId, req.user!.userId)));

  if (!paper) {
    res.status(404).json({ error: "Paper not found" });
    return;
  }

  const detail = await buildPaperDetail(paper.id);
  res.json(detail);
});

router.patch("/my/papers/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdatePaperParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdatePaperBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(papersTable)
    .where(and(eq(papersTable.id, params.data.id), eq(papersTable.authorId, req.user!.userId)));

  if (!existing) {
    res.status(404).json({ error: "Paper not found" });
    return;
  }

  if (!["DRAFT", "REVISION_REQUESTED"].includes(existing.status)) {
    res.status(400).json({ error: "Paper cannot be edited in its current state" });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.abstract !== undefined) updateData.abstract = parsed.data.abstract;
  if (parsed.data.keywords !== undefined) updateData.keywords = parsed.data.keywords;
  if (parsed.data.category !== undefined) updateData.category = parsed.data.category;
  if (parsed.data.pdfUrl !== undefined) updateData.pdfUrl = parsed.data.pdfUrl;
  if (parsed.data.content !== undefined) updateData.content = parsed.data.content;
  if (parsed.data.coAuthors !== undefined) updateData.coAuthors = parsed.data.coAuthors;

  await db.update(papersTable).set(updateData).where(eq(papersTable.id, params.data.id));

  const detail = await buildPaperDetail(params.data.id);
  res.json(detail);
});

router.post("/my/papers/:id/submit", requireAuth, async (req, res): Promise<void> => {
  const params = SubmitPaperParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [paper] = await db
    .select()
    .from(papersTable)
    .where(and(eq(papersTable.id, params.data.id), eq(papersTable.authorId, req.user!.userId)));

  if (!paper) {
    res.status(404).json({ error: "Paper not found" });
    return;
  }

  if (!["DRAFT", "REVISION_REQUESTED"].includes(paper.status)) {
    res.status(400).json({ error: `Cannot submit paper with status: ${paper.status}` });
    return;
  }

  const consumed = await consumeOneSubmission(req.user!.userId);
  if (!consumed) {
    res.status(402).json({
      error: "No active subscription with remaining quota. Please choose a plan before submitting.",
      code: "PAYMENT_REQUIRED",
    });
    return;
  }

  const fromStatus = paper.status;

  // Transition to SUBMITTED then AI_REVIEW
  await db.update(papersTable).set({ status: "SUBMITTED" }).where(eq(papersTable.id, paper.id));
  await addStatusHistory(paper.id, fromStatus, "SUBMITTED", req.user!.userId.toString(), "Paper submitted");

  await db.update(papersTable).set({ status: "AI_REVIEW" }).where(eq(papersTable.id, paper.id));
  await addStatusHistory(paper.id, "SUBMITTED", "AI_REVIEW", "system", "AI review started");

  // Run AI review (async in background)
  runAiReview(paper.title, paper.abstract, paper.content)
    .then(async (report) => {
      const newStatus = report.passed ? "AI_PASSED" : "AI_FAILED";
      await db
        .update(papersTable)
        .set({ status: newStatus, aiReport: report as unknown as Record<string, unknown> })
        .where(eq(papersTable.id, paper.id));
      await addStatusHistory(
        paper.id,
        "AI_REVIEW",
        newStatus,
        "system",
        report.passed ? `AI review passed with score ${report.score}` : `AI review failed with score ${report.score}`
      );
      if (report.passed) {
        await db.update(papersTable).set({ status: "LAYER_2_REVIEW" }).where(eq(papersTable.id, paper.id));
        await addStatusHistory(paper.id, "AI_PASSED", "LAYER_2_REVIEW", "system", "Awaiting Layer 2 human review");
      }
    })
    .catch((err) => {
      req.log?.error({ err }, "AI review error");
    });

  const detail = await buildPaperDetail(paper.id);
  res.json(detail);
});

// ─── Users ────────────────────────────────────────────────────────────────────

router.get("/users/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const { passwordHash: _, ...safeUser } = user;
  res.json({ ...safeUser, verifierLayer: safeUser.verifierLayer ?? null });
});

export default router;
