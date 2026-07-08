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
  organizationId: string;
  status: string; // DRAFT, LIVE, PAUSED, COMPLETED
  country: string;
  targetCompletes: number;
  incidenceRate: number;
  loi: number;
  cpi: number;
  timeline?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectIntegration {
  id: string;
  projectId: string;
  clientSurveyUrl?: string;
  completeUrl?: string;
  terminateUrl?: string;
  quotaFullUrl?: string;
  securityUrl?: string;
  testUrl?: string;
  parameterMapping?: Record<string, string>;
  status: 'WAITING' | 'TESTING' | 'LIVE' | 'FAILED';
  createdAt: string;
  updatedAt: string;
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
