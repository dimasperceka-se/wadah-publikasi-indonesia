import { useState } from "react";
import { useLocation } from "wouter";
import { useListPublishedPapers, useGetPaperStats } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/StatusBadge";
import {
  Search, PlusCircle, BookOpen, Users, Globe, FlaskConical,
  Calendar, ExternalLink, ArrowRight
} from "lucide-react";

const CATEGORIES = [
  "All", "Computer Science", "Physics", "Biology", "Chemistry",
  "Mathematics", "Environmental Science", "Medicine", "Engineering", "Social Sciences"
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
    <div className="min-h-screen" style={{ background: "#05101f" }}>
      {/* Hero */}
      <section
        className="relative py-20 px-4 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0a1628 0%, #0d1e35 50%, #0a1628 100%)" }}
      >
        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "linear-gradient(rgba(201,168,76,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.3) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <Badge className="border border-amber-700/50 bg-amber-900/20 text-amber-300 px-4 py-1 text-sm">
              Multi-layer Peer Review Platform
            </Badge>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold font-serif text-white mb-4 leading-tight">
            Advancing Science,<br />
            <span style={{ color: "#c9a84c" }}>One Paper at a Time</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-8">
            SciPub combines AI-powered analysis with expert human review to ensure
            the highest standards in scientific publication.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isAuth ? (
              <Button
                size="lg"
                onClick={() => navigate("/my-papers/new")}
                className="font-semibold px-8"
                style={{ background: "linear-gradient(135deg, #c9a84c, #e8c96c)", color: "#0a1628" }}
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                Submit a Paper
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={() => navigate("/login")}
                className="font-semibold px-8"
                style={{ background: "linear-gradient(135deg, #c9a84c, #e8c96c)", color: "#0a1628" }}
              >
                Get Started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            )}
            <Button
              size="lg"
              variant="outline"
              onClick={() => document.getElementById("papers-section")?.scrollIntoView({ behavior: "smooth" })}
              className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white px-8"
            >
              Browse Papers
            </Button>
          </div>

          {/* Stats row */}
          {stats && (
            <div className="mt-12 grid grid-cols-3 gap-4 max-w-lg mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.totalPublished}</div>
                <div className="text-sm text-slate-400 flex items-center justify-center gap-1 mt-0.5">
                  <BookOpen className="w-3.5 h-3.5" /> Papers
                </div>
              </div>
              <div className="text-center border-x border-slate-700">
                <div className="text-3xl font-bold text-white">{stats.totalUsers}</div>
                <div className="text-sm text-slate-400 flex items-center justify-center gap-1 mt-0.5">
                  <Users className="w-3.5 h-3.5" /> Researchers
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{stats.totalSubmitted}</div>
                <div className="text-sm text-slate-400 flex items-center justify-center gap-1 mt-0.5">
                  <Globe className="w-3.5 h-3.5" /> Submissions
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Papers Section */}
      <section id="papers-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search & filters */}
        <div className="flex flex-col gap-4 mb-8">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by title or abstract…"
                className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <Button type="submit" className="shrink-0" style={{ background: "#c9a84c", color: "#0a1628" }}>
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
                      ? "border-amber-500 bg-amber-900/30 text-amber-300"
                      : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Papers grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-slate-900 border-slate-800 animate-pulse">
                <CardContent className="p-5">
                  <div className="h-4 bg-slate-800 rounded mb-3 w-20" />
                  <div className="h-5 bg-slate-800 rounded mb-2" />
                  <div className="h-5 bg-slate-800 rounded mb-4 w-4/5" />
                  <div className="h-3 bg-slate-800 rounded mb-1" />
                  <div className="h-3 bg-slate-800 rounded w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : data?.papers.length === 0 ? (
          <div className="text-center py-20">
            <FlaskConical className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">No papers found</h3>
            <p className="text-slate-500">
              {search || category ? "Try adjusting your search or filters" : "Be the first to publish a paper!"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.papers.map((paper) => (
                <Card
                  key={paper.id}
                  className="group bg-slate-900 border-slate-800 hover:border-amber-700/50 transition-all cursor-pointer hover:shadow-lg hover:shadow-amber-900/10"
                  onClick={() => navigate(`/papers/${paper.id}`)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <Badge
                        variant="outline"
                        className="text-xs border-slate-700 text-slate-400 shrink-0"
                      >
                        {paper.category}
                      </Badge>
                      <StatusBadge status={paper.status} />
                    </div>
                    <h3 className="font-semibold text-white text-sm leading-snug mb-2 group-hover:text-amber-300 transition-colors line-clamp-2">
                      {paper.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-4">
                      {paper.abstract}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(paper.keywords as string[]).slice(0, 3).map((kw) => (
                        <span
                          key={kw}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                      <div className="text-xs text-slate-500">
                        <span className="text-slate-300 font-medium">{paper.authorName ?? "Unknown"}</span>
                      </div>
                      {paper.publishedAt && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Calendar className="w-3 h-3" />
                          {new Date(paper.publishedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                        </div>
                      )}
                    </div>
                    {paper.doi && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-amber-500/70">
                        <ExternalLink className="w-3 h-3" />
                        <span className="font-mono truncate">{paper.doi}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {data && data.total > (data.limit ?? 9) && (
              <div className="flex justify-center items-center gap-4 mt-10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Previous
                </Button>
                <span className="text-sm text-slate-400">
                  Page {page} of {Math.ceil(data.total / (data.limit ?? 9))}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(data.total / (data.limit ?? 9))}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
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
