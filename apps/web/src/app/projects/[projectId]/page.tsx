/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unnecessary-type-assertion */
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { projectApi } from '@/lib/project-api';
import { getSelectedOrganizationId } from '@/lib/organization-storage';
import type { Project } from '@/types';
import {
  FolderKanban,
  Users,
  BarChart3,
  ScrollText,
  ShieldAlert,
  ArrowLeft,
  Calendar,
  Briefcase,
  Edit,
  Trash,
} from 'lucide-react';

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

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
        const data = await projectApi.getProject(orgId!, projectId);
        if (mounted) {
          setProject(data);
          setError(null);
        }
      } catch (err: unknown) {
        console.error('Failed to load project details', err);
        if (mounted) {
          setError('Failed to load project details. Please try again later.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadProject();

    return () => {
      mounted = false;
    };
  }, [projectId, router]);

  const handleArchive = async () => {
    if (!organizationId || !project) return;

    if (confirm('Are you sure you want to archive this project? It will no longer be active.')) {
      setIsArchiving(true);
      try {
        await projectApi.archiveProject(organizationId, projectId);
        router.push('/projects' as any);
      } catch (err) {
        console.error('Failed to archive project', err);
        alert('Failed to archive project. Please try again.');
        setIsArchiving(false);
      }
    }
  };

  if (!organizationId) {
    return null; // Redirecting
  }

  if (loading) {
    return <LoadingState message="Loading project details..." />;
  }

  if (error || !project) {
    return (
      <div className="flex-1 p-4 md:p-8 pt-6">
        <ErrorState
          message={error || 'Project not found'}
          onRetry={() => {
            window.location.reload();
          }}
        />
      </div>
    );
  }

  const modules = [
    {
      title: 'Integration',
      description: 'Callback URLs and configurations',
      icon: FolderKanban,
      color: 'text-blue-500',
    },
    {
      title: 'Suppliers',
      description: 'Tracking links and allocations',
      icon: Users,
      color: 'text-green-500',
    },
    {
      title: 'Respondent Sessions',
      description: 'Monitor live traffic',
      icon: Activity,
      color: 'text-purple-500',
    },
    {
      title: 'Quotas',
      description: 'Manage project targets',
      icon: PieChart,
      color: 'text-yellow-500',
    },
    { title: 'Reports', description: 'Export field data', icon: BarChart3, color: 'text-teal-500' },
    {
      title: 'Audit Logs',
      description: 'Track changes',
      icon: ScrollText,
      color: 'text-orange-500',
    },
    {
      title: 'Fraud Signals',
      description: 'Traffic quality alerts',
      icon: ShieldAlert,
      color: 'text-red-500',
    },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center mb-6 space-x-2">
        <Link
          href={'/projects' as any}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted h-9 w-9"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Link>
        <span className="text-sm text-muted-foreground">/</span>
        <span className="text-sm font-medium">{project.name}</span>
      </div>

      <div className="flex items-start justify-between space-y-2">
        <PageHeader title={project.name} description="Project Dashboard" />
        <div className="flex items-center space-x-2">
          <Link
            href={`/projects/${project.id}/edit` as any}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted border shadow-sm h-9 px-4 py-2"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Project
          </Link>
          <button
            onClick={() => void handleArchive()}
            disabled={isArchiving || project.status === 'ARCHIVED'}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-destructive hover:text-destructive-foreground border shadow-sm h-9 px-4 py-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Trash className="mr-2 h-4 w-4" />
            Archive
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow col-span-2">
          <div className="p-6 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">
              Project Details
            </h3>
          </div>
          <div className="px-6 pb-6 pt-0">
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
                  {project.status}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Client</p>
                <p className="text-sm font-medium flex items-center">
                  <Briefcase className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  {project.clientName || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Start Date</p>
                <p className="text-sm font-medium flex items-center">
                  <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'TBD'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">End Date</p>
                <p className="text-sm font-medium flex items-center">
                  <Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'TBD'}
                </p>
              </div>
            </div>
            {project.description && (
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{project.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Project Modules</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <div
                key={module.title}
                className="rounded-xl border bg-card text-card-foreground shadow opacity-70 transition-opacity"
              >
                <div className="p-6 flex flex-col items-center text-center space-y-2">
                  <div className={`p-3 rounded-full bg-muted ${module.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h4 className="font-semibold">{module.title}</h4>
                  <p className="text-sm text-muted-foreground">{module.description}</p>
                  <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold mt-2">
                    Coming Soon
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Additional icons needed for this page
function Activity(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function PieChart(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}
