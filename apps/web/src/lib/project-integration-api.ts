import { apiClient } from './api-client';
import type {
  ProjectIntegration,
  UpdateProjectIntegrationInput,
  TestIntegrationResult,
  IntegrationStatus,
} from '@/types';

const integrationBase = (organizationId: string, projectId: string) =>
  `/organizations/${organizationId}/projects/${projectId}/integration`;

export const projectIntegrationApi = {
  /**
   * Initialize integration for a project (idempotent — returns existing if already initialized)
   */
  async initProjectIntegration(
    organizationId: string,
    projectId: string,
  ): Promise<{ success: boolean; data: ProjectIntegration }> {
    return apiClient.post<{ success: boolean; data: ProjectIntegration }>(
      integrationBase(organizationId, projectId),
    );
  },

  /**
   * Get project integration (returns 404 if not initialized)
   */
  async getProjectIntegration(
    organizationId: string,
    projectId: string,
  ): Promise<{ success: boolean; data: ProjectIntegration }> {
    return apiClient.get<{ success: boolean; data: ProjectIntegration }>(
      integrationBase(organizationId, projectId),
    );
  },

  /**
   * Update clientSurveyUrl and/or parameterMapping
   */
  async updateProjectIntegration(
    organizationId: string,
    projectId: string,
    data: UpdateProjectIntegrationInput,
  ): Promise<{ success: boolean; data: ProjectIntegration }> {
    return apiClient.patch<{ success: boolean; data: ProjectIntegration }>(
      integrationBase(organizationId, projectId),
      data,
    );
  },

  /**
   * Run integration test — checks config validity, updates status to TESTING or FAILED
   */
  async testProjectIntegration(
    organizationId: string,
    projectId: string,
  ): Promise<TestIntegrationResult> {
    return apiClient.post<TestIntegrationResult>(
      `${integrationBase(organizationId, projectId)}/test`,
    );
  },

  /**
   * Manually update integration status (WAITING/TESTING/LIVE/FAILED)
   * Note: LIVE requires clientSurveyUrl to be set
   */
  async updateIntegrationStatus(
    organizationId: string,
    projectId: string,
    status: IntegrationStatus,
  ): Promise<{ success: boolean; data: ProjectIntegration }> {
    return apiClient.patch<{ success: boolean; data: ProjectIntegration }>(
      `${integrationBase(organizationId, projectId)}/status`,
      { status },
    );
  },
};
