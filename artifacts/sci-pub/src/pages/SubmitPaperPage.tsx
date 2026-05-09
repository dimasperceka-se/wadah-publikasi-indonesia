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
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, PlusCircle, Send, FlaskConical, CheckCircle2,
  AlertTriangle, X, Info
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
      <div className="min-h-screen" style={{ background: "#05101f" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/my-papers")}
            className="text-slate-400 hover:text-white hover:bg-slate-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            My Papers
          </Button>

          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status={existingPaper.status} />
              </div>
              <h1 className="text-xl font-bold font-serif text-white">{existingPaper.title}</h1>
            </div>
            <div className="flex gap-2 shrink-0">
              {canSubmit && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/my-papers/${paperId}/edit`)}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => submitMutation.mutate({ id: paperId! })}
                    disabled={submitMutation.isPending}
                    className="font-semibold"
                    style={{ background: "linear-gradient(135deg, #c9a84c, #e8c96c)", color: "#0a1628" }}
                  >
                    <Send className="w-4 h-4 mr-1.5" />
                    {submitMutation.isPending ? "Submitting…" : "Submit for Review"}
                  </Button>
                </>
              )}
            </div>
          </div>

          {existingPaper.status === "REVISION_REQUESTED" && (
            <div className="flex items-start gap-3 p-4 bg-yellow-900/20 border border-yellow-700/40 rounded-xl mb-6">
              <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-300">Revisions Requested</p>
                <p className="text-xs text-yellow-400/70 mt-0.5">
                  A reviewer has requested changes. Edit your paper and resubmit.
                </p>
              </div>
            </div>
          )}

          {aiReport && (
            <Card className="bg-slate-900 border-slate-800 mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-amber-400" />
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
                    <div key={m.label} className="text-center p-3 bg-slate-800 rounded-lg">
                      <div className={`text-lg font-bold ${m.good ? "text-emerald-400" : "text-red-400"}`}>
                        {m.value}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">{m.label}</div>
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
                            ? "bg-red-900/20 border border-red-700/40 text-red-300"
                            : "bg-yellow-900/20 border border-yellow-700/40 text-yellow-300"
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
                  <div className="flex items-center gap-2 text-sm text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    All checks passed
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Review timeline */}
          {existingPaper.reviews && existingPaper.reviews.length > 0 && (
            <Card className="bg-slate-900 border-slate-800 mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base">Review Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {existingPaper.reviews.map((review: Record<string, unknown>) => (
                  <div key={review.id as number} className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          review.decision === "APPROVED"
                            ? "border-green-700 text-green-300"
                            : review.decision === "REVISION"
                              ? "border-yellow-700 text-yellow-300"
                              : "border-red-700 text-red-300"
                        }`}
                      >
                        Layer {review.layer as number} — {review.decision as string}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-300">{review.comments as string}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-5">
              <h3 className="font-semibold text-white mb-3">Abstract</h3>
              <p className="text-sm text-slate-300 leading-relaxed">{existingPaper.abstract}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#05101f" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/my-papers")}
          className="text-slate-400 hover:text-white hover:bg-slate-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          My Papers
        </Button>

        <h1 className="text-2xl font-bold font-serif text-white mb-2">
          {isEdit ? "Edit Paper" : "Submit New Paper"}
        </h1>
        <p className="text-slate-400 text-sm mb-8">
          {isEdit
            ? "Update your paper before resubmitting"
            : "Save as draft first, then submit for AI + peer review"}
        </p>

        {/* Submission info banner */}
        {!isEdit && (
          <div className="flex items-start gap-3 p-4 bg-blue-900/20 border border-blue-700/40 rounded-xl mb-6">
            <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-300">Three-Layer Review Process</p>
              <p className="text-xs text-blue-400/70 mt-0.5">
                Papers go through AI analysis → Layer 2 human review → Layer 3 expert review before publication.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-base">Paper Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Title *</Label>
                <Input
                  placeholder="Your paper's full title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="hover:bg-slate-800 focus:bg-slate-800">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Abstract *</Label>
                <Textarea
                  placeholder="A concise summary of your research (150-300 words)"
                  value={abstract}
                  onChange={(e) => setAbstract(e.target.value)}
                  rows={5}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Keywords</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a keyword…"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />
                  <Button
                    type="button"
                    onClick={addKeyword}
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 shrink-0"
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
                        className="border-slate-600 text-slate-300 bg-slate-800 gap-1 cursor-pointer hover:bg-slate-700"
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
                <Label className="text-slate-300">Co-Authors</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Dr. Jane Smith"
                    value={coAuthorInput}
                    onChange={(e) => setCoAuthorInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCoAuthor())}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />
                  <Button
                    type="button"
                    onClick={addCoAuthor}
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 shrink-0"
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
                        className="border-slate-600 text-slate-300 bg-slate-800 gap-1 cursor-pointer hover:bg-slate-700"
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
                <Label className="text-slate-300">PDF URL (optional)</Label>
                <Input
                  placeholder="https://example.com/your-paper.pdf"
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-base">Full Paper Content *</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500 mb-3">
                Include all sections: Abstract, Introduction, Methodology, Results, Conclusion, References. Minimum 3,000 words for AI review.
              </p>
              <Textarea
                placeholder="Paste or type your full paper here…"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={20}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 font-mono text-sm resize-y"
              />
              <p className="text-xs text-slate-500 mt-2">
                {content.trim().split(/\s+/).filter(Boolean).length.toLocaleString()} words
              </p>
            </CardContent>
          </Card>

          <Separator className="bg-slate-800" />

          <div className="flex items-center justify-end gap-3">
            <Button
              onClick={() => navigate("/my-papers")}
              variant="ghost"
              className="text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending || !title || !abstract || !content || !category}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving…" : isEdit ? "Save Changes" : "Save Draft"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
