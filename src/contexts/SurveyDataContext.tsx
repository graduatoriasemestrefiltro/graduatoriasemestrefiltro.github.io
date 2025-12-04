import { createContext, useContext, useState, ReactNode } from 'react';

interface SurveyDataContextType {
  includeSurveyData: boolean;
  setIncludeSurveyData: (value: boolean) => void;
}

const SurveyDataContext = createContext<SurveyDataContextType | undefined>(undefined);

export const SurveyDataProvider = ({ children }: { children: ReactNode }) => {
  const [includeSurveyData, setIncludeSurveyData] = useState(true);

  return (
    <SurveyDataContext.Provider value={{ includeSurveyData, setIncludeSurveyData }}>
      {children}
    </SurveyDataContext.Provider>
  );
};

export const useSurveyData = () => {
  const context = useContext(SurveyDataContext);
  if (context === undefined) {
    throw new Error('useSurveyData must be used within a SurveyDataProvider');
  }
  return context;
};
