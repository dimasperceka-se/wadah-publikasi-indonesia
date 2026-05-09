import { Router, type IRouter } from "express";
import { eq, sql, desc } from "drizzle-orm";
import { db, papersTable, usersTable, statusHistoryTable } from "@workspace/db";
import {
  AdminListPapersQueryParams,
  AssignVerifierBody,
  AssignVerifierParams,
  AdminUpdatePaperStatusBody,
  AdminUpdatePaperStatusParams,
  AdminUpdateUserRoleBody,
  AdminUpdateUserRoleParams,
} from "@workspace/api-zod";
import { requireAuth, requireRole } from "../middlewares/requireAuth";

const router: IRouter = Router();

const adminOnly = [requireAuth, requireRole("ADMIN")];

// ─── Papers ───────────────────────────────────────────────────────────────────

router.get("/admin/papers", ...adminOnly, async (req, res): Promise<void> => {
  const parsed = AdminListPapersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { status, page, limit } = parsed.data;
  const offset = ((page ?? 1) - 1) * (limit ?? 20);

  const where = status ? eq(papersTable.status, status as typeof papersTable.status.dataType) : undefined;

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(papersTable)
    .where(where);

  const papers = await db
    .select({ paper: papersTable, authorName: usersTable.name })
    .from(papersTable)
    .leftJoin(usersTable, eq(papersTable.authorId, usersTable.id))
    .where(where)
    .orderBy(desc(papersTable.updatedAt))
    .limit(limit ?? 20)
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
    limit: limit ?? 20,
  });
});

router.post("/admin/papers/:id/assign", ...adminOnly, async (req, res): Promise<void> => {
  const params = AssignVerifierParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AssignVerifierBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [paper] = await db.select().from(papersTable).where(eq(papersTable.id, params.data.id));
  if (!paper) {
    res.status(404).json({ error: "Paper not found" });
    return;
  }

  await db
    .update(papersTable)
    .set({ assignedVerifierId: parsed.data.verifierId })
    .where(eq(papersTable.id, params.data.id));

  await db.insert(statusHistoryTable).values({
    paperId: paper.id,
    fromStatus: paper.status,
    toStatus: paper.status,
    changedBy: req.user!.userId.toString(),
    note: `Verifier ${parsed.data.verifierId} assigned`,
  });

  const [verifier] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, parsed.data.verifierId));
  const [author] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, paper.authorId));

  const updated = await db.select().from(papersTable).where(eq(papersTable.id, params.data.id));

  res.json({
    ...updated[0],
    authorName: author?.name ?? "Unknown",
    assignedVerifierName: verifier?.name ?? null,
    doi: updated[0].doi ?? null,
    publishedAt: updated[0].publishedAt?.toISOString() ?? null,
    aiReport: updated[0].aiReport ?? null,
    reviews: [],
    statusHistory: [],
    coAuthors: updated[0].coAuthors ?? [],
  });
});

router.patch("/admin/papers/:id/status", ...adminOnly, async (req, res): Promise<void> => {
  const params = AdminUpdatePaperStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AdminUpdatePaperStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [paper] = await db.select().from(papersTable).where(eq(papersTable.id, params.data.id));
  if (!paper) {
    res.status(404).json({ error: "Paper not found" });
    return;
  }

  const updates: Record<string, unknown> = { status: parsed.data.status };
  if (parsed.data.status === "PUBLISHED") {
    if (!paper.doi) updates.doi = `10.1234/scipub.${paper.id}.${Date.now()}`;
    if (!paper.publishedAt) updates.publishedAt = new Date();
  }

  await db.update(papersTable).set(updates).where(eq(papersTable.id, params.data.id));
  await db.insert(statusHistoryTable).values({
    paperId: paper.id,
    fromStatus: paper.status,
    toStatus: parsed.data.status,
    changedBy: `admin:${req.user!.userId}`,
    note: parsed.data.note ?? "Admin override",
  });

  const [updated] = await db.select().from(papersTable).where(eq(papersTable.id, params.data.id));
  const [author] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, updated.authorId));

  res.json({
    ...updated,
    authorName: author?.name ?? "Unknown",
    assignedVerifierName: null,
    doi: updated.doi ?? null,
    publishedAt: updated.publishedAt?.toISOString() ?? null,
    aiReport: updated.aiReport ?? null,
    reviews: [],
    statusHistory: [],
    coAuthors: updated.coAuthors ?? [],
  });
});

// ─── Users ────────────────────────────────────────────────────────────────────

router.get("/admin/users", ...adminOnly, async (_req, res): Promise<void> => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  res.json(
    users.map(({ passwordHash: _, ...u }) => ({ ...u, verifierLayer: u.verifierLayer ?? null }))
  );
});

router.patch("/admin/users/:id/role", ...adminOnly, async (req, res): Promise<void> => {
  const params = AdminUpdateUserRoleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AdminUpdateUserRoleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({
      role: parsed.data.role as typeof user.role,
      verifierLayer: parsed.data.verifierLayer ?? null,
    })
    .where(eq(usersTable.id, params.data.id))
    .returning();

  const { passwordHash: _, ...safeUser } = updated;
  res.json({ ...safeUser, verifierLayer: safeUser.verifierLayer ?? null });
});

// ─── Analytics ────────────────────────────────────────────────────────────────

router.get("/admin/analytics", ...adminOnly, async (_req, res): Promise<void> => {
  const statusBreakdown = await db
    .select({ status: papersTable.status, count: sql<number>`count(*)::int` })
    .from(papersTable)
    .groupBy(papersTable.status);

  const [totalPapers] = await db.select({ count: sql<number>`count(*)::int` }).from(papersTable);
  const [totalUsers] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable);

  const publishedCount = statusBreakdown.find((s) => s.status === "PUBLISHED")?.count ?? 0;
  const rejectedCount = statusBreakdown.find((s) => s.status === "REJECTED")?.count ?? 0;
  const acceptanceRate =
    totalPapers.count > 0 ? Math.round((publishedCount / totalPapers.count) * 100) : 0;

  // Simple mock time series — last 6 months
  const now = new Date();
  const submissionsOverTime = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      count: Math.floor(Math.random() * 8) + 1,
    };
  });

  res.json({
    statusBreakdown,
    submissionsOverTime,
    avgReviewTime: 4.5,
    acceptanceRate,
    totalPapers: totalPapers.count,
    totalUsers: totalUsers.count,
  });
});

export default router;
