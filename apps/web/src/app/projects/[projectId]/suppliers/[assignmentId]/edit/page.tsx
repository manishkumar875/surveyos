/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unnecessary-type-assertion */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { getSelectedOrganizationId } from '@/lib/organization-storage';
import { projectSupplierApi } from '@/lib/project-supplier-api';
import { ApiError } from '@/lib/api-client';
import type { UpdateProjectSupplierInput, ProjectSupplierStatus, ProjectSupplier } from '@/types';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';

export default function EditAssignmentPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const assignmentId = params.assignmentId as string;

  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const [assignment, setAssignment] = useState<ProjectSupplier | null>(null);
  const [loadingInit, setLoadingInit] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [formData, setFormData] = useState<UpdateProjectSupplierInput>({
    status: 'ACTIVE',
    notes: '',
  });

  const loadData = useCallback(async (orgId: string, pId: string, aId: string) => {
    try {
      setLoadingInit(true);
      setInitError(null);
      const data = await projectSupplierApi.getProjectSupplier(orgId, pId, aId);
      setAssignment(data);
      setFormData({
        status: data.status,
        notes: data.notes || '',
      });
    } catch (err) {
      console.error('Failed to load assignment:', err);
      setInitError('Failed to load project supplier assignment.');
    } finally {
      setLoadingInit(false);
    }
  }, []);

  useEffect(() => {
    const orgId = getSelectedOrganizationId();
    if (!orgId) {
      router.replace('/organizations' as any);
      return;
    }
    setOrganizationId(orgId);
    void loadData(orgId, projectId, assignmentId);
  }, [router, projectId, assignmentId, loadData]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId || !projectId || !assignmentId) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const payload: UpdateProjectSupplierInput = {
        status: formData.status as ProjectSupplierStatus,
        notes: formData.notes?.trim() || null,
      };

      const res = await projectSupplierApi.updateProjectSupplier(
        organizationId,
        projectId,
        assignmentId,
        payload,
      );
      if (res.success) {
        router.push(`/projects/${projectId}/suppliers/${assignmentId}` as any);
      } else {
        setSaveError('Failed to update assignment.');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setSaveError(err.message || 'Failed to update assignment');
      } else {
        setSaveError('An unexpected error occurred');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!organizationId) {
    return null;
  }

  if (loadingInit) return <LoadingState message="Loading assignment..." />;
  if (initError || !assignment)
    return (
      <ErrorState
        message={initError || 'Not found'}
        onRetry={() => void loadData(organizationId, projectId, assignmentId)}
      />
    );

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-2xl mx-auto w-full">
      <div className="flex items-center mb-8 space-x-2">
        <Link
          href={`/projects/${projectId}/suppliers/${assignmentId}` as any}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted h-9 w-9"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back to Details</span>
        </Link>
        <span className="text-sm text-muted-foreground">/</span>
        <Link
          href={`/projects/${projectId}/suppliers/${assignmentId}` as any}
          className="text-sm font-medium hover:underline text-muted-foreground"
        >
          {assignment.supplier?.name}
        </Link>
        <span className="text-sm text-muted-foreground">/</span>
        <span className="text-sm font-medium">Edit</span>
      </div>

      <PageHeader
        title="Edit Assignment"
        description={`Update settings for ${assignment.supplier?.name}`}
      />

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6 mt-6">
        {saveError && (
          <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p className="text-sm font-medium">{saveError}</p>
          </div>
        )}

        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="status"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Status
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
                  {assignment.status === 'ARCHIVED' && <option value="ARCHIVED">Archived</option>}
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
                  rows={4}
                  placeholder="E.g. Target CPI, quotas, special instructions..."
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button
                type="button"
                onClick={() =>
                  router.push(`/projects/${projectId}/suppliers/${assignmentId}` as any)
                }
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted h-9 px-4 py-2 mr-2"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
