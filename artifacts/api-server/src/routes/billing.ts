import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import { requireAuth } from "../middlewares/requireAuth";
import { PLANS, createCheckout, getActiveSummary, isPlanKey, type PlanKey } from "../lib/billing";

const router: IRouter = Router();

const CheckoutBody = z.object({
  plan: z.enum(["PAY_AS_YOU_GO", "SIX_MONTH"]),
});

router.get("/billing/plans", (_req, res): void => {
  res.json({
    plans: Object.values(PLANS).map((p) => ({
      plan: p.plan,
      label: p.label,
      description: p.description,
      priceUsd: p.priceUsdCents / 100,
      priceUsdCents: p.priceUsdCents,
      submissionsQuota: p.submissionsQuota,
      durationDays: p.durationDays,
    })),
  });
});

router.get("/billing/me", requireAuth, async (req, res): Promise<void> => {
  const { active, remaining } = await getActiveSummary(req.user!.userId);
  res.json({
    active: active
      ? {
          id: active.id,
          plan: active.plan,
          status: active.status,
          submissionsQuota: active.submissionsQuota,
          submissionsUsed: active.submissionsUsed,
          submissionsRemaining: remaining,
          amountUsd: active.amountUsdCents / 100,
          startsAt: active.startsAt.toISOString(),
          expiresAt: active.expiresAt?.toISOString() ?? null,
        }
      : null,
    canSubmit: !!active,
    submissionsRemaining: remaining,
  });
});

router.post("/billing/checkout", requireAuth, async (req, res): Promise<void> => {
  const parsed = CheckoutBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const planKey: PlanKey = isPlanKey(parsed.data.plan) ? parsed.data.plan : "PAY_AS_YOU_GO";
  const sub = await createCheckout(req.user!.userId, planKey);

  res.status(201).json({
    id: sub.id,
    plan: sub.plan,
    status: sub.status,
    submissionsQuota: sub.submissionsQuota,
    submissionsUsed: sub.submissionsUsed,
    submissionsRemaining: sub.submissionsQuota - sub.submissionsUsed,
    amountUsd: sub.amountUsdCents / 100,
    startsAt: sub.startsAt.toISOString(),
    expiresAt: sub.expiresAt?.toISOString() ?? null,
    paidAt: sub.paidAt?.toISOString() ?? null,
  });
});

export default router;
