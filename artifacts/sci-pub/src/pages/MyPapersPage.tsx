import { useLocation } from "wouter";
import { useListMyPapers } from "@workspace/api-client-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, FlaskConical, ArrowRight, Calendar, Edit3 } from "lucide-react";

export default function MyPapersPage() {
  const [, navigate] = useLocation();
  const { data: papers, isLoading } = useListMyPapers();

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground mb-1">My Papers</h1>
            <p className="text-muted-foreground text-sm">Manage your submitted research</p>
          </div>
          <Button
            onClick={() => navigate("/my-papers/new")}
            className="font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Submit New Paper
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6 h-24" />
              </Card>
            ))}
          </div>
        ) : !papers || papers.length === 0 ? (
          <div className="text-center py-20">
            <FlaskConical className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No papers yet</h3>
            <p className="text-muted-foreground mb-6">Start submitting your research to SciPub</p>
            <Button
              onClick={() => navigate("/my-papers/new")}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              Submit Your First Paper
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {papers.map((paper) => (
              <Card
                key={paper.id}
                className="glass-card hover:border-primary/30 transition-all"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <StatusBadge status={paper.status} />
                        <Badge variant="outline" className="text-xs">
                          {paper.category}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-foreground text-sm leading-snug mb-1 line-clamp-1">
                        {paper.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {paper.abstract}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(paper.updatedAt ?? paper.createdAt).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric"
                          })}
                        </span>
                        {(paper.keywords as string[]).slice(0, 2).map((kw) => (
                          <span key={kw} className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      {["DRAFT", "REVISION_REQUESTED"].includes(paper.status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/my-papers/${paper.id}/edit`)}
                          className="text-xs"
                        >
                          <Edit3 className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/my-papers/${paper.id}`)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        View
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
