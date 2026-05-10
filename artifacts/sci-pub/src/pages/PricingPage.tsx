import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/lib/auth";
import { useBillingMe, useCheckout, type PlanKey } from "@/lib/billing";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, Sparkles, FileText, Calendar, Crown } from "lucide-react";

interface PlanCardProps {
  plan: PlanKey;
  title: string;
  price: number;
  priceSuffix: string;
  description: string;
  features: string[];
  highlight?: boolean;
  ctaLabel: string;
  onSelect: () => void;
  loading: boolean;
  disabled?: boolean;
}

function PlanCard(p: PlanCardProps) {
  return (
    <Card className={`glass-card relative overflow-hidden ${p.highlight ? "border-primary/50 shadow-xl" : ""}`}>
      {p.highlight && (
        <div className="absolute top-0 right-0 m-3">
          <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground border-0">
            Best value
          </Badge>
        </div>
      )}
      <CardContent className="p-7">
        <div className="flex items-center gap-2 mb-2">
          {p.highlight ? (
            <Crown className="w-5 h-5 text-primary" />
          ) : (
            <Sparkles className="w-5 h-5 text-accent" />
          )}
          <h3 className="font-display text-xl font-bold text-foreground">{p.title}</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-5">{p.description}</p>

        <div className="flex items-baseline gap-1 mb-6">
          <span className="text-4xl font-bold font-display text-foreground">${p.price}</span>
          <span className="text-sm text-muted-foreground">{p.priceSuffix}</span>
        </div>

        <ul className="space-y-2.5 mb-7">
          {p.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-accent mt-0.5 shrink-0" />
              <span className="text-foreground/85">{f}</span>
            </li>
          ))}
        </ul>

        <Button
          onClick={p.onSelect}
          disabled={p.loading || p.disabled}
          className={`w-full font-semibold ${
            p.highlight
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-accent text-accent-foreground hover:bg-accent/90"
          }`}
          size="lg"
        >
          {p.loading ? "Processing…" : p.ctaLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function PricingPage() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { isAuth } = useAuth();
  const { data: me } = useBillingMe({ enabled: isAuth });
  const checkout = useCheckout();
  const { toast } = useToast();

  const isOnboarding = new URLSearchParams(search).get("onboarding") === "1";
  const returnTo = new URLSearchParams(search).get("returnTo") ?? "/my-papers";

  function buy(plan: PlanKey) {
    if (!isAuth) {
      navigate("/login");
      return;
    }
    checkout.mutate(plan, {
      onSuccess(sub) {
        toast({
          title: "Payment successful",
          description: `${sub.plan === "SIX_MONTH" ? "6-month subscription" : "Pay-as-you-go credit"} activated.`,
        });
        navigate(returnTo);
      },
      onError(err) {
        toast({ title: "Checkout failed", description: (err as Error).message, variant: "destructive" });
      },
    });
  }

  return (
    <div className="min-h-screen relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary mb-4">
            Choose your plan
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold font-display text-foreground mb-3">
            {isOnboarding ? "Pick a plan to get started" : "Simple, predictable pricing"}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Submit your paper through our multi-layer review pipeline. Pay per submission, or save with a 6-month plan for up to 8 papers.
          </p>
        </div>

        {me?.active && (
          <Card className="glass-card mb-8">
            <CardContent className="p-5 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-sm font-medium text-foreground">
                    Active plan: {me.active.plan === "SIX_MONTH" ? "6-month subscription" : "Pay as you go"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {me.active.submissionsRemaining} of {me.active.submissionsQuota} submissions left
                    {me.active.expiresAt && ` · expires ${new Date(me.active.expiresAt).toLocaleDateString()}`}
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/my-papers")}>
                Go to My Papers
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PlanCard
            plan="PAY_AS_YOU_GO"
            title="Pay as you go"
            price={101}
            priceSuffix="/ paper"
            description="Best for one-off submissions. Pay only when you submit."
            features={[
              "1 paper submission",
              "Full multi-layer review (AI + L2 + L3)",
              "DOI on publication",
              "No expiry until used",
            ]}
            ctaLabel="Buy single submission"
            onSelect={() => buy("PAY_AS_YOU_GO")}
            loading={checkout.isPending}
          />

          <PlanCard
            plan="SIX_MONTH"
            title="6-Month subscription"
            price={269}
            priceSuffix="/ 6 months"
            description="Best value for active researchers. Save ~67% per paper."
            features={[
              "Up to 8 paper submissions",
              "Valid for 6 months",
              "Full multi-layer review (AI + L2 + L3)",
              "DOI on publication",
              "Priority verifier assignment",
            ]}
            highlight
            ctaLabel="Subscribe 6 months"
            onSelect={() => buy("SIX_MONTH")}
            loading={checkout.isPending}
          />
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          {[
            { icon: FileText, label: "Multi-layer peer review", sub: "AI screening → L2 → L3 expert review" },
            { icon: Calendar, label: "Mock checkout for demo", sub: "No real payment processed" },
            { icon: Crown, label: "Cancel anytime", sub: "Demo: subscriptions don't auto-renew" },
          ].map((m) => (
            <div key={m.label} className="p-4">
              <m.icon className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="text-sm font-medium text-foreground">{m.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{m.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
