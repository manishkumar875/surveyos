import { apiClient } from './api-client';
import type { Project, CreateProjectInput, UpdateProjectInput } from '@/types';

export const projectApi = {
  /**
   * List projects for an organization
   */
  async listProjects(
    organizationId: string,
    params?: { status?: string; search?: string },
  ): Promise<Project[]> {
    const res = await apiClient.get<{ success: boolean; data: Project[] }>(
      `/organizations/${organizationId}/projects`,
      { params: params as Record<string, string> },
    );
    return res.data;
  },

  /**
   * Get project details
   */
  async getProject(organizationId: string, projectId: string): Promise<Project> {
    const res = await apiClient.get<{ success: boolean; data: Project }>(
      `/organizations/${organizationId}/projects/${projectId}`,
    );
    return res.data;
  },

  /**
   * Create a new project
   */
  async createProject(
    organizationId: string,
    data: CreateProjectInput,
  ): Promise<{ success: boolean; data?: Project }> {
    return apiClient.post<{ success: boolean; data?: Project }>(
      `/organizations/${organizationId}/projects`,
      data,
    );
  },

  /**
   * Update an existing project
   */
  async updateProject(
    organizationId: string,
    projectId: string,
    data: UpdateProjectInput,
  ): Promise<{ success: boolean; data?: Project }> {
    return apiClient.patch<{ success: boolean; data?: Project }>(
      `/organizations/${organizationId}/projects/${projectId}`,
      data,
    );
  },

  /**
   * Archive a project
   */
  async archiveProject(
    organizationId: string,
    projectId: string,
  ): Promise<{ success: boolean; project?: Project }> {
    return apiClient.delete<{ success: boolean; project?: Project }>(
      `/organizations/${organizationId}/projects/${projectId}`,
    );
  },
};
