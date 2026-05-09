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
        navigate("/");
      },
      onError(err) {
        toast({ title: "Registration failed", description: (err as Error).message, variant: "destructive" });
      },
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-950 to-navy-900 p-4"
      style={{ background: "linear-gradient(135deg, #0a1628 0%, #0f2040 100%)" }}>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FlaskConical className="w-10 h-10 text-gold-400" style={{ color: "#c9a84c" }} />
            <span className="text-3xl font-bold font-serif text-white tracking-tight">SciPub</span>
          </div>
          <p className="text-sm text-slate-400">Scientific Publication Platform</p>
        </div>

        <Card className="border-slate-700 bg-slate-900/80 backdrop-blur shadow-2xl">
          <Tabs defaultValue="login">
            <CardHeader>
              <TabsList className="grid grid-cols-2 w-full bg-slate-800">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Create Account</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="login">
                <CardTitle className="text-white mb-1">Welcome back</CardTitle>
                <CardDescription className="text-slate-400 mb-6">Sign in to access your account</CardDescription>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    loginMutation.mutate({ data: { email: loginEmail, password: loginPassword } });
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label className="text-slate-300" htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@university.edu"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300" htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full font-semibold"
                    disabled={loginMutation.isPending}
                    style={{ background: "linear-gradient(135deg, #c9a84c, #e8c96c)", color: "#0a1628" }}
                  >
                    {loginMutation.isPending ? "Signing in…" : "Sign In"}
                  </Button>
                </form>
                <div className="mt-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                  <p className="text-xs text-slate-400 font-medium mb-1">Demo accounts:</p>
                  <div className="grid grid-cols-2 gap-1 text-xs text-slate-500">
                    <span>admin@scipub.com / Admin@123</span>
                    <span>firman.perdana@scipub.com / Firman@123</span>
                    <span>andi.pratama@gmail.com / Andi@123</span>
                    <span>grandis@scipub.com / Grandis@123</span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="register">
                <CardTitle className="text-white mb-1">Create an account</CardTitle>
                <CardDescription className="text-slate-400 mb-6">Join SciPub to submit your research</CardDescription>
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
                    <Label className="text-slate-300">Full Name</Label>
                    <Input
                      placeholder="Dr. Jane Smith"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Email</Label>
                    <Input
                      type="email"
                      placeholder="you@university.edu"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Affiliation (optional)</Label>
                    <Input
                      placeholder="University / Institution"
                      value={regAffiliation}
                      onChange={(e) => setRegAffiliation(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Password</Label>
                    <Input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="bg-slate-800 border-slate-600 text-white"
                      required
                      minLength={8}
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full font-semibold"
                    disabled={registerMutation.isPending}
                    style={{ background: "linear-gradient(135deg, #c9a84c, #e8c96c)", color: "#0a1628" }}
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
