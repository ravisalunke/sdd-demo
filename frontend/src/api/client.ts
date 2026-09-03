import type {
  HealthPlan, Member, Provider, Site,
  DiagnosisCode, ProcedureCode,
  AuthorizationSummary, AuthorizationDetail,
  CreateAuthorizationRequest
} from '../types';

const BASE = '/api';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

async function patch(path: string, body: unknown): Promise<void> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
}

// Lookups
export const api = {
  healthPlans: {
    getAll: () => get<HealthPlan[]>('/healthplans'),
  },
  members: {
    search: (q: string) => get<Member[]>(`/members?name=${encodeURIComponent(q)}`),
    getById: (id: string) => get<Member>(`/members/${id}`),
  },
  providers: {
    search: (q: string) => get<Provider[]>(`/providers?name=${encodeURIComponent(q)}`),
  },
  sites: {
    search: (q: string) => get<Site[]>(`/sites?name=${encodeURIComponent(q)}`),
    getAll: () => get<Site[]>('/sites'),
  },
  diagnosisCodes: {
    search: (q: string) => get<DiagnosisCode[]>(`/diagnosiscodes?q=${encodeURIComponent(q)}`),
  },
  procedureCodes: {
    search: (q: string) => get<ProcedureCode[]>(`/procedurecodes?q=${encodeURIComponent(q)}`),
  },
  authorizations: {
    getAll: (status?: string) =>
      get<AuthorizationSummary[]>(`/authorizations${status ? `?status=${status}` : ''}`),
    getById: (id: number) => get<AuthorizationDetail>(`/authorizations/${id}`),
    create: (req: CreateAuthorizationRequest) =>
      post<AuthorizationDetail>('/authorizations', req),
    updateStatus: (id: number, status: string) =>
      patch(`/authorizations/${id}/status`, { status }),
  },
};
