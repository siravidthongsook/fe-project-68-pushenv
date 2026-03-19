export type Role = 'user' | 'admin';

export interface User {
  id: string;
  name: string;
  telephone: string;
  email: string;
  role: Role;
  createdAt?: string;
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
  user: string | User;
  company: string | CompanySummary;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}
