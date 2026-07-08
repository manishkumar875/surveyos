import { apiClient } from './api-client';
import type { Organization, OrganizationMember } from '@/types';

export interface CreateOrganizationInput {
  name: string;
}

export interface ListOrganizationsResponse {
  success: boolean;
  data: Organization[];
}

export interface GetOrganizationResponse {
  success: boolean;
  data: Organization;
}

export interface CreateOrganizationResponse {
  success: boolean;
  message: string;
  data: {
    organization: Organization;
    membership: OrganizationMember;
  };
}

export interface GetOrganizationMembersResponse {
  success: boolean;
  data: OrganizationMember[];
}

export const organizationApi = {
  /**
   * Fetch all organizations the current user is a member of.
   */
  listOrganizations: async (): Promise<Organization[]> => {
    const response = await apiClient.get<ListOrganizationsResponse>('/organizations');
    return response.data;
  },

  /**
   * Fetch a single organization by ID.
   */
  getOrganization: async (id: string): Promise<Organization> => {
    const response = await apiClient.get<GetOrganizationResponse>(`/organizations/${id}`);
    return response.data;
  },

  /**
   * Create a new organization.
   */
  createOrganization: async (
    data: CreateOrganizationInput,
  ): Promise<CreateOrganizationResponse> => {
    return await apiClient.post<CreateOrganizationResponse>('/organizations', data);
  },

  /**
   * Fetch all members of an organization.
   */
  getOrganizationMembers: async (organizationId: string): Promise<OrganizationMember[]> => {
    const response = await apiClient.get<GetOrganizationMembersResponse>(
      `/organizations/${organizationId}/members`,
    );
    return response.data;
  },
};
