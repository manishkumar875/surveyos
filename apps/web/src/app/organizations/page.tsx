'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Briefcase, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { organizationApi } from '@/lib/organization-api';
import { setSelectedOrganizationId } from '@/lib/organization-storage';
import type { Organization } from '@/types';

export default function OrganizationsPage() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadOrganizations() {
      try {
        const orgs = await organizationApi.listOrganizations();
        if (mounted) {
          setOrganizations(orgs);
          setError(null);
        }
      } catch (err: unknown) {
        console.error('Failed to load organizations', err);
        if (mounted) {
          setError('Failed to load organizations. Please try again later.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadOrganizations();

    return () => {
      mounted = false;
    };
  }, []);

  const handleSelectOrganization = (orgId: string) => {
    setSelectedOrganizationId(orgId);
    router.push(`/organizations/${orgId}`);
  };

  if (loading) {
    return <LoadingState message="Loading your organizations..." />;
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
        <PageHeader title="Organizations" description="Manage your organizations and workspaces." />
        <div className="flex items-center space-x-2">
          <Link
            href={'/organizations/new'}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Organization
          </Link>
        </div>
      </div>

      {organizations.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No Organizations"
          description="You don't belong to any organizations yet. Create one to get started."
          action={
            <Link
              href={'/organizations/new'}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 mt-4"
            >
              Create Organization
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <div
              key={org.id}
              onClick={() => handleSelectOrganization(org.id)}
              className="rounded-xl border bg-card text-card-foreground shadow cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
            >
              <div className="p-6 flex flex-col space-y-1.5">
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold leading-none tracking-tight">{org.name}</h3>
                </div>
              </div>
              <div className="p-6 pt-0">
                <p className="text-sm text-muted-foreground">
                  Created {new Date(org.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
