import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  onRetry: () => void;
}

export const ErrorState = ({ onRetry }: ErrorStateProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero">
      <div className="text-center space-y-4 p-8">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
        <h2 className="text-xl font-semibold">Errore nel caricamento</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Non è stato possibile recuperare i dati. Verifica la tua connessione e riprova.
        </p>
        <Button onClick={onRetry} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Riprova
        </Button>
      </div>
    </div>
  );
};
