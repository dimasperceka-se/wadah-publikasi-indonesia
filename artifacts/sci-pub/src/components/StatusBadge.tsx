import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-muted text-muted-foreground border-border" },
  SUBMITTED: { label: "Submitted", className: "bg-sky-100 text-sky-700 border-sky-200" },
  AI_REVIEW: { label: "AI Review", className: "bg-violet-100 text-violet-700 border-violet-200" },
  AI_PASSED: { label: "AI Passed", className: "bg-teal-100 text-teal-700 border-teal-200" },
  AI_FAILED: { label: "AI Failed", className: "bg-red-100 text-red-700 border-red-200" },
  LAYER_2_REVIEW: { label: "Layer 2 Review", className: "bg-amber-100 text-amber-700 border-amber-200" },
  LAYER_2_APPROVED: { label: "L2 Approved", className: "bg-green-100 text-green-700 border-green-200" },
  LAYER_3_REVIEW: { label: "Layer 3 Review", className: "bg-orange-100 text-orange-700 border-orange-200" },
  LAYER_3_APPROVED: { label: "L3 Approved", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  REVISION_REQUESTED: { label: "Revision Needed", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  REJECTED: { label: "Rejected", className: "bg-red-100 text-red-700 border-red-300" },
  PUBLISHED: { label: "Published", className: "bg-emerald-100 text-emerald-700 border-emerald-300" },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: "bg-muted text-muted-foreground border-border" };
  return (
    <Badge variant="outline" className={`text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </Badge>
  );
}
