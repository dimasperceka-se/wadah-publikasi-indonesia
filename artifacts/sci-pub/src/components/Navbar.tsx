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
import { FlaskConical, ChevronDown, LogOut, LayoutDashboard, Shield, BookOpen, Tag } from "lucide-react";

const roleColors: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700 border-red-200",
  VERIFIER: "bg-sky-100 text-sky-700 border-sky-200",
  USER: "bg-emerald-100 text-emerald-700 border-emerald-200",
  GUEST: "bg-muted text-muted-foreground border-border",
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
    <nav className="sticky top-0 z-50 glass-nav">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <FlaskConical className="w-7 h-7 text-primary" />
            <span className="text-xl font-bold font-display text-foreground tracking-tight">SciPub</span>
          </button>

          <div className="hidden md:flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className={location === "/" ? "bg-muted text-foreground" : "text-muted-foreground"}
            >
              <BookOpen className="w-4 h-4 mr-1.5" />
              Papers
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/pricing")}
              className={location.startsWith("/pricing") ? "bg-muted text-foreground" : "text-muted-foreground"}
            >
              <Tag className="w-4 h-4 mr-1.5" />
              Pricing
            </Button>
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/my-papers")}
                className={location.startsWith("/my-papers") ? "bg-muted text-foreground" : "text-muted-foreground"}
              >
                My Papers
              </Button>
            )}
            {isVerifier && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/verifier")}
                className={location.startsWith("/verifier") ? "bg-muted text-foreground" : "text-muted-foreground"}
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
                className={location.startsWith("/admin") ? "bg-muted text-foreground" : "text-muted-foreground"}
              >
                <LayoutDashboard className="w-4 h-4 mr-1.5" />
                Admin
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
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
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate("/my-papers")} className="cursor-pointer">
                    My Papers
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/pricing")} className="cursor-pointer">
                    Plans &amp; billing
                  </DropdownMenuItem>
                  {isVerifier && (
                    <DropdownMenuItem onClick={() => navigate("/verifier")} className="cursor-pointer">
                      Review Queue
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer">
                      Admin Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => navigate("/login")}
                size="sm"
                className="font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
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
