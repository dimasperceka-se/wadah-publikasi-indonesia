import { useState } from "react";
import { useLocation } from "wouter";
import { useGetVerifierQueue, useSubmitReview } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Shield, CheckCircle2, XCircle, Clock, FlaskConical, ArrowRight } from "lucide-react";

interface QueuePaper {
  id: number;
  title: string;
  abstract: string;
  category: string;
  status: string;
  authorName: string;
  keywords: string[];
  aiReport: Record<string, unknown> | null;
  updatedAt: string;
}

export default function VerifierDashboard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: queue, isLoading, refetch } = useGetVerifierQueue();

  const [selectedPaper, setSelectedPaper] = useState<QueuePaper | null>(null);
  const [decision, setDecision] = useState<"APPROVED" | "REVISION" | "REJECTED" | "">("");
  const [comments, setComments] = useState("");

  const reviewMutation = useSubmitReview({
    mutation: {
      onSuccess() {
        toast({
          title: "Review submitted",
          description: "The paper status has been updated.",
        });
        setSelectedPaper(null);
        setDecision("");
        setComments("");
        refetch();
      },
      onError(err) {
        toast({ title: "Review failed", description: (err as Error).message, variant: "destructive" });
      },
    },
  });

  function handleReview() {
    if (!selectedPaper || !decision || !comments.trim()) return;
    reviewMutation.mutate({
      id: selectedPaper.id,
      data: { decision, comments },
    });
  }

  const layerLabel = user?.verifierLayer
    ? `Layer ${user.verifierLayer} Reviewer`
    : user?.role === "ADMIN"
      ? "Admin Reviewer"
      : "Reviewer";

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-primary" />
              <h1 className="text-2xl font-bold font-display text-foreground">Review Queue</h1>
            </div>
            <p className="text-muted-foreground text-sm">{layerLabel} — {queue?.length ?? 0} papers awaiting review</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6 h-28" />
              </Card>
            ))}
          </div>
        ) : !queue || queue.length === 0 ? (
          <div className="text-center py-20">
            <FlaskConical className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Queue is clear</h3>
            <p className="text-muted-foreground">No papers assigned to you at this time</p>
          </div>
        ) : (
          <div className="space-y-4">
            {queue.map((paper) => {
              const p = paper as unknown as QueuePaper;
              const aiReport = p.aiReport;
              return (
                <Card key={p.id} className="glass-card hover:border-primary/30 transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <StatusBadge status={p.status} />
                          <Badge variant="outline" className="text-xs">{p.category}</Badge>
                        </div>
                        <h3 className="font-semibold text-foreground text-sm leading-snug mb-1 line-clamp-1">
                          {p.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                          {p.abstract}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>by <span className="text-foreground">{p.authorName}</span></span>
                          {aiReport && (
                            <span
                              className={`flex items-center gap-1 ${(aiReport.score as number) >= 75 ? "text-emerald-600" : "text-red-600"}`}
                            >
                              <FlaskConical className="w-3 h-3" />
                              AI Score: {aiReport.score as number}/100
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/papers/${p.id}`)}
                          className="text-muted-foreground hover:text-foreground text-xs"
                        >
                          View
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedPaper(p);
                            setDecision("");
                            setComments("");
                          }}
                          className="font-semibold text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          Review
                        </Button>
                      </div>
                    </div>

                    {aiReport && (
                      <div className="mt-3 pt-3 border-t border-border grid grid-cols-4 gap-2">
                        {[
                          { label: "Score", value: `${aiReport.score}/100` },
                          { label: "Grammar", value: `${aiReport.grammarScore}%` },
                          { label: "Originality", value: `${100 - (aiReport.aiGeneratedLikelihood as number)}%` },
                          { label: "Words", value: (aiReport.wordCount as number).toLocaleString() },
                        ].map((m) => (
                          <div key={m.label} className="text-center">
                            <div className="text-xs font-semibold text-foreground">{m.value}</div>
                            <div className="text-[10px] text-muted-foreground">{m.label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={!!selectedPaper} onOpenChange={(open) => !open && setSelectedPaper(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display text-lg">Submit Review</DialogTitle>
            </DialogHeader>
            {selectedPaper && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-foreground line-clamp-2">{selectedPaper.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">by {selectedPaper.authorName}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Decision *</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "APPROVED", label: "Approve", icon: CheckCircle2, color: "green" },
                      { value: "REVISION", label: "Revision", icon: Clock, color: "yellow" },
                      { value: "REJECTED", label: "Reject", icon: XCircle, color: "red" },
                    ].map(({ value, label, icon: Icon, color }) => (
                      <button
                        key={value}
                        onClick={() => setDecision(value as typeof decision)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all ${
                          decision === value
                            ? color === "green"
                              ? "border-green-400 bg-green-50 text-green-700"
                              : color === "yellow"
                                ? "border-yellow-400 bg-yellow-50 text-yellow-700"
                                : "border-red-400 bg-red-50 text-red-700"
                            : "border-border bg-card text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Review Comments *</p>
                  <Textarea
                    placeholder="Provide detailed feedback for the author…"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={5}
                    className="resize-none"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setSelectedPaper(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReview}
                disabled={!decision || !comments.trim() || reviewMutation.isPending}
                className="font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {reviewMutation.isPending ? "Submitting…" : "Submit Review"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
