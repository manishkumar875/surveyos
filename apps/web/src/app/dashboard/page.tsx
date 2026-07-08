'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/ui/LoadingState';
import { organizationApi } from '@/lib/organization-api';
import { getSelectedOrganizationId } from '@/lib/organization-storage';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkOrganizations() {
      try {
        const selectedId = getSelectedOrganizationId();
        if (selectedId) {
          router.replace(`/organizations/${selectedId}`);
          return;
        }

        const orgs = await organizationApi.listOrganizations();
        if (mounted) {
          if (orgs.length === 1 && orgs[0]) {
            router.replace(`/organizations/${orgs[0].id}`);
          } else {
            router.replace('/organizations');
          }
        }
      } catch (error) {
        console.error('Failed to load organizations for dashboard redirect', error);
        if (mounted) {
          router.replace('/organizations');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void checkOrganizations();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (loading) {
    return <LoadingState message="Loading your dashboard..." />;
  }

  // Fallback if not redirected (should be rare)
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PageHeader title="Dashboard" description="Welcome to SurveyOS." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow h-32 flex items-center justify-center p-6 text-muted-foreground">
          Live Projects
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow h-32 flex items-center justify-center p-6 text-muted-foreground">
          Total Completes
        </div>
      </div>
    </div>
  );
}
