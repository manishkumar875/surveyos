/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unnecessary-type-assertion */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { projectApi } from '@/lib/project-api';
import { ApiError } from '@/lib/api-client';
import { getSelectedOrganizationId } from '@/lib/organization-storage';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    clientName: '',
    description: '',
    status: 'DRAFT',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    let mounted = true;
    const orgId = getSelectedOrganizationId();
    if (!orgId) {
      router.replace('/organizations');
      return;
    }
    setOrganizationId(orgId);

    async function loadProject() {
      try {
        const project = await projectApi.getProject(orgId!, projectId);
        if (mounted) {
          setFormData({
            name: project.name,
            clientName: project.clientName || '',
            description: project.description || '',
            status: project.status,
            startDate: project.startDate
              ? new Date(project.startDate).toISOString().slice(0, 16)
              : '',
            endDate: project.endDate ? new Date(project.endDate).toISOString().slice(0, 16) : '',
          });
          setError(null);
        }
      } catch (err: unknown) {
        console.error('Failed to load project', err);
        if (mounted) {
          setError('Failed to load project. It may have been deleted or you do not have access.');
        }
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    }

    void loadProject();

    return () => {
      mounted = false;
    };
  }, [projectId, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) return;

    setError(null);
    setIsSaving(true);

    try {
      const payload = {
        name: formData.name,
        clientName: formData.clientName || undefined,
        description: formData.description || undefined,
        status: formData.status,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
      };

      const res = await projectApi.updateProject(organizationId, projectId, payload);
      if (res.success && res.data) {
        router.push(`/projects/${projectId}` as any);
      } else {
        setError('Failed to update project. Unknown error.');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.data && typeof err.data === 'object' && 'details' in err.data) {
          const details = (err.data as { details?: Array<{ message?: string }> }).details;
          if (Array.isArray(details) && details.length > 0 && details[0]?.message) {
            setError(details[0].message);
            return;
          }
        }
        setError(err.message || 'Failed to update project. Please try again.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!organizationId) {
    return null; // Will redirect
  }

  if (isInitializing) {
    return <LoadingState message="Loading project for editing..." />;
  }

  if (error && !formData.name) {
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          window.location.reload();
        }}
      />
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-3xl mx-auto w-full">
      <div className="flex items-center mb-8 space-x-2">
        <Link
          href={`/projects/${projectId}` as any}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted h-9 w-9"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Edit Project</h1>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="font-semibold leading-none tracking-tight">Project Details</h3>
          <p className="text-sm text-muted-foreground">
            Update the primary details for the project.
          </p>
        </div>
        <div className="p-6 pt-0">
          <form
            onSubmit={(e) => {
              void handleSubmit(e);
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium leading-none">
                  Project Name <span className="text-destructive">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="e.g. Q3 Consumer Survey"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="clientName" className="text-sm font-medium leading-none">
                  Client Name
                </label>
                <input
                  id="clientName"
                  name="clientName"
                  type="text"
                  placeholder="e.g. Acme Corp"
                  value={formData.clientName}
                  onChange={handleChange}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium leading-none">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                placeholder="Brief description of the project goals..."
                value={formData.description}
                onChange={handleChange}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="startDate" className="text-sm font-medium leading-none">
                  Start Date
                </label>
                <input
                  id="startDate"
                  name="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="endDate" className="text-sm font-medium leading-none">
                  End Date
                </label>
                <input
                  id="endDate"
                  name="endDate"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            <div className="space-y-2 w-full md:w-1/2">
              <label htmlFor="status" className="text-sm font-medium leading-none">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>

            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm font-medium">
                {error}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => router.push(`/projects/${projectId}` as any)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted h-9 px-4 py-2 mr-2"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || !formData.name.trim()}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
