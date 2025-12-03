import { Loader2 } from "lucide-react";

export const LoadingState = () => {
  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="text-lg font-medium">Caricamento dati...</p>
        <p className="text-sm text-muted-foreground">
          Recupero delle graduatorie in corso
        </p>
      </div>
    </div>
  );
};
