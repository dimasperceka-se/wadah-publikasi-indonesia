import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-slate-700/40 text-slate-300 border-slate-600" },
  SUBMITTED: { label: "Submitted", className: "bg-blue-900/40 text-blue-300 border-blue-700" },
  AI_REVIEW: { label: "AI Review", className: "bg-purple-900/40 text-purple-300 border-purple-700" },
  AI_PASSED: { label: "AI Passed", className: "bg-teal-900/40 text-teal-300 border-teal-700" },
  AI_FAILED: { label: "AI Failed", className: "bg-red-900/40 text-red-300 border-red-700" },
  LAYER_2_REVIEW: { label: "Layer 2 Review", className: "bg-amber-900/40 text-amber-300 border-amber-700" },
  LAYER_2_APPROVED: { label: "L2 Approved", className: "bg-green-900/40 text-green-300 border-green-700" },
  LAYER_3_REVIEW: { label: "Layer 3 Review", className: "bg-orange-900/40 text-orange-300 border-orange-700" },
  LAYER_3_APPROVED: { label: "L3 Approved", className: "bg-emerald-900/40 text-emerald-300 border-emerald-700" },
  REVISION_REQUESTED: { label: "Revision Needed", className: "bg-yellow-900/40 text-yellow-300 border-yellow-700" },
  REJECTED: { label: "Rejected", className: "bg-red-900/60 text-red-200 border-red-700" },
  PUBLISHED: { label: "Published", className: "bg-emerald-900/60 text-emerald-200 border-emerald-600" },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: "bg-slate-700 text-slate-300 border-slate-600" };
  return (
    <Badge variant="outline" className={`text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </Badge>
  );
}
