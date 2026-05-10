import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import { FlowingRibbons } from "@/components/BackgroundDecorations";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/LoginPage";
import HomePage from "@/pages/HomePage";
import PricingPage from "@/pages/PricingPage";
import PaperDetailPage from "@/pages/PaperDetailPage";
import MyPapersPage from "@/pages/MyPapersPage";
import SubmitPaperPage from "@/pages/SubmitPaperPage";
import VerifierDashboard from "@/pages/VerifierDashboard";
import AdminDashboard from "@/pages/AdminDashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function ProtectedRoute({
  component: Component,
  roles,
}: {
  component: React.ComponentType;
  roles?: string[];
}) {
  const { user, isAuth } = useAuth();
  if (!isAuth) return <LoginPage />;
  if (roles && user && !roles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground text-sm">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }
  return <Component />;
}

function AppLayout() {
  return (
    <div className="min-h-screen relative bg-background text-foreground selection:bg-primary/30">
      <FlowingRibbons />
      <Navbar />
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/pricing" component={PricingPage} />
        <Route path="/papers/:id" component={PaperDetailPage} />
        <Route path="/my-papers">
          {() => <ProtectedRoute component={MyPapersPage} />}
        </Route>
        <Route path="/my-papers/new">
          {() => <ProtectedRoute component={SubmitPaperPage} />}
        </Route>
        <Route path="/my-papers/:id/edit">
          {() => <ProtectedRoute component={SubmitPaperPage} />}
        </Route>
        <Route path="/my-papers/:id">
          {() => <ProtectedRoute component={SubmitPaperPage} />}
        </Route>
        <Route path="/verifier">
          {() => <ProtectedRoute component={VerifierDashboard} roles={["VERIFIER", "ADMIN"]} />}
        </Route>
        <Route path="/admin">
          {() => <ProtectedRoute component={AdminDashboard} roles={["ADMIN"]} />}
        </Route>
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppLayout />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
