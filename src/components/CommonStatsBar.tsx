import { Users, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommonStatsBarProps {
  uniqueStudents: number;
  avgScore: number;
  fullyQualified: number;
  potentiallyQualified: number;
  contextualStats?: {
    label: string;
    value: number | string;
    icon?: React.ReactNode;
  }[];
}

export const CommonStatsBar = ({
  uniqueStudents,
  avgScore,
  fullyQualified,
  potentiallyQualified,
  contextualStats = [],
}: CommonStatsBarProps) => {
  const commonStats = [
    {
      label: "Studenti",
      value: uniqueStudents.toLocaleString("it-IT"),
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: "Media",
      value: avgScore.toFixed(2),
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      label: "Idonei",
      value: fullyQualified.toLocaleString("it-IT"),
      icon: <CheckCircle2 className="h-4 w-4" />,
      highlight: "success",
    },
    {
      label: "Potenziali",
      value: potentiallyQualified.toLocaleString("it-IT"),
      icon: <Clock className="h-4 w-4" />,
      highlight: "warning",
    },
  ];

  const allStats = [...commonStats, ...contextualStats.map(s => ({ ...s, value: String(s.value) }))];

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 rounded-lg bg-secondary/30 border border-border/50">
      {allStats.map((stat, index) => (
        <div key={stat.label} className="flex items-center gap-2">
          {stat.icon && (
            <span className={cn(
              "text-muted-foreground",
              (stat as any).highlight === "success" && "text-success",
              (stat as any).highlight === "warning" && "text-warning"
            )}>
              {stat.icon}
            </span>
          )}
          <span className="text-sm text-muted-foreground">{stat.label}:</span>
          <span className={cn(
            "font-mono font-semibold text-sm",
            (stat as any).highlight === "success" && "text-success",
            (stat as any).highlight === "warning" && "text-warning"
          )}>
            {stat.value}
          </span>
          {index < allStats.length - 1 && (
            <span className="hidden sm:inline text-border ml-4">|</span>
          )}
        </div>
      ))}
    </div>
  );
};
