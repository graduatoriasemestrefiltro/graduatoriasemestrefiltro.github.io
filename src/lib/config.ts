// Configuration flags for the application

export const CONFIG = {
  // When true, hides the data loading tracker card and the "materie" column from university tables
  // Shows the data collection stats card instead
  HIDE_DATA_LOADING_TRACKER: true,
  
  // Total students enrolled in exams
  TOTAL_ENROLLED_STUDENTS: 53323,
  
  // When true, completely disables all survey-related features:
  // - Hides survey toggle in navbar
  // - Hides survey CTA card on dashboard
  // - Hides survey badges in tables
  // - Forces includeSurveyData to true (survey data treated as regular data)
  DISABLE_SURVEYS_GLOBALLY: false,
} as const;
