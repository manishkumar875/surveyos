import { apiClient } from './api-client';
import type {
  RespondentSession,
  RespondentSessionListFilters,
  RespondentSessionPagination,
} from '@/types';

const base = (organizationId: string) => `/organizations/${organizationId}/respondent-sessions`;

export interface RespondentSessionListResponse {
  data: RespondentSession[];
  pagination: RespondentSessionPagination;
}

export const respondentSessionApi = {
  /**
   * List respondent sessions for an organization.
   * Filter by projectId to scope to a specific project.
   */
  async listRespondentSessions(
    organizationId: string,
    filters?: RespondentSessionListFilters,
  ): Promise<RespondentSessionListResponse> {
    const params: Record<string, string> = {};

    if (filters?.projectId) params.projectId = filters.projectId;
    if (filters?.supplierId) params.supplierId = filters.supplierId;
    if (filters?.projectSupplierId) params.projectSupplierId = filters.projectSupplierId;
    if (filters?.status) params.status = filters.status;
    if (filters?.supplierRespondentId) params.supplierRespondentId = filters.supplierRespondentId;
    if (filters?.page) params.page = String(filters.page);
    if (filters?.limit) params.limit = String(filters.limit);

    const res = await apiClient.get<{
      success: boolean;
      data: RespondentSession[];
      pagination: RespondentSessionPagination;
    }>(base(organizationId), { params });

    return { data: res.data, pagination: res.pagination };
  },

  /**
   * Get full details for a single respondent session (includes metadata).
   */
  async getRespondentSession(
    organizationId: string,
    sessionId: string,
  ): Promise<RespondentSession> {
    const res = await apiClient.get<{ success: boolean; data: RespondentSession }>(
      `${base(organizationId)}/${sessionId}`,
    );
    return res.data;
  },
};
