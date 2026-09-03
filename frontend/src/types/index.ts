// Matches backend DTOs exactly

export interface HealthPlan {
  healthPlanId: number;
  name: string;
  lineOfBusiness: string | null;
  planType: string | null;
  planCode: string | null;
}

export interface ProcedureCode {
  code: string;
  description: string;
}

export interface DiagnosisCode {
  code: string;
  description: string;
}

export interface Member {
  patientId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  dateOfBirth: string | null;
  gender: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  memberCode: string | null;
  planCode: string | null;
}

export interface Provider {
  physicianId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  npi: string | null;
  specialty1: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
}

export interface Site {
  siteId: string;
  name: string;
  npi: string | null;
  specialty1: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  participating: boolean;
}

export interface ProcedureRequest {
  code: string;
  quantity: number;
}

export interface CreateAuthorizationRequest {
  program: string | null;
  patientId: string;
  physicianId: string;
  healthPlanId: number;
  siteId: string;
  primaryDiagnosis: string;
  diagnosisCodes: string[];
  procedures: ProcedureRequest[];
  notes: string | null;
}

export interface AuthorizationSummary {
  authorizationId: number;
  referenceNumber: string;
  status: string;
  program: string | null;
  createdAt: string;
  memberName: string | null;
  providerName: string | null;
  healthPlanName: string | null;
  primaryDiagnosis: string | null;
}

export interface ProcedureSummary {
  code: string;
  description: string;
  quantity: number;
}

export interface AuthorizationDetail {
  authorizationId: number;
  referenceNumber: string;
  status: string;
  program: string | null;
  createdAt: string;
  updatedAt: string;
  member: Member | null;
  provider: Provider | null;
  healthPlan: HealthPlan | null;
  site: Site | null;
  primaryDiagnosisCode: DiagnosisCode | null;
  procedures: ProcedureSummary[];
  diagnoses: DiagnosisCode[];
  notes: string | null;
}

// Wizard state — accumulated across all steps
export interface WizardState {
  program: string;
  provider: Provider | null;
  healthPlan: HealthPlan | null;
  member: Member | null;
  diagnoses: DiagnosisCode[];
  primaryDiagnosis: string;
  procedures: ProcedureRequest[];
  site: Site | null;
  notes: string;
}

export const PROGRAMS = [
  'Orthopedics',
  'Cardiology',
  'Oncology',
  'Behavioral Health',
  'Gastroenterology',
  'Neurology',
  'General Surgery',
  'Radiology',
];

export const STATUS_COLORS: Record<string, string> = {
  PENDING:   '#b45309',
  APPROVED:  '#166534',
  DENIED:    '#991b1b',
  CANCELLED: '#374151',
  IN_REVIEW: '#1d4ed8',
};

export const STATUS_BG: Record<string, string> = {
  PENDING:   '#fef3c7',
  APPROVED:  '#dcfce7',
  DENIED:    '#fee2e2',
  CANCELLED: '#f3f4f6',
  IN_REVIEW: '#dbeafe',
};
