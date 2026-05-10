import { useState } from "react";
import { useLocation } from "wouter";
import { useListPublishedPapers, useGetPaperStats } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Search, PlusCircle, BookOpen, Users, Globe, FlaskConical,
  Calendar, ExternalLink, ArrowRight,
} from "lucide-react";

const CATEGORIES = [
  "All", "Computer Science", "Physics", "Biology", "Chemistry",
  "Mathematics", "Environmental Science", "Medicine", "Engineering", "Social Sciences",
];

export default function HomePage() {
  const [, navigate] = useLocation();
  const { isAuth } = useAuth();
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useListPublishedPapers({
    search: search || undefined,
    category: category || undefined,
    page,
    limit: 9,
  });

  const { data: stats } = useGetPaperStats();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary px-4 py-1 text-sm">
              Multi-layer Peer Review Platform
            </Badge>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold font-display text-foreground mb-4 leading-tight">
            Advancing Science,<br />
            <span className="text-gradient">One Paper at a Time</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            SciPub combines AI-powered analysis with expert human review to ensure
            the highest standards in scientific publication.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isAuth ? (
              <Button
                size="lg"
                onClick={() => navigate("/my-papers/new")}
                className="font-semibold px-8 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                Submit a Paper
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={() => navigate("/login")}
                className="font-semibold px-8 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            )}
            <Button
              size="lg"
              variant="outline"
              onClick={() => document.getElementById("papers-section")?.scrollIntoView({ behavior: "smooth" })}
              className="px-8"
            >
              Browse Papers
            </Button>
          </div>

          {stats && (
            <div className="mt-12 grid grid-cols-3 gap-4 max-w-lg mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">{stats.totalPublished}</div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                  <BookOpen className="w-3.5 h-3.5" /> Papers
                </div>
              </div>
              <div className="text-center border-x border-border">
                <div className="text-3xl font-bold text-foreground">{stats.totalUsers}</div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                  <Users className="w-3.5 h-3.5" /> Researchers
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">{stats.totalSubmitted}</div>
                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
                  <Globe className="w-3.5 h-3.5" /> Submissions
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Papers Section */}
      <section id="papers-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col gap-4 mb-8">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by title or abstract…"
                className="pl-9"
              />
            </div>
            <Button type="submit" className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90">
              Search
            </Button>
          </form>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const active = (cat === "All" ? "" : cat) === category;
              return (
                <button
                  key={cat}
                  onClick={() => { setCategory(cat === "All" ? "" : cat); setPage(1); }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-5">
                  <div className="h-4 bg-muted rounded mb-3 w-20" />
                  <div className="h-5 bg-muted rounded mb-2" />
                  <div className="h-5 bg-muted rounded mb-4 w-4/5" />
                  <div className="h-3 bg-muted rounded mb-1" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : data?.papers.length === 0 ? (
          <div className="text-center py-20">
            <FlaskConical className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No papers found</h3>
            <p className="text-muted-foreground">
              {search || category ? "Try adjusting your search or filters" : "Be the first to publish a paper!"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.papers.map((paper) => (
                <Card
                  key={paper.id}
                  className="group glass-card hover:border-primary/40 transition-all cursor-pointer hover:shadow-lg"
                  onClick={() => navigate(`/papers/${paper.id}`)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <Badge variant="outline" className="text-xs">
                        {paper.category}
                      </Badge>
                      <StatusBadge status={paper.status} />
                    </div>
                    <h3 className="font-semibold text-foreground text-sm leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {paper.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mb-4">
                      {paper.abstract}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(paper.keywords as string[]).slice(0, 3).map((kw) => (
                        <span
                          key={kw}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="text-xs text-muted-foreground">
                        <span className="text-foreground font-medium">{paper.authorName ?? "Unknown"}</span>
                      </div>
                      {paper.publishedAt && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(paper.publishedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                        </div>
                      )}
                    </div>
                    {paper.doi && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-accent">
                        <ExternalLink className="w-3 h-3" />
                        <span className="font-mono truncate">{paper.doi}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {data && data.total > (data.limit ?? 9) && (
              <div className="flex justify-center items-center gap-4 mt-10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {Math.ceil(data.total / (data.limit ?? 9))}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(data.total / (data.limit ?? 9))}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
