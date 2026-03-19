import { API_BASE_URL } from '@/lib/constants';
import type {
  ApiEnvelope,
  AuthResponse,
  Company,
  Interview,
  CompanySummary,
  Role,
  User,
} from '@/lib/types';

type Json = Record<string, unknown> | Array<unknown> | string | number | boolean | null;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readErrorMessage(payload: unknown, fallback: string) {
  if (!isRecord(payload)) {
    return fallback;
  }

  const data = isRecord(payload.data) ? payload.data : null;
  const candidates = [
    payload.error,
    payload.message,
    payload.msg,
    data ? data.message : undefined,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate.join(', ');
    }
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate;
    }
  }

  return fallback;
}

async function request<T>(
  path: string,
  {
    method = 'GET',
    body,
    token,
  }: {
    method?: string;
    body?: Json;
    token?: string | null;
  } = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new ApiError(readErrorMessage(payload, 'Request failed'), response.status);
  }

  return payload as T;
}

function normalizeUser(raw: Record<string, unknown>): User {
  return {
    id: String(raw._id ?? raw.id ?? ''),
    name: String(raw.name ?? ''),
    telephone: String(raw.telephone ?? ''),
    email: String(raw.email ?? ''),
    role: (raw.role as Role) ?? 'user',
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
  };
}

function normalizeCompanySummary(raw: Record<string, unknown>): CompanySummary {
  return {
    id: String(raw._id ?? raw.id ?? ''),
    name: String(raw.name ?? ''),
    address: String(raw.address ?? ''),
    tel: String(raw.tel ?? ''),
  };
}

export function normalizeInterview(raw: Record<string, unknown>): Interview {
  const company = isRecord(raw.company) ? normalizeCompanySummary(raw.company) : String(raw.company ?? '');
  const user = isRecord(raw.user) ? normalizeUser(raw.user) : String(raw.user ?? '');

  return {
    id: String(raw._id ?? raw.id ?? ''),
    date: String(raw.date ?? ''),
    user,
    company,
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
  };
}

export function normalizeCompany(raw: Record<string, unknown>): Company {
  const interviews = Array.isArray(raw.interview)
    ? raw.interview
        .filter(isRecord)
        .map((item) => normalizeInterview(item))
    : [];

  return {
    id: String(raw._id ?? raw.id ?? ''),
    name: String(raw.name ?? ''),
    address: String(raw.address ?? ''),
    website: raw.website ? String(raw.website) : undefined,
    description: String(raw.description ?? ''),
    tel: String(raw.tel ?? ''),
    interview: interviews,
    bookingCount: interviews.length,
  };
}

function extractData<T>(payload: ApiEnvelope<T> | { success?: boolean; data?: T }) {
  if (!payload || !('data' in payload)) {
    throw new Error('Unexpected response shape');
  }

  return payload.data as T;
}

export async function getMe(token: string) {
  const payload = await request<ApiEnvelope<Record<string, unknown>>>('/api/v1/auth/me', { token });
  return normalizeUser(extractData(payload));
}

export async function loginUser(email: string, password: string) {
  const payload = await request<AuthResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  return payload.token;
}

export async function registerUser(data: {
  name: string;
  telephone: string;
  email: string;
  password: string;
  role: Role;
}) {
  const payload = await request<AuthResponse>('/api/v1/auth/register', {
    method: 'POST',
    body: data,
  });
  return payload.token;
}

export async function logoutUser(token: string) {
  await request<ApiEnvelope<Record<string, never>>>('/api/v1/auth/logout', {
    token,
    method: 'GET',
  });
}

export async function getCompanies(token?: string | null) {
  const payload = await request<{ success: boolean; count: number; data: Record<string, unknown>[] }>(
    '/api/v1/companies',
    { token: token ?? undefined },
  );
  return payload.data.map((company) => normalizeCompany(company));
}

export async function getCompany(id: string, token?: string | null) {
  const payload = await request<ApiEnvelope<Record<string, unknown>>>(
    `/api/v1/companies/${id}`,
    { token: token ?? undefined },
  );
  return normalizeCompany(extractData(payload));
}

export async function createCompany(
  token: string,
  data: {
    name: string;
    address: string;
    website?: string;
    description: string;
    tel: string;
  },
) {
  const payload = await request<ApiEnvelope<Record<string, unknown>>>('/api/v1/companies', {
    method: 'POST',
    token,
    body: data,
  });
  return normalizeCompany(extractData(payload));
}

export async function updateCompany(
  token: string,
  id: string,
  data: {
    name: string;
    address: string;
    website?: string;
    description: string;
    tel: string;
  },
) {
  const payload = await request<ApiEnvelope<Record<string, unknown>>>(`/api/v1/companies/${id}`, {
    method: 'PUT',
    token,
    body: data,
  });
  return normalizeCompany(extractData(payload));
}

export async function deleteCompany(token: string, id: string) {
  await request<ApiEnvelope<Record<string, never>>>(`/api/v1/companies/${id}`, {
    method: 'DELETE',
    token,
  });
}

export async function getInterviews(token: string) {
  const payload = await request<{ success: boolean; count: number; data: Record<string, unknown>[] }>(
    '/api/v1/interviews',
    { token },
  );
  return payload.data.map((interview) => normalizeInterview(interview));
}

export async function getInterview(token: string, id: string) {
  const payload = await request<ApiEnvelope<Record<string, unknown>>>(`/api/v1/interviews/${id}`, {
    token,
  });
  return normalizeInterview(extractData(payload));
}

export async function createInterview(token: string, companyId: string, date: string) {
  const payload = await request<ApiEnvelope<Record<string, unknown>>>(
    `/api/v1/companies/${companyId}/interviews`,
    {
      method: 'POST',
      token,
      body: { date },
    },
  );
  return normalizeInterview(extractData(payload));
}

export async function createBulkInterviews(token: string, companyIds: string[], date: string) {
  const payload = await request<{ success: boolean; count: number; data: Record<string, unknown>[] }>(
    '/api/v1/interviews/bulk',
    {
      method: 'POST',
      token,
      body: { companyIds, date },
    },
  );
  return payload.data.map((interview) => normalizeInterview(interview));
}

export async function updateInterview(token: string, interviewId: string, date: string) {
  const payload = await request<ApiEnvelope<Record<string, unknown>>>(`/api/v1/interviews/${interviewId}`, {
    method: 'PUT',
    token,
    body: { date },
  });
  return normalizeInterview(extractData(payload));
}

export async function deleteInterview(token: string, interviewId: string) {
  await request<ApiEnvelope<Record<string, never>>>(`/api/v1/interviews/${interviewId}`, {
    method: 'DELETE',
    token,
  });
}
