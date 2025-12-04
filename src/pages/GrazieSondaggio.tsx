import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Copy, MessageCircle, Send, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const SURVEY_URL = 'https://graduatoriasemestrefiltro.github.io/#/sondaggio';
const HOME_URL = 'https://graduatoriasemestrefiltro.github.io';
const SHARE_MESSAGE = `Hai fatto il test di medicina? Compila questo breve sondaggio anonimo per aiutare tutti a capire come stanno andando le graduatorie! 📊\n\n🔗 Compila il sondaggio: ${SURVEY_URL}\n📈 Guarda le statistiche: ${HOME_URL}`;

const GrazieSondaggio = () => {
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
    const url = `https://t.me/share/url?url=${encodeURIComponent(SURVEY_URL)}&text=${encodeURIComponent('Hai fatto il test di medicina? Compila questo breve sondaggio anonimo per aiutare tutti a capire come stanno andando le graduatorie! 📊\n\n📈 Guarda le statistiche: ' + HOME_URL)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center p-4">
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
  );
};

export default GrazieSondaggio;
