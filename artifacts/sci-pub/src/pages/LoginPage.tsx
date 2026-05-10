import { useState } from "react";
import { useLocation } from "wouter";
import { useLoginUser, useRegisterUser } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { FlaskConical } from "lucide-react";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regAffiliation, setRegAffiliation] = useState("");

  const loginMutation = useLoginUser({
    mutation: {
      onSuccess(data) {
        login(data.user as never, data.token);
        toast({ title: "Welcome back!", description: `Signed in as ${data.user.name}` });
        navigate("/");
      },
      onError(err) {
        toast({ title: "Login failed", description: (err as Error).message, variant: "destructive" });
      },
    },
  });

  const registerMutation = useRegisterUser({
    mutation: {
      onSuccess(data) {
        login(data.user as never, data.token);
        toast({ title: "Account created!", description: `Welcome to SciPub, ${data.user.name}` });
        navigate("/pricing?onboarding=1");
      },
      onError(err) {
        toast({ title: "Registration failed", description: (err as Error).message, variant: "destructive" });
      },
    },
  });

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 relative">
      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FlaskConical className="w-10 h-10 text-primary" />
            <span className="text-3xl font-bold font-display text-foreground tracking-tight">SciPub</span>
          </div>
          <p className="text-sm text-muted-foreground">Scientific Publication Platform</p>
        </div>

        <Card className="glass-card shadow-xl">
          <Tabs defaultValue="login">
            <CardHeader>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Create Account</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="login">
                <CardTitle className="mb-1">Welcome back</CardTitle>
                <CardDescription className="mb-6">Sign in to access your account</CardDescription>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    loginMutation.mutate({ data: { email: loginEmail, password: loginPassword } });
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@university.edu"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Signing in…" : "Sign In"}
                  </Button>
                </form>
                <div className="mt-4 p-3 rounded-lg bg-muted/60 border border-border/60">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Demo accounts:</p>
                  <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground/80">
                    <span>admin@scipub.com / Admin@123</span>
                    <span>firman.perdana@scipub.com / Firman@123</span>
                    <span>andi.pratama@gmail.com / Andi@123</span>
                    <span>grandis@scipub.com / Grandis@123</span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="register">
                <CardTitle className="mb-1">Create an account</CardTitle>
                <CardDescription className="mb-6">Join SciPub to submit your research</CardDescription>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    registerMutation.mutate({
                      data: { email: regEmail, password: regPassword, name: regName, affiliation: regAffiliation || undefined },
                    });
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      placeholder="Dr. Jane Smith"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="you@university.edu"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Affiliation (optional)</Label>
                    <Input
                      placeholder="University / Institution"
                      value={regAffiliation}
                      onChange={(e) => setRegAffiliation(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? "Creating account…" : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
