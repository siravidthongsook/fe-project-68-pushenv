import type { Interview } from '@/lib/types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function interviewCompanyName(interview: Interview): string {
  return interview.company.name;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeArray<T>(value: T[] | undefined | null) {
  return Array.isArray(value) ? value : [];
}
