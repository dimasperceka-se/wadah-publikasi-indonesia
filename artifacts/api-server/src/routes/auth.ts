import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { RegisterUserBody, LoginUserBody } from "@workspace/api-zod";
import { hashPassword, comparePassword, signToken } from "../lib/auth";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password, name, affiliation, orcidId } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(usersTable)
    .values({ email, passwordHash, name, affiliation: affiliation ?? null, orcidId: orcidId ?? null })
    .returning();

  const token = signToken({ userId: user.id, role: user.role, verifierLayer: user.verifierLayer ?? null });
  const { passwordHash: _, ...safeUser } = user;

  res.status(201).json({ user: { ...safeUser, verifierLayer: safeUser.verifierLayer ?? null }, token });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signToken({ userId: user.id, role: user.role, verifierLayer: user.verifierLayer ?? null });
  const { passwordHash: _, ...safeUser } = user;

  res.json({ user: { ...safeUser, verifierLayer: safeUser.verifierLayer ?? null }, token });
});

router.post("/auth/logout", (_req, res): void => {
  res.json({ success: true });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  const { passwordHash: _, ...safeUser } = user;
  res.json({ ...safeUser, verifierLayer: safeUser.verifierLayer ?? null });
});

export default router;
