import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";

export type PlanKey = "PAY_AS_YOU_GO" | "SIX_MONTH";

export interface Plan {
  plan: PlanKey;
  label: string;
  description: string;
  priceUsd: number;
  priceUsdCents: number;
  submissionsQuota: number;
  durationDays: number | null;
}

export interface ActiveSubscription {
  id: number;
  plan: PlanKey;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  submissionsQuota: number;
  submissionsUsed: number;
  submissionsRemaining: number;
  amountUsd: number;
  startsAt: string;
  expiresAt: string | null;
}

export interface BillingMe {
  active: ActiveSubscription | null;
  canSubmit: boolean;
  submissionsRemaining: number;
}

export const PLAN_DETAILS: Record<PlanKey, { label: string; priceUsd: number; quota: number; duration: string }> = {
  PAY_AS_YOU_GO: { label: "Pay as you go", priceUsd: 101, quota: 1, duration: "Single submission" },
  SIX_MONTH: { label: "6-month subscription", priceUsd: 269, quota: 8, duration: "6 months" },
};

export function useBillingPlans() {
  return useQuery({
    queryKey: ["billing", "plans"],
    queryFn: () => customFetch<{ plans: Plan[] }>("/api/billing/plans"),
    staleTime: 5 * 60_000,
  });
}

export function useBillingMe(opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["billing", "me"],
    queryFn: () => customFetch<BillingMe>("/api/billing/me"),
    enabled: opts?.enabled ?? true,
  });
}

export function useCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (plan: PlanKey) =>
      customFetch<ActiveSubscription>("/api/billing/checkout", {
        method: "POST",
        body: JSON.stringify({ plan }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["billing", "me"] });
    },
  });
}
