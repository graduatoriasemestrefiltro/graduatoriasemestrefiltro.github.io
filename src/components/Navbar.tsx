import { Link, useLocation } from "react-router-dom";
import { GraduationCap, Home, Building2, Trophy, RefreshCw, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useSurveyData } from "@/contexts/SurveyDataContext";
import { CONFIG } from "@/lib/config";

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
  const { includeSurveyData, setIncludeSurveyData } = useSurveyData();
  const isExclusiveMode = CONFIG.DISABLE_SURVEYS_GLOBALLY;

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
          <div className="flex items-center gap-3">
            {/* Survey Data Toggle */}
            <div className="hidden sm:flex items-center gap-2">
              <Switch
                id="survey-toggle"
                checked={includeSurveyData}
                onCheckedChange={setIncludeSurveyData}
                className="data-[state=checked]:bg-purple-600"
              />
              <Label 
                htmlFor="survey-toggle" 
                className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap"
              >
                sondaggi
              </Label>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Dati dei sondaggi</DialogTitle>
                    <DialogDescription className="text-left space-y-2 pt-2">
                      {isExclusiveMode ? (
                        <>
                          <p>
                            I dati ufficiali sono ora disponibili per la maggior parte delle università.
                          </p>
                          <p>
                            Attivando questa opzione, vedrai <strong>solo</strong> i dati raccolti tramite i sondaggi. 
                            Disattivandola, vedrai <strong>solo</strong> i dati ufficiali.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            I dati dei sondaggi sono da considerarsi indicativi e non ufficiali.
                          </p>
                        </>
                      ) : (
                        <>
                          <p>
                            A oltre 24 ore dalla pubblicazione dei risultati, solo 7 università su 44 hanno reso disponibili 
                            i dati su Universitaly, e in alcuni casi risultano incompleti.
                          </p>
                          <p>
                            Per questo abbiamo deciso di raccogliere i risultati direttamente dagli studenti tramite sondaggi anonimi.
                          </p>
                          <p>
                            Attivando questa opzione, vedrai anche i dati raccolti tramite i sondaggi. 
                            Disattivandola, vedrai solo i dati ufficiali.
                          </p>
                          <p className="text-xs text-muted-foreground">
                            I dati dei sondaggi sono da considerarsi indicativi e non ufficiali.
                          </p>
                        </>
                      )}
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </div>

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
      </div>

      {/* Survey Data Toggle - Mobile */}
      <div className="sm:hidden border-t border-border/50 px-4 py-2 flex items-center justify-center gap-2">
        <button
          onClick={() => setIncludeSurveyData(!includeSurveyData)}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium transition-colors",
            includeSurveyData
              ? "bg-purple-600 text-white"
              : "bg-gray-200 text-gray-600"
          )}
        >
          sondaggi {includeSurveyData ? "on" : "off"}
        </button>
        <Dialog>
          <DialogTrigger asChild>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <HelpCircle className="h-4 w-4" />
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Dati dei sondaggi</DialogTitle>
              <DialogDescription className="text-left space-y-2 pt-2">
                {isExclusiveMode ? (
                  <>
                    <p>
                      I dati ufficiali sono ora disponibili per la maggior parte delle università.
                    </p>
                    <p>
                      Attivando questa opzione, vedrai <strong>solo</strong> i dati raccolti tramite i sondaggi. 
                      Disattivandola, vedrai <strong>solo</strong> i dati ufficiali.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      I dati dei sondaggi sono da considerarsi indicativi e non ufficiali.
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      A oltre 24 ore dalla pubblicazione dei risultati, solo 7 università su 44 hanno reso disponibili 
                      i dati su Universitaly, e in alcuni casi risultano incompleti.
                    </p>
                    <p>
                      Per questo abbiamo deciso di raccogliere i risultati direttamente dagli studenti tramite sondaggi anonimi.
                    </p>
                    <p>
                      Attivando questa opzione, vedrai anche i dati raccolti tramite i sondaggi. 
                      Disattivandola, vedrai solo i dati ufficiali.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      I dati dei sondaggi sono da considerarsi indicativi e non ufficiali.
                    </p>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
};
