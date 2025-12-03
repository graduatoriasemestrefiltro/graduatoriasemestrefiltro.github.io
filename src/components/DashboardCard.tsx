import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  children: ReactNode;
  to?: string;
  linkText?: string;
  className?: string;
}

export const DashboardCard = ({ title, children, to, linkText = "Vedi tutto", className }: DashboardCardProps) => {
  return (
    <div className={cn("rounded-xl border border-border p-5 bg-card shadow-card", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {to && (
          <Link
            to={to}
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            {linkText}
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
};
