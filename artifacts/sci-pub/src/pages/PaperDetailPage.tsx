import { useRoute, useLocation } from "wouter";
import { useGetPaper } from "@workspace/api-client-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Calendar, ExternalLink, User, Building2,
  FileText, CheckCircle2, XCircle, Clock, BookOpen,
  FlaskConical, MessageSquare
} from "lucide-react";

export default function PaperDetailPage() {
  const [, params] = useRoute("/papers/:id");
  const [, navigate] = useLocation();
  const id = parseInt(params?.id ?? "0", 10);

  const { data: paper, isLoading, isError } = useGetPaper(id);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#05101f" }}>
        <div className="text-center">
          <FlaskConical className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
          <p className="text-slate-400">Loading paper…</p>
        </div>
      </div>
    );
  }

  if (isError || !paper) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#05101f" }}>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-300 mb-2">Paper not found</h2>
          <Button onClick={() => navigate("/")} variant="outline" className="border-slate-700 text-slate-300">
            Back to Papers
          </Button>
        </div>
      </div>
    );
  }

  const aiReport = paper.aiReport as Record<string, unknown> | null;

  return (
    <div className="min-h-screen" style={{ background: "#05101f" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="text-slate-400 hover:text-white hover:bg-slate-800 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Papers
        </Button>

        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge variant="outline" className="border-slate-700 text-slate-400">
              {paper.category}
            </Badge>
            <StatusBadge status={paper.status} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-white leading-snug mb-4">
            {paper.title}
          </h1>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400 mb-4">
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4" />
              <span className="text-slate-200">{paper.authorName ?? "Unknown Author"}</span>
            </div>
            {(paper.coAuthors as string[]).length > 0 && (
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4" />
                <span>{(paper.coAuthors as string[]).join(", ")}</span>
              </div>
            )}
            {paper.publishedAt && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{new Date(paper.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
              </div>
            )}
          </div>

          {paper.doi && (
            <div className="flex items-center gap-2 p-3 bg-amber-900/10 border border-amber-700/30 rounded-lg mb-4">
              <ExternalLink className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-sm text-amber-300 font-mono">{paper.doi}</span>
            </div>
          )}

          {/* Keywords */}
          <div className="flex flex-wrap gap-1.5">
            {(paper.keywords as string[]).map((kw) => (
              <span
                key={kw}
                className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Abstract */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-400" />
                  Abstract
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 leading-relaxed">{paper.abstract}</p>
              </CardContent>
            </Card>

            {/* Full Content */}
            {paper.content && (
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-400" />
                    Full Paper
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-invert prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-slate-300 leading-relaxed">
                      {paper.content}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            {paper.reviews && paper.reviews.length > 0 && (
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-amber-400" />
                    Peer Reviews
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {paper.reviews.map((review: Record<string, unknown>) => (
                    <div key={review.id as number} className="p-4 bg-slate-800 border border-slate-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              review.decision === "APPROVED"
                                ? "border-green-700 text-green-300 bg-green-900/20"
                                : review.decision === "REVISION"
                                  ? "border-yellow-700 text-yellow-300 bg-yellow-900/20"
                                  : "border-red-700 text-red-300 bg-red-900/20"
                            }`}
                          >
                            {review.decision === "APPROVED" ? (
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                            ) : review.decision === "REVISION" ? (
                              <Clock className="w-3 h-3 mr-1" />
                            ) : (
                              <XCircle className="w-3 h-3 mr-1" />
                            )}
                            {String(review.decision)}
                          </Badge>
                          <span className="text-xs text-slate-400">Layer {review.layer as number}</span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {review.reviewerName as string}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">{review.comments as string}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* AI Report */}
            {aiReport && (
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-base flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-amber-400" />
                    AI Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Overall Score</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${aiReport.score as number}%`,
                            background: (aiReport.score as number) >= 75 ? "#22c55e" : "#ef4444",
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-white">{aiReport.score as number}/100</span>
                    </div>
                  </div>
                  {[
                    ["Grammar", aiReport.grammarScore as number],
                    ["Originality", 100 - (aiReport.aiGeneratedLikelihood as number)],
                    ["Plagiarism Free", 100 - (aiReport.plagiarismScore as number)],
                  ].map(([label, val]) => (
                    <div key={label as string} className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">{label as string}</span>
                      <span className="text-slate-200">{val as number}%</span>
                    </div>
                  ))}
                  <Separator className="bg-slate-800" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Word Count</span>
                    <span className="text-slate-200">{(aiReport.wordCount as number).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Structure</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${aiReport.structureComplete ? "border-green-700 text-green-300" : "border-red-700 text-red-300"}`}
                    >
                      {aiReport.structureComplete ? "Complete" : "Incomplete"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status history */}
            {paper.statusHistory && paper.statusHistory.length > 0 && (
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-base">Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {paper.statusHistory.map((h: Record<string, unknown>, i: number) => (
                      <div key={h.id as number} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background: "#c9a84c" }} />
                          {i < paper.statusHistory.length - 1 && (
                            <div className="w-px flex-1 mt-1" style={{ background: "rgba(201,168,76,0.2)" }} />
                          )}
                        </div>
                        <div className="pb-3">
                          <StatusBadge status={h.toStatus as string} />
                          {h.note && (
                            <p className="text-xs text-slate-500 mt-1">{h.note as string}</p>
                          )}
                          <p className="text-[10px] text-slate-600 mt-0.5">
                            {new Date(h.createdAt as string).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* PDF link */}
            {paper.pdfUrl && (
              <a
                href={paper.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full p-3 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all text-sm font-medium"
              >
                <FileText className="w-4 h-4" />
                View PDF
                <ExternalLink className="w-3 h-3 ml-auto" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
