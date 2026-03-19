export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:5000';

export const AUTH_STORAGE_KEY = 'jobfair.token';

export const INTERVIEW_DATES = [
  { value: '2022-05-10T10:00:00.000Z', label: '10 พฤษภาคม 2022' },
  { value: '2022-05-11T10:00:00.000Z', label: '11 พฤษภาคม 2022' },
  { value: '2022-05-12T10:00:00.000Z', label: '12 พฤษภาคม 2022' },
  { value: '2022-05-13T10:00:00.000Z', label: '13 พฤษภาคม 2022' },
] as const;

export type InterviewDateValue = (typeof INTERVIEW_DATES)[number]['value'];
