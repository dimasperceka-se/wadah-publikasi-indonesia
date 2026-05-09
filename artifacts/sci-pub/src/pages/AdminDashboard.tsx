import { useState } from "react";
import { useLocation } from "wouter";
import {
  useAdminListPapers,
  useAdminListUsers,
  useAssignVerifier,
  useAdminUpdateUserRole,
  useGetAnalytics,
} from "@workspace/api-client-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard, Users, BookOpen, BarChart3, UserCheck,
  FlaskConical, ArrowRight, CheckCircle2
} from "lucide-react";

const PAPER_STATUSES = [
  "All", "DRAFT", "SUBMITTED", "AI_REVIEW", "AI_PASSED", "AI_FAILED",
  "LAYER_2_REVIEW", "LAYER_2_APPROVED", "LAYER_3_REVIEW", "LAYER_3_APPROVED",
  "REVISION_REQUESTED", "REJECTED", "PUBLISHED"
];

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-red-900/30 text-red-300 border-red-700",
  VERIFIER: "bg-blue-900/30 text-blue-300 border-blue-700",
  USER: "bg-emerald-900/30 text-emerald-300 border-emerald-700",
};

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState("");
  const [paperPage, setPaperPage] = useState(1);

  const { data: papersData, refetch: refetchPapers } = useAdminListPapers({
    status: statusFilter || undefined,
    page: paperPage,
    limit: 15,
  });

  const { data: users, refetch: refetchUsers } = useAdminListUsers();
  const { data: analytics } = useGetAnalytics();

  const verifiers = users?.filter((u) => u.role === "VERIFIER" || u.role === "ADMIN") ?? [];

  const assignMutation = useAssignVerifier({
    mutation: {
      onSuccess() {
        toast({ title: "Verifier assigned" });
        refetchPapers();
      },
      onError(err) {
        toast({ title: "Failed to assign", description: (err as Error).message, variant: "destructive" });
      },
    },
  });

  const updateRoleMutation = useAdminUpdateUserRole({
    mutation: {
      onSuccess() {
        toast({ title: "User role updated" });
        refetchUsers();
      },
      onError(err) {
        toast({ title: "Update failed", description: (err as Error).message, variant: "destructive" });
      },
    },
  });

  return (
    <div className="min-h-screen" style={{ background: "#05101f" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <LayoutDashboard className="w-6 h-6 text-amber-400" />
          <h1 className="text-2xl font-bold font-serif text-white">Admin Dashboard</h1>
        </div>

        {/* Analytics cards */}
        {analytics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Papers", value: analytics.totalPapers, icon: BookOpen, color: "text-blue-400" },
              { label: "Total Users", value: analytics.totalUsers, icon: Users, color: "text-emerald-400" },
              { label: "Published", value: analytics.statusBreakdown.find((s) => s.status === "PUBLISHED")?.count ?? 0, icon: CheckCircle2, color: "text-amber-400" },
              { label: "Acceptance Rate", value: `${analytics.acceptanceRate}%`, icon: BarChart3, color: "text-purple-400" },
            ].map((m) => (
              <Card key={m.label} className="bg-slate-900 border-slate-800">
                <CardContent className="p-5 flex items-center gap-4">
                  <m.icon className={`w-8 h-8 ${m.color} shrink-0`} />
                  <div>
                    <div className="text-2xl font-bold text-white">{m.value}</div>
                    <div className="text-xs text-slate-400">{m.label}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Status breakdown */}
        {analytics && (
          <Card className="bg-slate-900 border-slate-800 mb-8">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base">Paper Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {analytics.statusBreakdown.map((s) => (
                  <div
                    key={s.status}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg border border-slate-700"
                  >
                    <StatusBadge status={s.status} />
                    <span className="text-sm font-bold text-white">{s.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="papers">
          <TabsList className="bg-slate-800 border border-slate-700 mb-6">
            <TabsTrigger value="papers" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-white">
              <BookOpen className="w-4 h-4 mr-1.5" />
              Papers
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-slate-700 text-slate-300 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-1.5" />
              Users
            </TabsTrigger>
          </TabsList>

          {/* Papers Tab */}
          <TabsContent value="papers">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {PAPER_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s === "All" ? "" : s); setPaperPage(1); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    (s === "All" ? "" : s) === statusFilter
                      ? "border-amber-500 bg-amber-900/30 text-amber-300"
                      : "border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {papersData?.papers.map((paper) => (
                <Card key={paper.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <StatusBadge status={paper.status} />
                          <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-500">
                            {paper.category}
                          </Badge>
                        </div>
                        <h3 className="font-medium text-white text-sm line-clamp-1 mb-0.5">
                          {paper.title}
                        </h3>
                        <p className="text-xs text-slate-500">
                          by <span className="text-slate-300">{paper.authorName}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Assign verifier */}
                        {["LAYER_2_REVIEW", "LAYER_3_REVIEW"].includes(paper.status) && (
                          <Select
                            onValueChange={(val) =>
                              assignMutation.mutate({ id: paper.id, data: { verifierId: parseInt(val, 10) } })
                            }
                          >
                            <SelectTrigger className="h-8 w-40 text-xs bg-slate-800 border-slate-700 text-slate-300">
                              <UserCheck className="w-3 h-3 mr-1" />
                              <SelectValue placeholder="Assign verifier" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-700 text-white">
                              {verifiers
                                .filter((v) => {
                                  if (paper.status === "LAYER_2_REVIEW") return v.verifierLayer === 2 || v.role === "ADMIN";
                                  if (paper.status === "LAYER_3_REVIEW") return v.verifierLayer === 3 || v.role === "ADMIN";
                                  return true;
                                })
                                .map((v) => (
                                  <SelectItem key={v.id} value={String(v.id)} className="hover:bg-slate-800">
                                    {v.name} {v.verifierLayer ? `(L${v.verifierLayer})` : ""}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/papers/${paper.id}`)}
                          className="text-slate-400 hover:text-white hover:bg-slate-800 text-xs"
                        >
                          View <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {papersData && papersData.total > 15 && (
              <div className="flex justify-center items-center gap-4 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaperPage((p) => Math.max(1, p - 1))}
                  disabled={paperPage === 1}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Previous
                </Button>
                <span className="text-sm text-slate-400">
                  Page {paperPage} of {Math.ceil(papersData.total / 15)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaperPage((p) => p + 1)}
                  disabled={paperPage >= Math.ceil(papersData.total / 15)}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Next
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="space-y-3">
              {users?.map((user) => (
                <Card key={user.id} className="bg-slate-900 border-slate-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-medium text-white text-sm">{user.name}</span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 h-4 ${ROLE_COLORS[user.role] ?? "border-slate-600 text-slate-400"}`}
                          >
                            {user.role}
                            {user.verifierLayer ? ` L${user.verifierLayer}` : ""}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">{user.email}</p>
                        {user.affiliation && (
                          <p className="text-xs text-slate-600 mt-0.5">{user.affiliation}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Select
                          defaultValue={`${user.role}${user.verifierLayer ? `-${user.verifierLayer}` : ""}`}
                          onValueChange={(val) => {
                            const [role, layerStr] = val.split("-");
                            updateRoleMutation.mutate({
                              id: user.id,
                              data: {
                                role: role as "USER" | "VERIFIER" | "ADMIN",
                                verifierLayer: layerStr ? parseInt(layerStr, 10) : null,
                              },
                            });
                          }}
                        >
                          <SelectTrigger className="h-8 w-36 text-xs bg-slate-800 border-slate-700 text-slate-300">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-700 text-white">
                            <SelectItem value="USER" className="hover:bg-slate-800">Author</SelectItem>
                            <SelectItem value="VERIFIER-2" className="hover:bg-slate-800">Verifier L2</SelectItem>
                            <SelectItem value="VERIFIER-3" className="hover:bg-slate-800">Verifier L3</SelectItem>
                            <SelectItem value="ADMIN" className="hover:bg-slate-800">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
