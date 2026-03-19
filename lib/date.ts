import { INTERVIEW_DATES } from '@/lib/constants';

const displayDate = new Intl.DateTimeFormat('th-TH', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return displayDate.format(date);
}

export function toDateInputValue(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().slice(0, 10);
}

export function allowedInterviewOptions() {
  return INTERVIEW_DATES;
}
