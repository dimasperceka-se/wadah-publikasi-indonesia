import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, papersTable, usersTable, reviewsTable, statusHistoryTable } from "@workspace/db";
import { SubmitReviewBody, SubmitReviewParams } from "@workspace/api-zod";
import { requireVerifier } from "../middlewares/requireAuth";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/verifier/queue", requireVerifier, async (req, res): Promise<void> => {
  const user = req.user!;

  let statusFilter: "LAYER_2_REVIEW" | "LAYER_3_REVIEW";
  if (user.role === "ADMIN") {
    // Admin can see both layers
    const papers = await db
      .select({ paper: papersTable, authorName: usersTable.name })
      .from(papersTable)
      .leftJoin(usersTable, eq(papersTable.authorId, usersTable.id))
      .where(eq(papersTable.assignedVerifierId, user.userId))
      .orderBy(desc(papersTable.updatedAt));

    res.json(papers.map((p) => ({
      ...p.paper,
      authorName: p.authorName ?? "Unknown",
      doi: p.paper.doi ?? null,
      publishedAt: p.paper.publishedAt?.toISOString() ?? null,
    })));
    return;
  }

  statusFilter = user.verifierLayer === 2 ? "LAYER_2_REVIEW" : "LAYER_3_REVIEW";

  const papers = await db
    .select({ paper: papersTable, authorName: usersTable.name })
    .from(papersTable)
    .leftJoin(usersTable, eq(papersTable.authorId, usersTable.id))
    .where(
      and(
        eq(papersTable.status, statusFilter),
        eq(papersTable.assignedVerifierId, user.userId)
      )
    )
    .orderBy(desc(papersTable.updatedAt));

  res.json(papers.map((p) => ({
    ...p.paper,
    authorName: p.authorName ?? "Unknown",
    doi: p.paper.doi ?? null,
    publishedAt: p.paper.publishedAt?.toISOString() ?? null,
  })));
});

router.post("/verifier/papers/:id/review", requireVerifier, async (req, res): Promise<void> => {
  const params = SubmitReviewParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = SubmitReviewBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { decision, comments, inlineNotes } = parsed.data;
  const user = req.user!;

  const [paper] = await db.select().from(papersTable).where(eq(papersTable.id, params.data.id));
  if (!paper) {
    res.status(404).json({ error: "Paper not found" });
    return;
  }

  const layer = user.verifierLayer ?? (user.role === "ADMIN" ? 2 : 2);

  const [review] = await db
    .insert(reviewsTable)
    .values({
      paperId: paper.id,
      reviewerId: user.userId,
      layer,
      decision,
      comments,
      inlineNotes: inlineNotes ?? [],
    })
    .returning();

  const fromStatus = paper.status;
  let newStatus: typeof paper.status;
  let note = "";

  if (decision === "APPROVED") {
    if (layer === 2) {
      newStatus = "LAYER_2_APPROVED";
      note = "Layer 2 approved";
    } else {
      newStatus = "LAYER_3_APPROVED";
      note = "Layer 3 approved";
    }
  } else if (decision === "REVISION") {
    newStatus = "REVISION_REQUESTED";
    note = `Layer ${layer} requested revisions`;
  } else {
    newStatus = "REJECTED";
    note = `Layer ${layer} rejected`;
  }

  await db.update(papersTable).set({ status: newStatus }).where(eq(papersTable.id, paper.id));
  await db
    .insert(statusHistoryTable)
    .values({ paperId: paper.id, fromStatus, toStatus: newStatus, changedBy: user.userId.toString(), note });

  // Auto-advance to Layer 3 review after Layer 2 approval
  if (newStatus === "LAYER_2_APPROVED") {
    await db.update(papersTable).set({ status: "LAYER_3_REVIEW" }).where(eq(papersTable.id, paper.id));
    await db
      .insert(statusHistoryTable)
      .values({ paperId: paper.id, fromStatus: "LAYER_2_APPROVED", toStatus: "LAYER_3_REVIEW", changedBy: "system", note: "Advancing to Layer 3 review" });
  }

  // Publish paper after Layer 3 approval
  if (newStatus === "LAYER_3_APPROVED") {
    const doi = `10.1234/scipub.${paper.id}.${Date.now()}`;
    await db.update(papersTable).set({ status: "PUBLISHED", doi, publishedAt: new Date() }).where(eq(papersTable.id, paper.id));
    await db
      .insert(statusHistoryTable)
      .values({ paperId: paper.id, fromStatus: "LAYER_3_APPROVED", toStatus: "PUBLISHED", changedBy: "system", note: `Published with DOI: ${doi}` });
  }

  const [verifier] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, user.userId));

  res.status(201).json({
    ...review,
    reviewerName: verifier?.name ?? "Unknown",
    inlineNotes: review.inlineNotes ?? [],
  });
});

export default router;
