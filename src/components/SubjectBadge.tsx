import { cn } from "@/lib/utils";

interface SubjectBadgeProps {
  subject: "F" | "C" | "B";
  active: boolean;
}

const subjectColors = {
  F: { active: "bg-blue-500 text-white", inactive: "bg-muted text-muted-foreground/50" },
  C: { active: "bg-green-500 text-white", inactive: "bg-muted text-muted-foreground/50" },
  B: { active: "bg-amber-500 text-white", inactive: "bg-muted text-muted-foreground/50" },
};

export const SubjectBadge = ({ subject, active }: SubjectBadgeProps) => {
  return (
    <div
      className={cn(
        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
        active ? subjectColors[subject].active : subjectColors[subject].inactive
      )}
      title={
        subject === "F" ? "Fisica" : subject === "C" ? "Chimica" : "Biologia"
      }
    >
      {subject}
    </div>
  );
};
