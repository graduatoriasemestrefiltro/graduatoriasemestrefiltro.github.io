import { ReactNode } from "react";
import { AnimatedCounter } from "./AnimatedCounter";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  description?: string;
  icon?: ReactNode;
  variant?: "default" | "success" | "warning" | "primary" | "successSolid" | "warningSolid";
  className?: string;
  delay?: number;
}

export const StatCard = ({
  title,
  value,
  suffix = "",
  prefix = "",
  decimals = 0,
  description,
  icon,
  variant = "default",
  className,
  delay = 0,
}: StatCardProps) => {
  const variantStyles = {
    default: "border-border/50 bg-card",
    success: "border-success/50 bg-success/15",
    warning: "border-warning/50 bg-warning/15",
    primary: "border-primary/30 bg-primary/5",
    successSolid: "border-success bg-success text-success-foreground",
    warningSolid: "border-warning bg-warning text-warning-foreground",
  };

  const iconStyles = {
    default: "text-muted-foreground bg-secondary/50",
    success: "text-success bg-success/20",
    warning: "text-warning bg-warning/20",
    primary: "text-primary bg-primary/10",
    successSolid: "text-success-foreground bg-success-foreground/20",
    warningSolid: "text-warning-foreground bg-warning-foreground/20",
  };

  const textStyles = {
    default: "",
    success: "",
    warning: "",
    primary: "",
    successSolid: "text-success-foreground",
    warningSolid: "text-warning-foreground",
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-5 shadow-card transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
        variantStyles[variant],
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className={cn("text-sm font-medium", textStyles[variant] || "text-muted-foreground", textStyles[variant] && "opacity-90")}>{title}</p>
          <div className={cn("text-3xl font-bold tracking-tight", textStyles[variant])}>
            <AnimatedCounter
              value={value}
              suffix={suffix}
              prefix={prefix}
              decimals={decimals}
              duration={2000 + delay}
            />
          </div>
          {description && (
            <p className={cn("text-xs mt-2", textStyles[variant] || "text-muted-foreground", textStyles[variant] && "opacity-80")}>{description}</p>
          )}
        </div>
        {icon && (
          <div className={cn("p-2 rounded-lg", iconStyles[variant])}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
