/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unnecessary-type-assertion */
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, FolderKanban, Briefcase, Calendar } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { projectApi } from '@/lib/project-api';
import { getSelectedOrganizationId } from '@/lib/organization-storage';
import type { Project } from '@/types';

export default function ProjectsListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const orgId = getSelectedOrganizationId();

    if (orgId) {
      setOrganizationId(orgId);
    } else {
      setLoading(false);
      return;
    }

    async function loadProjects() {
      try {
        const data = await projectApi.listProjects(orgId!);
        if (mounted) {
          setProjects(data);
          setError(null);
        }
      } catch (err: unknown) {
        console.error('Failed to load projects', err);
        if (mounted) {
          setError('Failed to load projects. Please try again later.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadProjects();

    return () => {
      mounted = false;
    };
  }, []);

  if (!organizationId) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <PageHeader title="Projects" description="Manage your organization's projects." />
        <EmptyState
          icon={Briefcase}
          title="No Organization Selected"
          description="Please select or create an organization to view projects."
          action={
            <Link
              href="/organizations"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 mt-4"
            >
              Go to Organizations
            </Link>
          }
        />
      </div>
    );
  }

  if (loading) {
    return <LoadingState message="Loading projects..." />;
  }

  if (error) {
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
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <PageHeader title="Projects" description="Manage surveys and integrations." />
        <div className="flex items-center space-x-2">
          <Link
            href={'/projects/new' as any}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </div>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No Projects Found"
          description="Get started by creating your first project in this organization."
          action={
            <Link
              href={'/projects/new' as any}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 mt-4"
            >
              Create Project
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link href={`/projects/${project.id}` as any} key={project.id} className="block group">
              <div className="rounded-xl border bg-card text-card-foreground shadow transition-all group-hover:border-primary/50 group-hover:shadow-md h-full flex flex-col">
                <div className="p-6 flex flex-col space-y-1.5 pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <FolderKanban className="h-5 w-5 text-blue-500" />
                      <h3 className="font-semibold leading-none tracking-tight line-clamp-1">
                        {project.name}
                      </h3>
                    </div>
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                      {project.status}
                    </span>
                  </div>
                  {project.clientName && (
                    <p className="text-sm text-muted-foreground mt-2 flex items-center">
                      <Briefcase className="h-3 w-3 mr-1" />
                      {project.clientName}
                    </p>
                  )}
                </div>
                <div className="p-6 pt-0 flex-1 flex flex-col justify-end">
                  <div className="flex items-center text-xs text-muted-foreground space-x-4 mt-4 pt-4 border-t">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Created {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
