import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import {
  useCreatePaper,
  useGetMyPaper,
  useUpdatePaper,
  useSubmitPaper,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/StatusBadge";
import { useBillingMe } from "@/lib/billing";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, PlusCircle, Send, FlaskConical, CheckCircle2,
  AlertTriangle, X, Info, Crown, Tag,
} from "lucide-react";

const CATEGORIES = [
  "Computer Science", "Physics", "Biology", "Chemistry",
  "Mathematics", "Environmental Science", "Medicine", "Engineering", "Social Sciences"
];

export default function SubmitPaperPage() {
  const [, navigate] = useLocation();
  const [matchEdit, paramsEdit] = useRoute("/my-papers/:id/edit");
  const [matchDetail, paramsDetail] = useRoute("/my-papers/:id");
  const { toast } = useToast();

  const isEdit = matchEdit && paramsEdit?.id !== "new";
  const isDetail = matchDetail && paramsDetail?.id !== "new" && !matchEdit;
  const paperId = isEdit ? parseInt(paramsEdit!.id, 10) : isDetail ? parseInt(paramsDetail!.id, 10) : null;

  const { data: existingPaper } = useGetMyPaper(paperId ?? 0, {
    query: { enabled: !!paperId },
  });

  const { data: billing } = useBillingMe();

  const [title, setTitle] = useState(existingPaper?.title ?? "");
  const [abstract, setAbstract] = useState(existingPaper?.abstract ?? "");
  const [content, setContent] = useState(existingPaper?.content ?? "");
  const [category, setCategory] = useState(existingPaper?.category ?? "");
  const [pdfUrl, setPdfUrl] = useState(existingPaper?.pdfUrl ?? "");
  const [keywordInput, setKeywordInput] = useState("");
  const [keywords, setKeywords] = useState<string[]>(
    existingPaper?.keywords ? (existingPaper.keywords as string[]) : []
  );
  const [coAuthors, setCoAuthors] = useState<string[]>(
    existingPaper?.coAuthors ? (existingPaper.coAuthors as string[]) : []
  );
  const [coAuthorInput, setCoAuthorInput] = useState("");

  const createMutation = useCreatePaper({
    mutation: {
      onSuccess(data) {
        toast({ title: "Paper saved as draft", description: "You can now submit it for review" });
        navigate(`/my-papers/${data.id}`);
      },
      onError(err) {
        toast({ title: "Failed to save", description: (err as Error).message, variant: "destructive" });
      },
    },
  });

  const updateMutation = useUpdatePaper({
    mutation: {
      onSuccess() {
        toast({ title: "Paper updated" });
        navigate(`/my-papers/${paperId}`);
      },
      onError(err) {
        toast({ title: "Update failed", description: (err as Error).message, variant: "destructive" });
      },
    },
  });

  const submitMutation = useSubmitPaper({
    mutation: {
      onSuccess() {
        toast({
          title: "Paper submitted!",
          description: "Your paper is now undergoing AI review. This may take a minute.",
        });
        navigate("/my-papers");
      },
      onError(err) {
        toast({ title: "Submission failed", description: (err as Error).message, variant: "destructive" });
      },
    },
  });

  function addKeyword() {
    const kw = keywordInput.trim();
    if (kw && !keywords.includes(kw)) {
      setKeywords([...keywords, kw]);
      setKeywordInput("");
    }
  }

  function removeKeyword(kw: string) {
    setKeywords(keywords.filter((k) => k !== kw));
  }

  function addCoAuthor() {
    const ca = coAuthorInput.trim();
    if (ca && !coAuthors.includes(ca)) {
      setCoAuthors([...coAuthors, ca]);
      setCoAuthorInput("");
    }
  }

  function removeCoAuthor(ca: string) {
    setCoAuthors(coAuthors.filter((c) => c !== ca));
  }

  function handleSave() {
    const data = { title, abstract, content, category, pdfUrl, keywords, coAuthors };
    if (isEdit && paperId) {
      updateMutation.mutate({ id: paperId, data });
    } else {
      createMutation.mutate({ data });
    }
  }

  // Detail view (read-only with submit button)
  if (isDetail && existingPaper) {
    const aiReport = existingPaper.aiReport as Record<string, unknown> | null;
    const canSubmit = ["DRAFT", "REVISION_REQUESTED"].includes(existingPaper.status);

    return (
      <div className="min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/my-papers")}
            className="text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            My Papers
          </Button>

          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status={existingPaper.status} />
              </div>
              <h1 className="text-xl font-bold font-display text-foreground">{existingPaper.title}</h1>
            </div>
            <div className="flex gap-2 shrink-0">
              {canSubmit && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/my-papers/${paperId}/edit`)}
                  >
                    Edit
                  </Button>
                  {billing?.canSubmit ? (
                    <Button
                      size="sm"
                      onClick={() => submitMutation.mutate({ id: paperId! })}
                      disabled={submitMutation.isPending}
                      className="font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Send className="w-4 h-4 mr-1.5" />
                      {submitMutation.isPending ? "Submitting…" : "Submit for Review"}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => navigate(`/pricing?returnTo=/my-papers/${paperId}`)}
                      className="font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Tag className="w-4 h-4 mr-1.5" />
                      Choose a plan to submit
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>

          {canSubmit && (
            billing?.canSubmit && billing.active ? (
              <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl mb-6">
                <Crown className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-emerald-700">
                    {billing.active.plan === "SIX_MONTH" ? "6-month subscription active" : "Pay-as-you-go credit ready"}
                  </p>
                  <p className="text-xs text-emerald-700/80 mt-0.5">
                    {billing.active.submissionsRemaining} of {billing.active.submissionsQuota} submissions remaining
                    {billing.active.expiresAt && ` · expires ${new Date(billing.active.expiresAt).toLocaleDateString()}`}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6">
                <Tag className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-700">No active plan</p>
                  <p className="text-xs text-amber-700/80 mt-0.5">
                    You need a Pay-as-you-go credit ($101) or 6-month subscription ($269 / 8 papers) to submit this paper for review.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => navigate(`/pricing?returnTo=/my-papers/${paperId}`)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
                >
                  View plans
                </Button>
              </div>
            )
          )}

          {existingPaper.status === "REVISION_REQUESTED" && (
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl mb-6">
              <AlertTriangle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-700">Revisions Requested</p>
                <p className="text-xs text-yellow-600/70 mt-0.5">
                  A reviewer has requested changes. Edit your paper and resubmit.
                </p>
              </div>
            </div>
          )}

          {aiReport && (
            <Card className="glass-card mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-foreground text-base flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-primary" />
                  AI Review Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                  {[
                    { label: "Score", value: `${aiReport.score}/100`, good: (aiReport.score as number) >= 75 },
                    { label: "Grammar", value: `${aiReport.grammarScore}%`, good: (aiReport.grammarScore as number) >= 70 },
                    { label: "Word Count", value: (aiReport.wordCount as number).toLocaleString(), good: true },
                    { label: "Plagiarism", value: `${aiReport.plagiarismScore}%`, good: (aiReport.plagiarismScore as number) <= 20 },
                  ].map((m) => (
                    <div key={m.label} className="text-center p-3 bg-muted rounded-lg">
                      <div className={`text-lg font-bold ${m.good ? "text-emerald-600" : "text-red-600"}`}>
                        {m.value}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{m.label}</div>
                    </div>
                  ))}
                </div>
                {(aiReport.issues as unknown[]).length > 0 && (
                  <div className="space-y-2">
                    {(aiReport.issues as Record<string, string>[]).map((issue, i) => (
                      <div
                        key={i}
                        className={`flex items-start gap-2 p-2.5 rounded-lg text-xs ${
                          issue.severity === "critical"
                            ? "bg-red-50 border border-red-200 text-red-700"
                            : "bg-yellow-50 border border-yellow-200 text-yellow-700"
                        }`}
                      >
                        {issue.severity === "critical" ? (
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        )}
                        {issue.message}
                      </div>
                    ))}
                  </div>
                )}
                {(aiReport.issues as unknown[]).length === 0 && (
                  <div className="flex items-center gap-2 text-sm text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                    All checks passed
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Review timeline */}
          {existingPaper.reviews && existingPaper.reviews.length > 0 && (
            <Card className="glass-card mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-foreground text-base">Review Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {existingPaper.reviews.map((review: Record<string, unknown>) => (
                  <div key={review.id as number} className="p-4 bg-muted border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          review.decision === "APPROVED"
                            ? "border-green-300 bg-green-50 text-green-700"
                            : review.decision === "REVISION"
                              ? "border-yellow-300 bg-yellow-50 text-yellow-700"
                              : "border-red-700 text-red-300"
                        }`}
                      >
                        Layer {review.layer as number} — {review.decision as string}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground">{review.comments as string}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="glass-card">
            <CardContent className="p-5">
              <h3 className="font-semibold text-foreground mb-3">Abstract</h3>
              <p className="text-sm text-foreground leading-relaxed">{existingPaper.abstract}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/my-papers")}
          className="text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          My Papers
        </Button>

        <h1 className="text-2xl font-bold font-display text-foreground mb-2">
          {isEdit ? "Edit Paper" : "Submit New Paper"}
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          {isEdit
            ? "Update your paper before resubmitting"
            : "Save as draft first, then submit for AI + peer review"}
        </p>

        {/* Submission info banner */}
        {!isEdit && (
          <div className="flex items-start gap-3 p-4 bg-sky-50 border border-sky-200 rounded-xl mb-6">
            <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-sky-700">Three-Layer Review Process</p>
              <p className="text-xs text-sky-600/70 mt-0.5">
                Papers go through AI analysis → Layer 2 human review → Layer 3 expert review before publication.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-foreground text-base">Paper Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="">Title *</Label>
                <Input
                  placeholder="Your paper's full title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className=""
                />
              </div>

              <div className="space-y-2">
                <Label className="">Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="">Abstract *</Label>
                <Textarea
                  placeholder="A concise summary of your research (150-300 words)"
                  value={abstract}
                  onChange={(e) => setAbstract(e.target.value)}
                  rows={5}
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label className="">Keywords</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a keyword…"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                    className=""
                  />
                  <Button
                    type="button"
                    onClick={addKeyword}
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </Button>
                </div>
                {keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {keywords.map((kw) => (
                      <Badge
                        key={kw}
                        variant="outline"
                        className="bg-muted text-foreground gap-1 cursor-pointer hover:bg-muted/80"
                        onClick={() => removeKeyword(kw)}
                      >
                        {kw}
                        <X className="w-3 h-3" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="">Co-Authors</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Dr. Jane Smith"
                    value={coAuthorInput}
                    onChange={(e) => setCoAuthorInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCoAuthor())}
                    className=""
                  />
                  <Button
                    type="button"
                    onClick={addCoAuthor}
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </Button>
                </div>
                {coAuthors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {coAuthors.map((ca) => (
                      <Badge
                        key={ca}
                        variant="outline"
                        className="bg-muted text-foreground gap-1 cursor-pointer hover:bg-muted/80"
                        onClick={() => removeCoAuthor(ca)}
                      >
                        {ca}
                        <X className="w-3 h-3" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="">PDF URL (optional)</Label>
                <Input
                  placeholder="https://example.com/your-paper.pdf"
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                  className=""
                />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-foreground text-base">Full Paper Content *</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                Include all sections: Abstract, Introduction, Methodology, Results, Conclusion, References. Minimum 3,000 words for AI review.
              </p>
              <Textarea
                placeholder="Paste or type your full paper here…"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={20}
                className="font-mono text-sm resize-y"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {content.trim().split(/\s+/).filter(Boolean).length.toLocaleString()} words
              </p>
            </CardContent>
          </Card>

          <Separator className="bg-muted" />

          <div className="flex items-center justify-end gap-3">
            <Button
              onClick={() => navigate("/my-papers")}
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending || !title || !abstract || !content || !category}
              variant="outline"
              className=""
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving…" : isEdit ? "Save Changes" : "Save Draft"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
