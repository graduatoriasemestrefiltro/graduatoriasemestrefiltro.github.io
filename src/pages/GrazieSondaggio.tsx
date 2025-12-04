import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Copy, MessageCircle, Send, Heart, AlertTriangle, Github } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

const SURVEY_URL = 'https://graduatoriasemestrefiltro.github.io/#/sondaggio';
const HOME_URL = 'https://graduatoriasemestrefiltro.github.io';
const SHARE_MESSAGE = `Hai sostenuto gli esami del semestre filtro? Compila questo breve sondaggio anonimo per aiutare tutti a capire come stanno andando le graduatorie! 📊\n\n🔗 Compila il sondaggio: ${SURVEY_URL}\n📈 Guarda le statistiche: ${HOME_URL}`;

const GrazieSondaggio = () => {
  const [searchParams] = useSearchParams();
  const submissionId = searchParams.get('id');
  const formattedId = submissionId ? `SRV-${submissionId.toUpperCase()}` : null;
  
  const [copied, setCopied] = useState(false);

  const trackEvent = (eventName: string) => {
    if (typeof window !== 'undefined' && (window as any).umami) {
      (window as any).umami.track(eventName);
    }
  };

  const handleCopyLink = async () => {
    trackEvent('Share: Copy link');
    try {
      await navigator.clipboard.writeText(SURVEY_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleWhatsAppShare = () => {
    trackEvent('Share: WhatsApp');
    const url = `https://wa.me/?text=${encodeURIComponent(SHARE_MESSAGE)}`;
    window.open(url, '_blank');
  };

  const handleTelegramShare = () => {
    trackEvent('Share: Telegram');
    const url = `https://t.me/share/url?url=${encodeURIComponent(SURVEY_URL)}&text=${encodeURIComponent('Hai sostenuto gli esami del semestre filtro? Compila questo breve sondaggio anonimo per aiutare tutti a capire come stanno andando le graduatorie! 📊\n\n📈 Guarda le statistiche: ' + HOME_URL)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex flex-col">
      {/* Top Disclaimer */}
      <div className="bg-amber-100 border-b border-amber-200 px-4 py-2">
        <p className="text-center text-xs text-amber-700 flex items-center justify-center gap-1.5">
          <AlertTriangle className="h-3 w-3" />
          <span>Sito non ufficiale - i dati potrebbero essere non aggiornati o incompleti</span>
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full shadow-xl border-purple-100">
          <CardContent className="pt-8 pb-6 px-6 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="h-8 w-8 text-purple-600" fill="currentColor" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Grazie per aver compilato il sondaggio!
            </h1>
            
            <p className="text-gray-600 mb-6">
              Ogni risposta ci aiuta a costruire statistiche più complete e affidabili. 
              <span className="font-medium text-purple-700"> Condividi il sondaggio con i tuoi compagni di corso</span> per 
              rendere i dati ancora più utili per tutti! 💜
            </p>

            {formattedId && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-2">
                  Il tuo codice identificativo anonimo è:
                </p>
                <code className="block bg-white px-4 py-2 rounded-md text-lg font-mono font-bold text-purple-700 border border-purple-200 mb-2">
                  {formattedId}
                </code>
                <p className="text-xs text-gray-500 mb-1">
                  Salvalo se vuoi ritrovarti tra i risultati: sarà visibile nella colonna "etichetta".
                </p>
                <p className="text-xs text-gray-400">
                  Ricorda: non si tratta della graduatoria ufficiale, ma di una stima fatta da studenti, per studenti, basata sui dati dei sondaggi.
                </p>
              </div>
            )}

            <div className="space-y-3 mb-6">
              <Button
                onClick={handleWhatsAppShare}
                className="w-full bg-green-500 hover:bg-green-600 text-white"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Condividi su WhatsApp
              </Button>

              <Button
                onClick={handleTelegramShare}
                className="w-full bg-sky-500 hover:bg-sky-600 text-white"
              >
                <Send className="mr-2 h-5 w-5" />
                Condividi su Telegram
              </Button>

              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="w-full border-purple-200 hover:bg-purple-50"
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-5 w-5 text-green-600" />
                    Link copiato!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-5 w-5" />
                    Copia link del sondaggio
                  </>
                )}
              </Button>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <Link 
                to="/" 
                className="text-sm text-purple-600 hover:text-purple-800 hover:underline"
                onClick={() => trackEvent('Share page: Go to dashboard')}
              >
                ← Vai alla dashboard
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/50 mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <p className="text-sm text-gray-600">
              <strong>Disclaimer:</strong> Questo sito <strong>non è ufficiale</strong> e non è affiliato in alcun modo con il Ministero dell'Università e della Ricerca o con Universitaly.
            </p>
            <p className="text-xs text-gray-500">
              I dati grezzi sono recuperati pubblicamente da{" "}
              <a 
                href="https://www.universitaly.it" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline hover:text-gray-700 transition-colors"
              >
                universitaly.it
              </a>
              ; alcuni dati provengono da sondaggi svolti direttamente da noi o dai rappresentanti delle varie università.
              Non viene fornita alcuna garanzia di accuratezza, completezza o affidabilità dei dati presentati. 
              Il sito è realizzato senza alcun fine di lucro, esclusivamente a scopo informativo e di aggregazione.
            </p>
            <p className="text-xs text-gray-500">
              Per segnalazioni, errori o suggerimenti, apri un issue su{" "}
              <a 
                href="https://github.com/graduatoriasemestrefiltro/graduatoriasemestrefiltro.github.io" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline hover:text-gray-700 transition-colors"
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

export default GrazieSondaggio;
