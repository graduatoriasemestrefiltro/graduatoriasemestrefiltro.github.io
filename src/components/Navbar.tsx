import { Link, useLocation } from "react-router-dom";
import { GraduationCap, Home, Building2, Trophy, Map, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavbarProps {
  onRefresh?: () => void;
  isLoading?: boolean;
}

const navItems = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/universita", label: "Università", icon: Building2 },
  { to: "/graduatorie", label: "Graduatorie", icon: Trophy },
];

export const Navbar = ({ onRefresh, isLoading }: NavbarProps) => {
  const location = useLocation();

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg gradient-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold tracking-tight">Semestre Filtro 2025</h1>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className={cn(
                    item.to === "/" ? "hidden sm:inline" : "text-xs sm:text-sm"
                  )}>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="gap-1.5"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              <span className="hidden sm:inline">Aggiorna</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
