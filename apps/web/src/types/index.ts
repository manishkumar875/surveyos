export type UserRole = 'OWNER' | 'ADMIN' | 'PROJECT_MANAGER' | 'VIEWER';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export type MembershipRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface OrganizationMember {
  id: string; // User ID
  name: string;
  email: string;
  role: MembershipRole;
  membershipId: string;
  createdAt: string; // User created at
  membershipCreatedAt?: string;
  membershipUpdatedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  clientName: string;
  organizationId: string;
  status: string; // DRAFT, ACTIVE, PAUSED, COMPLETED, ARCHIVED
  startDate?: string | null;
  endDate?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  clientName?: string;
  startDate?: string | null;
  endDate?: string | null;
  status?: string;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  clientName?: string;
  startDate?: string | null;
  endDate?: string | null;
  status?: string;
}

export type IntegrationStatus = 'WAITING' | 'TESTING' | 'LIVE' | 'FAILED';

export interface CallbackUrls {
  completeCallbackUrl: string;
  terminateCallbackUrl: string;
  quotaFullCallbackUrl: string;
  securityCallbackUrl: string;
  testCallbackUrl: string;
}

export interface ProjectIntegration {
  id: string;
  projectId: string;
  clientSurveyUrl?: string | null;
  parameterMapping?: Record<string, string[]> | null;
  status: IntegrationStatus;
  callbackUrls: CallbackUrls;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProjectIntegrationInput {
  clientSurveyUrl?: string | null;
  parameterMapping?: Record<string, string[]> | null;
}

export interface TestIntegrationChecks {
  integrationExists: boolean;
  clientSurveyUrlExists: boolean;
  completeCallbackUrlExists: boolean;
  terminateCallbackUrlExists: boolean;
  quotaFullCallbackUrlExists: boolean;
  securityCallbackUrlExists: boolean;
  testCallbackUrlExists: boolean;
}

export interface TestIntegrationResult {
  success: boolean;
  message: string;
  passed: boolean;
  checks: TestIntegrationChecks;
  integration: ProjectIntegration;
}

export interface Supplier {
  id: string;
  name: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSupplier {
  id: string;
  projectId: string;
  supplierId: string;
  status: 'ACTIVE' | 'PAUSED' | 'INACTIVE';
  cpi?: number;
  allocation?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RespondentSession {
  id: string;
  projectId: string;
  supplierId: string;
  status: 'STARTED' | 'COMPLETE' | 'TERMINATE' | 'QUOTA_FULL' | 'SECURITY_TERMINATE';
  ipAddress?: string;
  userAgent?: string;
  startedAt: string;
  completedAt?: string;
  supplierParams?: Record<string, string>;
}

export interface ProjectQuota {
  id: string;
  projectId: string;
  name: string;
  target: number;
  current: number;
  status: 'OPEN' | 'FULL';
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  totalProjects: number;
  liveProjects: number;
  totalCompletes: number;
  totalTerminates: number;
  averageConversionRate: number;
}

export interface FraudSignal {
  id: string;
  sessionId: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'NEW' | 'REVIEWED' | 'DISMISSED' | 'ACTIONED';
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ReportExportOptions {
  format: 'CSV' | 'JSON';
  startDate?: string;
  endDate?: string;
  projectId?: string;
  supplierId?: string;
}
