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

export { INTERVIEW_DATES as interviewOptions } from '@/lib/constants';
