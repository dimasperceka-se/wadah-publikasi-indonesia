import { and, asc, eq, gt, isNull, or, sql } from "drizzle-orm";
import { db, subscriptionsTable, type Subscription } from "@workspace/db";

export const PLANS = {
  PAY_AS_YOU_GO: {
    plan: "PAY_AS_YOU_GO" as const,
    label: "Pay as you go",
    description: "Single paper submission, valid until used.",
    priceUsdCents: 10100,
    submissionsQuota: 1,
    durationDays: null,
  },
  SIX_MONTH: {
    plan: "SIX_MONTH" as const,
    label: "6-month subscription",
    description: "Up to 8 paper submissions over 6 months.",
    priceUsdCents: 26900,
    submissionsQuota: 8,
    durationDays: 183,
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function isPlanKey(v: unknown): v is PlanKey {
  return typeof v === "string" && (v === "PAY_AS_YOU_GO" || v === "SIX_MONTH");
}

/** A subscription is usable when status=ACTIVE, has remaining quota, and isn't past expiry. */
async function findUsableSubscription(userId: number): Promise<Subscription | null> {
  const now = new Date();
  const [sub] = await db
    .select()
    .from(subscriptionsTable)
    .where(
      and(
        eq(subscriptionsTable.userId, userId),
        eq(subscriptionsTable.status, "ACTIVE"),
        sql`${subscriptionsTable.submissionsUsed} < ${subscriptionsTable.submissionsQuota}`,
        or(isNull(subscriptionsTable.expiresAt), gt(subscriptionsTable.expiresAt, now)),
      ),
    )
    .orderBy(asc(subscriptionsTable.createdAt))
    .limit(1);

  return sub ?? null;
}

export async function getActiveSummary(userId: number): Promise<{
  active: Subscription | null;
  remaining: number;
}> {
  const sub = await findUsableSubscription(userId);
  return {
    active: sub,
    remaining: sub ? sub.submissionsQuota - sub.submissionsUsed : 0,
  };
}

/** Decrement quota atomically. Returns the subscription used, or null if none usable. */
export async function consumeOneSubmission(userId: number): Promise<Subscription | null> {
  const sub = await findUsableSubscription(userId);
  if (!sub) return null;

  const newUsed = sub.submissionsUsed + 1;
  const becomesExpired = newUsed >= sub.submissionsQuota;
  const [updated] = await db
    .update(subscriptionsTable)
    .set({
      submissionsUsed: newUsed,
      status: becomesExpired ? "EXPIRED" : "ACTIVE",
    })
    .where(eq(subscriptionsTable.id, sub.id))
    .returning();
  return updated;
}

export async function createCheckout(userId: number, plan: PlanKey): Promise<Subscription> {
  const def = PLANS[plan];
  const now = new Date();
  const expiresAt = def.durationDays
    ? new Date(now.getTime() + def.durationDays * 24 * 60 * 60 * 1000)
    : null;

  const [sub] = await db
    .insert(subscriptionsTable)
    .values({
      userId,
      plan: def.plan,
      status: "ACTIVE",
      submissionsQuota: def.submissionsQuota,
      submissionsUsed: 0,
      amountUsdCents: def.priceUsdCents,
      startsAt: now,
      expiresAt,
      paidAt: now,
    })
    .returning();
  return sub;
}
