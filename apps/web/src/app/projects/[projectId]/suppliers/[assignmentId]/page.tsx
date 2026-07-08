/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unnecessary-type-assertion */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Archive,
  Check,
  Copy,
  Link as LinkIcon,
  Info,
  Users,
  Clock,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { projectSupplierApi } from '@/lib/project-supplier-api';
import { getSelectedOrganizationId } from '@/lib/organization-storage';
import type { ProjectSupplier } from '@/types';

export default function AssignmentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const assignmentId = params.assignmentId as string;

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<ProjectSupplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const loadData = useCallback(async (orgId: string, pId: string, aId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectSupplierApi.getProjectSupplier(orgId, pId, aId);
      setAssignment(data);
    } catch (err) {
      console.error('Failed to load assignment:', err);
      setError('Failed to load project supplier assignment. It may have been removed.');
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
    void loadData(orgId, projectId, assignmentId);
  }, [router, projectId, assignmentId, loadData]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleArchive = async () => {
    if (!organizationId || !assignment) return;
    if (
      !confirm(
        'Are you sure you want to archive this assignment? Traffic tracking will be disabled.',
      )
    )
      return;

    try {
      setIsArchiving(true);
      await projectSupplierApi.archiveProjectSupplier(organizationId, projectId, assignmentId);
      router.push(`/projects/${projectId}/suppliers` as any);
    } catch (err) {
      console.error('Failed to archive:', err);
      alert('Failed to archive assignment.');
      setIsArchiving(false);
    }
  };

  if (!organizationId) {
    return null;
  }

  if (loading) return <LoadingState message="Loading assignment details..." />;
  if (error || !assignment)
    return (
      <ErrorState
        message={error || 'Assignment not found'}
        onRetry={() => void loadData(organizationId, projectId, assignmentId)}
      />
    );

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

  const exampleUrl = assignment.trackingUrl
    ? `${assignment.trackingUrl}?rid=RESP001&subid=SUB001&source=panel-a`
    : '';

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center mb-6 space-x-2">
        <Link
          href={`/projects/${projectId}/suppliers` as any}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted h-9 w-9"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back to Suppliers</span>
        </Link>
        <span className="text-sm text-muted-foreground">/</span>
        <Link
          href={`/projects/${projectId}/suppliers` as any}
          className="text-sm font-medium hover:underline text-muted-foreground"
        >
          Suppliers
        </Link>
        <span className="text-sm text-muted-foreground">/</span>
        <span className="text-sm font-medium">{assignment.supplier?.name}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <PageHeader
            title={assignment.supplier?.name || 'Unknown Supplier'}
            description="Project Supplier Assignment"
          />
          <span
            className={`mt-1 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold shadow-sm ${getStatusColor(assignment.status)}`}
          >
            {assignment.status}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {assignment.status !== 'ARCHIVED' && (
            <Link
              href={`/projects/${projectId}/suppliers/${assignmentId}/edit` as any}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted border shadow-sm h-9 px-4 py-2"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          )}
          {assignment.status !== 'ARCHIVED' && (
            <button
              onClick={() => void handleArchive()}
              disabled={isArchiving}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-destructive/10 hover:text-destructive border shadow-sm h-9 px-4 py-2"
            >
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 mt-6 md:grid-cols-3">
        {/* Tracking Link Card (Takes up 2/3 width) */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-xl border bg-card text-card-foreground shadow">
            <div className="p-6">
              <h3 className="text-lg font-semibold flex items-center mb-4">
                <LinkIcon className="h-5 w-5 mr-2 text-primary" />
                Supplier Tracking Link
              </h3>

              {assignment.trackingUrl ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      readOnly
                      value={assignment.trackingUrl}
                      className="flex h-10 w-full rounded-md border border-input bg-muted/50 px-3 py-2 text-sm shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => void copyToClipboard(assignment.trackingUrl!)}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-4 py-2 shrink-0"
                    >
                      {copiedLink ? (
                        <Check className="mr-2 h-4 w-4" />
                      ) : (
                        <Copy className="mr-2 h-4 w-4" />
                      )}
                      {copiedLink ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  <div className="rounded-lg bg-blue-50 p-4 border border-blue-100">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-blue-500 mr-2 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-blue-800">Custom Query Parameters</p>
                        <p className="text-sm text-blue-700">
                          SurveyOS automatically preserves and forwards custom query parameters
                          added by the supplier (such as{' '}
                          <code className="bg-blue-100 px-1 py-0.5 rounded">rid</code>,{' '}
                          <code className="bg-blue-100 px-1 py-0.5 rounded">subid</code>, etc.)
                          throughout the respondent session.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <p className="text-sm font-medium">Usage Example:</p>
                    <div className="rounded-md bg-muted p-3 text-xs font-mono break-all text-muted-foreground border">
                      {exampleUrl}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No tracking link available for this assignment.
                </p>
              )}
            </div>
          </div>

          {assignment.notes && (
            <div className="rounded-xl border bg-card text-card-foreground shadow">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Internal Notes</h3>
                <p className="text-sm whitespace-pre-wrap">{assignment.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <div className="rounded-xl border bg-card text-card-foreground shadow">
            <div className="p-6">
              <h3 className="font-semibold flex items-center mb-4">
                <Users className="h-4 w-4 mr-2" /> Supplier Details
              </h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="font-medium">{assignment.supplier?.name}</dd>
                </div>
                {assignment.supplier?.contactName && (
                  <div>
                    <dt className="text-muted-foreground">Contact</dt>
                    <dd>{assignment.supplier.contactName}</dd>
                  </div>
                )}
                {assignment.supplier?.email && (
                  <div>
                    <dt className="text-muted-foreground">Email</dt>
                    <dd>
                      <a
                        href={`mailto:${assignment.supplier.email}`}
                        className="text-primary hover:underline"
                      >
                        {assignment.supplier.email}
                      </a>
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-muted-foreground">Supplier Status</dt>
                  <dd>{assignment.supplier?.status}</dd>
                </div>
                <div className="pt-2 mt-2 border-t">
                  <Link
                    href={`/suppliers/${assignment.supplier?.id}` as any}
                    className="text-primary hover:underline text-sm font-medium"
                  >
                    View Supplier Profile &rarr;
                  </Link>
                </div>
              </dl>
            </div>
          </div>

          <div className="rounded-xl border bg-card text-card-foreground shadow">
            <div className="p-6">
              <h3 className="font-semibold flex items-center mb-4">
                <Clock className="h-4 w-4 mr-2" /> History
              </h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Assigned On</dt>
                  <dd>{new Date(assignment.createdAt).toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Last Updated</dt>
                  <dd>{new Date(assignment.updatedAt).toLocaleString()}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
