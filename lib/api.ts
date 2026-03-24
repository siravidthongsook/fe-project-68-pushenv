import { API_BASE_URL } from '@/lib/constants';
import type {
  ApiEnvelope,
  AuthResponse,
  BookingSlot,
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
  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }

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
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    throw new ApiError(readErrorMessage(payload, text || 'Request failed'), response.status);
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
    bookingCount: Number(raw.bookingCount ?? 0),
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
  };
}

function normalizeBookingSlot(raw: Record<string, unknown>): BookingSlot {
  return {
    value: String(raw.value ?? raw.date ?? ''),
    label: String(raw.label ?? raw.value ?? raw.date ?? ''),
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
  const company = isRecord(raw.company)
    ? normalizeCompanySummary(raw.company)
    : { id: String(raw.company ?? ''), name: String(raw.company ?? ''), address: '', tel: '' };

  const user = isRecord(raw.user)
    ? normalizeUser(raw.user)
    : {
        id: String(raw.user ?? ''),
        name: '',
        telephone: '',
        email: String(raw.user ?? ''),
        role: 'user' as Role,
        bookingCount: 0,
      };

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

/**
 * Fetch the currently authenticated user's profile.
 * @throws {ApiError} if the token is invalid or expired
 */
export async function getMe(token: string) {
  const payload = await request<ApiEnvelope<Record<string, unknown>>>('/api/v1/auth/me', { token });
  return normalizeUser(extractData(payload));
}

/**
 * Authenticate with email and password.
 * @returns JWT token string on success
 * @throws {ApiError} on invalid credentials
 */
export async function loginUser(email: string, password: string) {
  const payload = await request<AuthResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  return payload.token;
}

/**
 * Register a new user account. Role is always set to 'user'.
 * @returns JWT token string on success
 * @throws {ApiError} if email is already taken
 */
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

/**
 * Invalidate the current session on the backend.
 * @throws {ApiError} on failure — caller should clear local state regardless
 */
export async function logoutUser(token: string) {
  // NOTE: Backend currently only accepts GET for logout.
  // This is a known limitation — ideally should be POST to prevent CSRF.
  // Update to POST when the backend route is changed
  await request<ApiEnvelope<Record<string, never>>>('/api/v1/auth/logout', {
    token,
    method: 'GET',
  });
}

/**
 * Fetch all companies. Passes token if provided for role-specific data.
 * @throws {ApiError} on non-2xx responses
 */
export async function getCompanies(token?: string | null) {
  const payload = await request<{ success: boolean; count: number; data: Record<string, unknown>[] }>(
    '/api/v1/companies',
    { token: token ?? undefined },
  );
  return payload.data.map((company) => normalizeCompany(company));
}

/**
 * Fetch all registered users.
 * @throws {ApiError} if the token is invalid or the caller is not an admin
 */
export async function getUsers(token: string) {
  const payload = await request<{ success: boolean; count: number; data: Record<string, unknown>[] }>(
    '/api/v1/users',
    { token },
  );
  return payload.data.map((user) => normalizeUser(user));
}

export async function updateUser(
  token: string,
  id: string,
  data: {
    role: Role;
  },
) {
  const payload = await request<ApiEnvelope<Record<string, unknown>>>(`/api/v1/users/${id}`, {
    method: 'PUT',
    token,
    body: data,
  });
  return normalizeUser(extractData(payload));
}

export async function deleteUser(token: string, id: string) {
  await request<ApiEnvelope<Record<string, never>>>(`/api/v1/users/${id}`, {
    method: 'DELETE',
    token,
  });
}

export async function getInterviewSlots(token: string) {
  const payload = await request<{ success: boolean; count: number; data: Record<string, unknown>[] }>(
    '/api/v1/interviews/slots',
    { token },
  );
  return payload.data.map((slot) => normalizeBookingSlot(slot));
}

/**
 * Fetch a single company by ID including its interview bookings.
 * @throws {ApiError} if company not found
 */
export async function getCompany(id: string, token?: string | null) {
  const payload = await request<ApiEnvelope<Record<string, unknown>>>(
    `/api/v1/companies/${id}`,
    { token: token ?? undefined },
  );
  return normalizeCompany(extractData(payload));
}

/**
 * Create a new company. Requires admin token.
 * @throws {ApiError} if unauthorized or validation fails
 */
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

/**
 * Update an existing company by ID. Requires admin token.
 * @throws {ApiError} if unauthorized or company not found
 */
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

/**
 * Delete a company by ID. Requires admin token.
 * @throws {ApiError} if unauthorized or company not found
 */
export async function deleteCompany(token: string, id: string) {
  await request<ApiEnvelope<Record<string, never>>>(`/api/v1/companies/${id}`, {
    method: 'DELETE',
    token,
  });
}

/**
 * Fetch all interviews visible to the current user.
 * Admins see all interviews, regular users see only their own.
 * @throws {ApiError} if token is missing or invalid
 */
export async function getInterviews(token: string) {
  const payload = await request<{ success: boolean; count: number; data: Record<string, unknown>[] }>(
    '/api/v1/interviews',
    { token },
  );
  return payload.data.map((interview) => normalizeInterview(interview));
}

/**
 * Book a single interview slot at a specific company.
 * @throws {ApiError} if user already has 3 bookings or slot is taken
 */
export async function getInterview(token: string, id: string) {
  const payload = await request<ApiEnvelope<Record<string, unknown>>>(`/api/v1/interviews/${id}`, {
    token,
  });
  return normalizeInterview(extractData(payload));
}

/**
 * Book interview slots at multiple companies in one request.
 * @throws {ApiError} if booking limit would be exceeded
 */
export async function createInterview(
  token: string,
  companyId: string,
  date: string,
  userId?: string,
) {
  const payload = await request<ApiEnvelope<Record<string, unknown>>>(
    `/api/v1/companies/${companyId}/interviews`,
    {
      method: 'POST',
      token,
      body: {
        date,
        ...(userId ? { userId } : {}),
      },
    },
  );
  return normalizeInterview(extractData(payload));
}

/**
 * Reschedule an existing interview to a new date.
 * @throws {ApiError} if interview not found or unauthorized
 */
export async function createBulkInterviews(
  token: string,
  companyIds: string[],
  date: string,
  userId?: string,
) {
  const payload = await request<{ success: boolean; count: number; data: Record<string, unknown>[] }>(
    '/api/v1/interviews/bulk',
    {
      method: 'POST',
      token,
      body: {
        companyIds,
        date,
        ...(userId ? { userId } : {}),
      },
    },
  );
  return payload.data.map((interview) => normalizeInterview(interview));
}

/**
 * Cancel and delete an interview booking.
 * @throws {ApiError} if interview not found or unauthorized
 */
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
