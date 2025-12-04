import { useEffect } from 'react';

const TALLY_URL = 'https://tally.so/r/eq5d0x';

const Sondaggio = () => {
  useEffect(() => {
    // Track the event
    if (typeof window !== 'undefined' && (window as any).umami) {
      (window as any).umami.track('Survey redirect');
    }
    
    // Redirect to Tally
    window.location.href = TALLY_URL;
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center p-4">
      <p className="text-gray-600">Reindirizzamento al sondaggio...</p>
    </div>
  );
};

export default Sondaggio;
