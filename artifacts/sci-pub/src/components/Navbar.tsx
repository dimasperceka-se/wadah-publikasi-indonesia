import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, ChevronDown, LogOut, LayoutDashboard, Shield, BookOpen } from "lucide-react";

const roleColors: Record<string, string> = {
  ADMIN: "bg-red-900/30 text-red-300 border-red-700",
  VERIFIER: "bg-blue-900/30 text-blue-300 border-blue-700",
  USER: "bg-emerald-900/30 text-emerald-300 border-emerald-700",
  GUEST: "bg-slate-700/30 text-slate-300 border-slate-600",
};

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  VERIFIER: "Verifier",
  USER: "Author",
  GUEST: "Guest",
};

export default function Navbar() {
  const [location, navigate] = useLocation();
  const { user, logout, isAdmin, isVerifier } = useAuth();

  const initials = user?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "G";

  return (
    <nav
      className="sticky top-0 z-50 border-b border-slate-800 backdrop-blur"
      style={{ background: "rgba(10,22,40,0.95)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <FlaskConical className="w-7 h-7" style={{ color: "#c9a84c" }} />
            <span className="text-xl font-bold font-serif text-white tracking-tight">SciPub</span>
          </button>

          {/* Center nav links */}
          <div className="hidden md:flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className={`text-slate-300 hover:text-white hover:bg-slate-800 ${location === "/" ? "text-white bg-slate-800" : ""}`}
            >
              <BookOpen className="w-4 h-4 mr-1.5" />
              Papers
            </Button>
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/my-papers")}
                className={`text-slate-300 hover:text-white hover:bg-slate-800 ${location.startsWith("/my-papers") ? "text-white bg-slate-800" : ""}`}
              >
                My Papers
              </Button>
            )}
            {isVerifier && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/verifier")}
                className={`text-slate-300 hover:text-white hover:bg-slate-800 ${location.startsWith("/verifier") ? "text-white bg-slate-800" : ""}`}
              >
                <Shield className="w-4 h-4 mr-1.5" />
                Review Queue
              </Button>
            )}
            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin")}
                className={`text-slate-300 hover:text-white hover:bg-slate-800 ${location.startsWith("/admin") ? "text-white bg-slate-800" : ""}`}
              >
                <LayoutDashboard className="w-4 h-4 mr-1.5" />
                Admin
              </Button>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-800 px-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs font-semibold bg-slate-700 text-slate-200">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex flex-col items-start">
                      <span className="text-sm font-medium leading-none">{user.name.split(" ")[0]}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1 py-0 mt-0.5 h-4 ${roleColors[user.role]}`}
                      >
                        {roleLabels[user.role]}
                        {user.verifierLayer ? ` L${user.verifierLayer}` : ""}
                      </Badge>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-slate-700 text-slate-200">
                  <DropdownMenuItem
                    onClick={() => navigate("/my-papers")}
                    className="hover:bg-slate-800 cursor-pointer"
                  >
                    My Papers
                  </DropdownMenuItem>
                  {isVerifier && (
                    <DropdownMenuItem
                      onClick={() => navigate("/verifier")}
                      className="hover:bg-slate-800 cursor-pointer"
                    >
                      Review Queue
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem
                      onClick={() => navigate("/admin")}
                      className="hover:bg-slate-800 cursor-pointer"
                    >
                      Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-slate-700" />
                  <DropdownMenuItem
                    onClick={logout}
                    className="text-red-400 hover:bg-slate-800 hover:text-red-300 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => navigate("/login")}
                size="sm"
                className="font-semibold"
                style={{ background: "linear-gradient(135deg, #c9a84c, #e8c96c)", color: "#0a1628" }}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
