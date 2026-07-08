import { apiClient } from './api-client';
import type { ProjectSupplier, AssignSupplierInput, UpdateProjectSupplierInput } from '@/types';

const projectSupplierBase = (organizationId: string, projectId: string) =>
  `/organizations/${organizationId}/projects/${projectId}/suppliers`;

export const projectSupplierApi = {
  /**
   * List suppliers assigned to a project
   */
  async listProjectSuppliers(
    organizationId: string,
    projectId: string,
    params?: { status?: string; search?: string },
  ): Promise<ProjectSupplier[]> {
    const res = await apiClient.get<{ success: boolean; data: ProjectSupplier[] }>(
      projectSupplierBase(organizationId, projectId),
      { params: params as Record<string, string> },
    );
    return res.data;
  },

  /**
   * Get a single project supplier assignment by ID
   */
  async getProjectSupplier(
    organizationId: string,
    projectId: string,
    projectSupplierId: string,
  ): Promise<ProjectSupplier> {
    const res = await apiClient.get<{ success: boolean; data: ProjectSupplier }>(
      `${projectSupplierBase(organizationId, projectId)}/${projectSupplierId}`,
    );
    return res.data;
  },

  /**
   * Assign a supplier to a project
   */
  async assignSupplierToProject(
    organizationId: string,
    projectId: string,
    data: AssignSupplierInput,
  ): Promise<{ success: boolean; data: ProjectSupplier }> {
    return apiClient.post<{ success: boolean; data: ProjectSupplier }>(
      projectSupplierBase(organizationId, projectId),
      data,
    );
  },

  /**
   * Update a project supplier assignment
   */
  async updateProjectSupplier(
    organizationId: string,
    projectId: string,
    projectSupplierId: string,
    data: UpdateProjectSupplierInput,
  ): Promise<{ success: boolean; data: ProjectSupplier }> {
    return apiClient.patch<{ success: boolean; data: ProjectSupplier }>(
      `${projectSupplierBase(organizationId, projectId)}/${projectSupplierId}`,
      data,
    );
  },

  /**
   * Archive a project supplier assignment
   */
  async archiveProjectSupplier(
    organizationId: string,
    projectId: string,
    projectSupplierId: string,
  ): Promise<{ success: boolean; message: string; assignment: ProjectSupplier }> {
    return apiClient.delete<{ success: boolean; message: string; assignment: ProjectSupplier }>(
      `${projectSupplierBase(organizationId, projectId)}/${projectSupplierId}`,
    );
  },
};
