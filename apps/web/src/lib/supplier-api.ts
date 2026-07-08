import { apiClient } from './api-client';
import type { Supplier, CreateSupplierInput, UpdateSupplierInput } from '@/types';

const supplierBase = (organizationId: string) => `/organizations/${organizationId}/suppliers`;

export const supplierApi = {
  /**
   * List suppliers for an organization
   */
  async listSuppliers(
    organizationId: string,
    params?: { status?: string; search?: string },
  ): Promise<Supplier[]> {
    const res = await apiClient.get<{ success: boolean; data: Supplier[] }>(
      supplierBase(organizationId),
      { params: params as Record<string, string> },
    );
    return res.data;
  },

  /**
   * Get a single supplier by ID
   */
  async getSupplier(organizationId: string, supplierId: string): Promise<Supplier> {
    const res = await apiClient.get<{ success: boolean; data: Supplier }>(
      `${supplierBase(organizationId)}/${supplierId}`,
    );
    return res.data;
  },

  /**
   * Create a new supplier
   */
  async createSupplier(
    organizationId: string,
    data: CreateSupplierInput,
  ): Promise<{ success: boolean; data: Supplier }> {
    return apiClient.post<{ success: boolean; data: Supplier }>(supplierBase(organizationId), data);
  },

  /**
   * Update an existing supplier
   */
  async updateSupplier(
    organizationId: string,
    supplierId: string,
    data: UpdateSupplierInput,
  ): Promise<{ success: boolean; data: Supplier }> {
    return apiClient.patch<{ success: boolean; data: Supplier }>(
      `${supplierBase(organizationId)}/${supplierId}`,
      data,
    );
  },

  /**
   * Archive a supplier (soft delete)
   */
  async archiveSupplier(
    organizationId: string,
    supplierId: string,
  ): Promise<{ success: boolean; message: string; supplier: Supplier }> {
    return apiClient.delete<{ success: boolean; message: string; supplier: Supplier }>(
      `${supplierBase(organizationId)}/${supplierId}`,
    );
  },
};
