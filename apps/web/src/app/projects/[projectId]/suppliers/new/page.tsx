/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unnecessary-type-assertion */
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { getSelectedOrganizationId } from '@/lib/organization-storage';
import { projectSupplierApi } from '@/lib/project-supplier-api';
import { supplierApi } from '@/lib/supplier-api';
import { ApiError } from '@/lib/api-client';
import type { AssignSupplierInput, ProjectSupplierStatus, Supplier } from '@/types';

export default function AssignSupplierPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [availableSuppliers, setAvailableSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);

  const [formData, setFormData] = useState<AssignSupplierInput>({
    supplierId: '',
    status: 'ACTIVE',
    notes: '',
  });

  useEffect(() => {
    const orgId = getSelectedOrganizationId();
    if (!orgId) {
      router.replace('/organizations' as any);
      return;
    }
    setOrganizationId(orgId);

    const fetchSuppliers = async () => {
      try {
        // Fetch all active suppliers for the organization
        const suppliers = await supplierApi.listSuppliers(orgId, { status: 'ACTIVE' });
        setAvailableSuppliers(suppliers);
        if (suppliers.length > 0) {
          setFormData((prev) => ({ ...prev, supplierId: suppliers[0]?.id || '' }));
        }
      } catch (err) {
        console.error('Failed to load organization suppliers:', err);
        setError('Failed to load available suppliers.');
      } finally {
        setLoadingSuppliers(false);
      }
    };

    void fetchSuppliers();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId || !projectId) return;

    if (!formData.supplierId) {
      setError('Please select a supplier to assign.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload: AssignSupplierInput = {
        supplierId: formData.supplierId,
        status: formData.status as ProjectSupplierStatus,
        notes: formData.notes?.trim() || null,
      };

      const res = await projectSupplierApi.assignSupplierToProject(
        organizationId,
        projectId,
        payload,
      );
      if (res.success && res.data) {
        router.push(`/projects/${projectId}/suppliers/${res.data.id}` as any);
      } else {
        setError('Failed to assign supplier. Unknown error.');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message || 'Failed to assign supplier');
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!organizationId) {
    return null; // Redirecting
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-2xl mx-auto w-full">
      <div className="flex items-center mb-8 space-x-2">
        <Link
          href={`/projects/${projectId}/suppliers` as any}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted h-9 w-9"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back to Suppliers</span>
        </Link>
        <span className="text-sm text-muted-foreground">/</span>
        <Link
          href={`/projects/${projectId}/suppliers` as any}
          className="text-sm font-medium hover:underline text-muted-foreground"
        >
          Suppliers
        </Link>
        <span className="text-sm text-muted-foreground">/</span>
        <span className="text-sm font-medium">Assign</span>
      </div>

      <PageHeader title="Assign Supplier" description="Add a new traffic source to this project." />

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6 mt-6">
        {error && (
          <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="supplierId"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Select Supplier *
                </label>
                {loadingSuppliers ? (
                  <div className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm items-center text-muted-foreground">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading suppliers...
                  </div>
                ) : availableSuppliers.length === 0 ? (
                  <div className="flex flex-col space-y-2">
                    <div className="flex h-9 w-full rounded-md border border-destructive/50 bg-destructive/10 px-3 py-1 text-sm shadow-sm items-center text-destructive">
                      No active suppliers found in this organization.
                    </div>
                    <Link href="/suppliers/new" className="text-sm text-primary hover:underline">
                      Create a new supplier first
                    </Link>
                  </div>
                ) : (
                  <select
                    id="supplierId"
                    name="supplierId"
                    value={formData.supplierId}
                    onChange={handleChange}
                    required
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {availableSuppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}
                <p className="text-xs text-muted-foreground">
                  Only ACTIVE suppliers in the organization are listed here.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <label
                  htmlFor="status"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Initial Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="ACTIVE">Active (Live Traffic)</option>
                  <option value="PAUSED">Paused (Traffic Blocked)</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div className="space-y-2 pt-2">
                <label
                  htmlFor="notes"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Internal Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes || ''}
                  onChange={handleChange}
                  rows={3}
                  placeholder="E.g. Target CPI, quotas, special instructions..."
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                type="button"
                onClick={() => router.push(`/projects/${projectId}/suppliers` as any)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted h-9 px-4 py-2 mr-2"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.supplierId || availableSuppliers.length === 0}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Assign Supplier
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
