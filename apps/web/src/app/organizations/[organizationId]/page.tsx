/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unnecessary-type-assertion */
'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { organizationApi } from '@/lib/organization-api';
import type { Organization, OrganizationMember } from '@/types';
import { FolderKanban, Users, BarChart3, ScrollText, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function OrganizationDetailsPage() {
  const params = useParams();
  const organizationId = params.organizationId as string;

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadOrganizationData() {
      try {
        const [orgResponse, membersResponse] = await Promise.all([
          organizationApi.getOrganization(organizationId),
          organizationApi.getOrganizationMembers(organizationId),
        ]);

        if (mounted) {
          setOrganization(orgResponse);
          setMembers(membersResponse);
          setError(null);
        }
      } catch (err: unknown) {
        console.error('Failed to load organization data', err);
        if (mounted) {
          setError('Failed to load organization details. Please try again later.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadOrganizationData();

    return () => {
      mounted = false;
    };
  }, [organizationId]);

  if (loading) {
    return <LoadingState message="Loading organization details..." />;
  }

  if (error || !organization) {
    return (
      <ErrorState
        message={error || 'Organization not found'}
        onRetry={() => {
          window.location.reload();
        }}
      />
    );
  }

  const modules = [
    {
      title: 'Projects',
      description: 'Manage surveys and integrations',
      icon: FolderKanban,
      color: 'text-blue-500',
    },
    {
      title: 'Suppliers',
      description: 'Manage tracking and traffic sources',
      icon: Users,
      color: 'text-green-500',
    },
    {
      title: 'Reports',
      description: 'View data and exports',
      icon: BarChart3,
      color: 'text-purple-500',
    },
    {
      title: 'Audit Logs',
      description: 'Track system changes',
      icon: ScrollText,
      color: 'text-orange-500',
    },
    {
      title: 'Fraud Signals',
      description: 'Monitor traffic quality',
      icon: ShieldAlert,
      color: 'text-red-500',
    },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <PageHeader title={organization.name} description="Organization Dashboard" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow col-span-2">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Organization Info</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{organization.name}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Created {new Date(organization.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow col-span-2">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Team Members</h3>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active members in this workspace</p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Modules</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => {
            const Icon = module.icon;

            // Allow clicking Projects module to go to projects list
            if (module.title === 'Projects') {
              return (
                <Link
                  href={'/projects' as any}
                  key={module.title}
                  className="rounded-xl border bg-card text-card-foreground shadow transition-all hover:border-primary/50 hover:shadow-md cursor-pointer block"
                >
                  <div className="p-6 flex flex-col items-center text-center space-y-2">
                    <div className={`p-3 rounded-full bg-muted ${module.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <h4 className="font-semibold">{module.title}</h4>
                    <p className="text-sm text-muted-foreground">{module.description}</p>
                    <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-semibold mt-2">
                      Available
                    </span>
                  </div>
                </Link>
              );
            }

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
