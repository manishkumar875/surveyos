export const webEnv = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? 'SurveyOS',
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1',
} as const;
