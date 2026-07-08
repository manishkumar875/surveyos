/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unnecessary-type-assertion */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { projectApi } from '@/lib/project-api';
import { ApiError } from '@/lib/api-client';
import { getSelectedOrganizationId } from '@/lib/organization-storage';

export default function CreateProjectPage() {
  const router = useRouter();
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
    const orgId = getSelectedOrganizationId();
    if (!orgId) {
      router.replace('/organizations');
    } else {
      setOrganizationId(orgId);
    }
  }, [router]);

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
    setIsLoading(true);

    try {
      const payload = {
        name: formData.name,
        clientName: formData.clientName || undefined,
        description: formData.description || undefined,
        status: formData.status,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
      };

      const res = await projectApi.createProject(organizationId, payload);
      if (res.success && res.data) {
        router.push(`/projects/${res.data.id}` as any);
      } else {
        setError('Failed to create project. Unknown error.');
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
        setError(err.message || 'Failed to create project. Please try again.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!organizationId) {
    return null; // Will redirect
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-3xl mx-auto w-full">
      <div className="flex items-center mb-8 space-x-2">
        <Link
          href={'/projects' as any}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted h-9 w-9"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Create Project</h1>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="font-semibold leading-none tracking-tight">Project Details</h3>
          <p className="text-sm text-muted-foreground">
            Enter the primary details for the new project.
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
                Initial Status
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
                onClick={() => router.push('/projects' as any)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted h-9 px-4 py-2 mr-2"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !formData.name.trim()}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Project
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
