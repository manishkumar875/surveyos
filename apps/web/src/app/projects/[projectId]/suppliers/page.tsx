/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unnecessary-type-assertion */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Users, Search, Link as LinkIcon, Copy, Check, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { projectSupplierApi } from '@/lib/project-supplier-api';
import { projectApi } from '@/lib/project-api';
import { getSelectedOrganizationId } from '@/lib/organization-storage';
import type { ProjectSupplier, Project } from '@/types';

export default function ProjectSuppliersPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [assignments, setAssignments] = useState<ProjectSupplier[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = useCallback(async (orgId: string, pId: string, search?: string) => {
    try {
      setLoading(true);
      setError(null);
      const [projData, assignmentsData] = await Promise.all([
        projectApi.getProject(orgId, pId),
        projectSupplierApi.listProjectSuppliers(orgId, pId, { search }),
      ]);
      setProject(projData);
      setAssignments(assignmentsData);
    } catch (err) {
      console.error('Failed to load project suppliers:', err);
      setError('Failed to load suppliers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const orgId = getSelectedOrganizationId();
    if (!orgId) {
      router.replace('/organizations' as any);
      return;
    }
    setOrganizationId(orgId);
    void loadData(orgId, projectId);
  }, [router, projectId, loadData]);

  // Debounce search
  useEffect(() => {
    if (!organizationId || !projectId) return;
    const timer = setTimeout(() => {
      void loadData(organizationId, projectId, searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, organizationId, projectId, loadData]);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (!organizationId) {
    return null; // Redirecting
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PAUSED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'ARCHIVED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center mb-6 space-x-2">
        <Link
          href={`/projects/${projectId}` as any}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted h-9 w-9"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back to Project</span>
        </Link>
        <span className="text-sm text-muted-foreground">/</span>
        <Link
          href={`/projects/${projectId}` as any}
          className="text-sm font-medium hover:underline text-muted-foreground"
        >
          {project?.name || 'Project'}
        </Link>
        <span className="text-sm text-muted-foreground">/</span>
        <span className="text-sm font-medium">Suppliers</span>
      </div>

      <div className="flex items-center justify-between">
        <PageHeader
          title="Project Suppliers"
          description={`Manage traffic sources and tracking links for ${project?.name || 'this project'}.`}
        />
        <div className="flex items-center space-x-2">
          <Link
            href={`/projects/${projectId}/suppliers/new` as any}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            Assign Supplier
          </Link>
        </div>
      </div>

      <div className="flex items-center space-x-2 mb-6 mt-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search assigned suppliers..."
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pl-9 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading && assignments.length === 0 ? (
        <LoadingState message="Loading project suppliers..." />
      ) : error ? (
        <ErrorState
          message={error}
          onRetry={() => void loadData(organizationId, projectId, searchQuery)}
        />
      ) : assignments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center animate-in fade-in-50 mt-6">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Users className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="mt-6 text-xl font-semibold">No suppliers assigned</h2>
            <p className="mb-8 mt-2 text-center text-sm font-normal leading-6 text-muted-foreground">
              {searchQuery
                ? 'Try adjusting your search query.'
                : 'Assign a supplier to generate tracking links for this project.'}
            </p>
            {!searchQuery && (
              <Link
                href={`/projects/${projectId}/suppliers/new` as any}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
              >
                <Plus className="mr-2 h-4 w-4" />
                Assign Supplier
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 mt-6">
          {assignments.map((assignment) => (
            <div
              key={assignment.id}
              className="rounded-xl border bg-card text-card-foreground shadow transition-all hover:border-primary/50 hover:shadow-md flex flex-col p-5"
            >
              <div className="flex justify-between items-start mb-4">
                <Link
                  href={`/projects/${projectId}/suppliers/${assignment.id}` as any}
                  className="hover:underline"
                >
                  <h3 className="font-semibold text-lg line-clamp-1 text-primary">
                    {assignment.supplier?.name || 'Unknown Supplier'}
                  </h3>
                </Link>
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusColor(assignment.status)}`}
                >
                  {assignment.status}
                </span>
              </div>

              <div className="space-y-3 mt-auto pt-2 flex-1 flex flex-col justify-end">
                {assignment.trackingUrl ? (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground flex items-center">
                      <LinkIcon className="h-3 w-3 mr-1" />
                      Tracking Link
                    </p>
                    <div className="flex items-center space-x-2">
                      <input
                        readOnly
                        value={assignment.trackingUrl}
                        className="flex h-8 w-full rounded-md border border-input bg-muted/50 px-3 py-1 text-xs shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => void copyToClipboard(assignment.trackingUrl!, assignment.id)}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted border shadow-sm h-8 w-8 shrink-0"
                        title="Copy tracking link"
                      >
                        {copiedId === assignment.id ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No tracking link available</p>
                )}

                <div className="pt-2 border-t mt-4 text-right">
                  <Link
                    href={`/projects/${projectId}/suppliers/${assignment.id}` as any}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    View Details &rarr;
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
