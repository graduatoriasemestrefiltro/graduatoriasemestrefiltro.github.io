import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { SurveyDataProvider } from './contexts/SurveyDataContext';
import Index from './pages/Index';
import Universita from './pages/Universita';
import Graduatorie from './pages/Graduatorie';
import GrazieSondaggio from './pages/GrazieSondaggio';
import Sondaggio from './pages/Sondaggio';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SurveyDataProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/universita" element={<Universita />} />
            <Route path="/graduatorie" element={<Graduatorie />} />
            <Route path="/grazie-sondaggio" element={<GrazieSondaggio />} />
            <Route path="/sondaggio" element={<Sondaggio />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </SurveyDataProvider>
  </QueryClientProvider>
);

export default App;
