import { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Navbar } from "./Navbar";
import { useResults } from "@/hooks/useResults";
import { AlertTriangle, Github } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const queryClient = useQueryClient();
  const { isLoading } = useResults();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["results"] });
  };

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      {/* Top Disclaimer */}
      <div className="bg-amber-100 border-b border-amber-200 px-4 py-2">
        <p className="text-center text-xs text-amber-700 flex items-center justify-center gap-1.5">
          <AlertTriangle className="h-3 w-3" />
          <span>Sito non ufficiale - i dati potrebbero essere non aggiornati o incompleti</span>
        </p>
      </div>

      <Navbar onRefresh={handleRefresh} isLoading={isLoading} />
      
      <main className="container mx-auto px-4 py-6 flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              <strong>Disclaimer:</strong> Questo sito <strong>non è ufficiale</strong> e non è affiliato in alcun modo con il Ministero dell'Università e della Ricerca o con Universitaly.
            </p>
            <p className="text-xs text-muted-foreground">
              I dati grezzi sono recuperati pubblicamente da{" "}
              <a 
                href="https://www.universitaly.it" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors"
              >
                universitaly.it
              </a>
              ; alcuni dati provengono da sondaggi svolti direttamente da noi o dai rappresentanti delle varie università.
              Non viene fornita alcuna garanzia di accuratezza, completezza o affidabilità dei dati presentati. 
              Il sito è realizzato senza alcun fine di lucro, esclusivamente a scopo informativo e di aggregazione.
            </p>
            <p className="text-xs text-muted-foreground">
              Per segnalazioni, errori o suggerimenti, apri un issue su{" "}
              <a 
                href="https://github.com/graduatoriasemestrefiltro/graduatoriasemestrefiltro.github.io" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline hover:text-foreground transition-colors"
              >
                <Github className="h-3 w-3" />
                GitHub
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
