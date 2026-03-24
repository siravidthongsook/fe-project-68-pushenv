export type Role = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  telephone: string;
  email: string;
  role: Role;
  bookingCount: number;
  createdAt?: string;
}

export interface BookingSlot {
  value: string;
  label: string;
}

export interface CompanySummary {
  id: string;
  name: string;
  address: string;
  tel: string;
}

export interface Company {
  id: string;
  name: string;
  address: string;
  website?: string;
  description: string;
  tel: string;
  interview: Interview[];
  bookingCount: number;
}

export interface Interview {
  id: string;
  date: string;
  user: User;
  company: CompanySummary;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
}

export interface ApiFailureEnvelope {
  success: false;
  message: string;
  error?: string | string[];
  msg?: string;
  [key: string]: unknown;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}
