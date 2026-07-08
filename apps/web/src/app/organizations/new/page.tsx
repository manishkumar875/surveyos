'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { organizationApi } from '@/lib/organization-api';
import { ApiError } from '@/lib/api-client';
import { setSelectedOrganizationId } from '@/lib/organization-storage';

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await organizationApi.createOrganization({ name });
      if (res.success && res.data?.organization) {
        // Automatically select the new organization and navigate to its dashboard
        setSelectedOrganizationId(res.data.organization.id);
        router.push(`/organizations/${res.data.organization.id}`);
      } else {
        setError('Failed to create organization. Unknown error.');
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
        setError(err.message || 'Failed to create organization. Please try again.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-2xl mx-auto w-full">
      <div className="flex items-center mb-8 space-x-2">
        <Link
          href={'/organizations'}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted h-9 w-9"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Create Organization</h1>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="font-semibold leading-none tracking-tight">Organization Details</h3>
          <p className="text-sm text-muted-foreground">
            Create a new workspace to manage your projects, suppliers, and team members.
          </p>
        </div>
        <div className="p-6 pt-0">
          <form
            onSubmit={(e) => {
              void handleSubmit(e);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium leading-none">
                Organization Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="e.g. Acme Market Research"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm font-medium">
                {error}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => router.push('/organizations')}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted h-9 px-4 py-2 mr-2"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !name.trim()}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Organization
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
