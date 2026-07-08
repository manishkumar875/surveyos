/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Globe,
  Monitor,
  Clock,
  Link as LinkIcon,
  Info,
  Users,
  ShieldAlert,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { respondentSessionApi } from '@/lib/respondent-session-api';
import { getSelectedOrganizationId } from '@/lib/organization-storage';
import type { RespondentSession, RespondentSessionStatus } from '@/types';

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: RespondentSessionStatus }) {
  const map: Record<RespondentSessionStatus, { label: string; cls: string }> = {
    STARTED: { label: 'Started', cls: 'bg-blue-100 text-blue-800 border-blue-200' },
    REDIRECTED: { label: 'Redirected', cls: 'bg-purple-100 text-purple-800 border-purple-200' },
    COMPLETED: { label: 'Completed', cls: 'bg-green-100 text-green-800 border-green-200' },
    TERMINATED: { label: 'Terminated', cls: 'bg-red-100 text-red-800 border-red-200' },
    QUOTA_FULL: { label: 'Quota Full', cls: 'bg-orange-100 text-orange-800 border-orange-200' },
    SECURITY: { label: 'Security', cls: 'bg-rose-100 text-rose-800 border-rose-200' },
    ABANDONED: { label: 'Abandoned', cls: 'bg-gray-100 text-gray-800 border-gray-200' },
  };
  const { label, cls } = map[status] ?? {
    label: status,
    cls: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold shadow-sm ${cls}`}
    >
      {label}
    </span>
  );
}

function maskToken(token: string): string {
  if (token.length <= 8) return '••••••••';
  return token.slice(0, 6) + '••••••••••••' + token.slice(-4);
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SessionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const sessionId = params.sessionId as string;

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [session, setSession] = useState<RespondentSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (orgId: string, sId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await respondentSessionApi.getRespondentSession(orgId, sId);
      setSession(data);
    } catch (err) {
      console.error('Failed to load session:', err);
      setError('Failed to load session details.');
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
    void loadData(orgId, sessionId);
  }, [router, sessionId, loadData]);

  if (!organizationId) return null;
  if (loading) return <LoadingState message="Loading session details..." />;
  if (error || !session)
    return (
      <ErrorState
        message={error ?? 'Session not found'}
        onRetry={() => void loadData(organizationId, sessionId)}
      />
    );

  // Flatten metadata for display
  const metadataEntries = session.metadata ? Object.entries(session.metadata) : [];

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 max-w-4xl mx-auto w-full">
      {/* Breadcrumb */}
      <div className="flex items-center mb-6 space-x-2">
        <Link
          href={`/projects/${projectId}/sessions`}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted h-9 w-9"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <span className="text-sm text-muted-foreground">/</span>
        <Link
          href={`/projects/${projectId}/sessions`}
          className="text-sm font-medium hover:underline text-muted-foreground"
        >
          Respondent Sessions
        </Link>
        <span className="text-sm text-muted-foreground">/</span>
        <span className="text-sm font-mono text-muted-foreground">
          {maskToken(session.sessionToken)}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <PageHeader title="Session Details" description="Respondent session record" />
          <StatusBadge status={session.status} />
        </div>
      </div>

      {/* Body grid */}
      <div className="grid gap-6 md:grid-cols-3 mt-6">
        {/* Left / Main – 2 col */}
        <div className="md:col-span-2 space-y-6">
          {/* Preserved Query Parameters / Metadata */}
          <div className="rounded-xl border bg-card shadow">
            <div className="p-6">
              <h3 className="text-base font-semibold flex items-center mb-4">
                <Info className="h-4 w-4 mr-2 text-primary" />
                Preserved Query Parameters
              </h3>
              {metadataEntries.length > 0 ? (
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                          Parameter
                        </th>
                        <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                          Value
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {metadataEntries.map(([key, val]) => (
                        <tr key={key} className="border-b last:border-0">
                          <td className="px-4 py-2 font-mono text-xs font-medium">{key}</td>
                          <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                            {String(val)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-md bg-muted/30 p-4 text-sm text-muted-foreground italic">
                  No preserved query parameters for this session (e.g., no rid, subid, source,
                  campaign were passed).
                </div>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                SurveyOS captures and forwards any query parameters appended to the supplier
                tracking link (such as <code className="bg-muted px-1 rounded">rid</code>,{' '}
                <code className="bg-muted px-1 rounded">subid</code>,{' '}
                <code className="bg-muted px-1 rounded">source</code>,{' '}
                <code className="bg-muted px-1 rounded">campaign</code>) without blocking traffic.
              </p>
            </div>
          </div>

          {/* URLs */}
          <div className="rounded-xl border bg-card shadow">
            <div className="p-6">
              <h3 className="text-base font-semibold flex items-center mb-4">
                <LinkIcon className="h-4 w-4 mr-2 text-primary" />
                URLs
              </h3>
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground mb-1">
                    Entry URL (Tracking Link Clicked)
                  </dt>
                  <dd className="font-mono text-xs break-all bg-muted/30 rounded p-2">
                    {session.entryUrl ?? <span className="italic text-muted-foreground">—</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground mb-1">
                    Redirect URL (Client Survey)
                  </dt>
                  <dd className="font-mono text-xs break-all bg-muted/30 rounded p-2">
                    {session.redirectUrl ?? <span className="italic text-muted-foreground">—</span>}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Device / Network */}
          <div className="rounded-xl border bg-card shadow">
            <div className="p-6">
              <h3 className="text-base font-semibold flex items-center mb-4">
                <Monitor className="h-4 w-4 mr-2 text-primary" />
                Device & Network
              </h3>
              <dl className="space-y-3 text-sm">
                <div className="flex items-start">
                  <Globe className="h-4 w-4 mr-2 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <dt className="text-xs text-muted-foreground">IP Address</dt>
                    <dd className="font-mono text-xs">{session.ipAddress ?? '—'}</dd>
                  </div>
                </div>
                <div className="flex items-start">
                  <Monitor className="h-4 w-4 mr-2 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <dt className="text-xs text-muted-foreground">User Agent</dt>
                    <dd className="font-mono text-xs break-all">{session.userAgent ?? '—'}</dd>
                  </div>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Right Sidebar – 1 col */}
        <div className="space-y-6">
          {/* Session Info */}
          <div className="rounded-xl border bg-card shadow">
            <div className="p-6">
              <h3 className="font-semibold flex items-center mb-4">
                <ShieldAlert className="h-4 w-4 mr-2" />
                Session Info
              </h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Session Token</dt>
                  <dd className="font-mono text-xs">{maskToken(session.sessionToken)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Respondent ID</dt>
                  <dd className="font-mono text-xs">{session.supplierRespondentId ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Status</dt>
                  <dd>
                    <StatusBadge status={session.status} />
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Supplier */}
          {session.supplier && (
            <div className="rounded-xl border bg-card shadow">
              <div className="p-6">
                <h3 className="font-semibold flex items-center mb-4">
                  <Users className="h-4 w-4 mr-2" />
                  Supplier
                </h3>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Name</dt>
                    <dd className="font-medium">{session.supplier.name}</dd>
                  </div>
                  {session.supplier.contactName && (
                    <div>
                      <dt className="text-xs text-muted-foreground">Contact</dt>
                      <dd>{session.supplier.contactName}</dd>
                    </div>
                  )}
                  <div className="pt-2 border-t">
                    <Link
                      href={`/suppliers/${session.supplierId}`}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      View Supplier Profile →
                    </Link>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="rounded-xl border bg-card shadow">
            <div className="p-6">
              <h3 className="font-semibold flex items-center mb-4">
                <Clock className="h-4 w-4 mr-2" />
                Timestamps
              </h3>
              <dl className="space-y-2 text-sm">
                {session.startedAt && (
                  <div>
                    <dt className="text-xs text-muted-foreground">Started</dt>
                    <dd className="text-xs">{new Date(session.startedAt).toLocaleString()}</dd>
                  </div>
                )}
                {session.redirectedAt && (
                  <div>
                    <dt className="text-xs text-muted-foreground">Redirected to Survey</dt>
                    <dd className="text-xs">{new Date(session.redirectedAt).toLocaleString()}</dd>
                  </div>
                )}
                {session.completedAt && (
                  <div>
                    <dt className="text-xs text-muted-foreground">Completed</dt>
                    <dd className="text-xs">{new Date(session.completedAt).toLocaleString()}</dd>
                  </div>
                )}
                <div className="pt-2 border-t">
                  <dt className="text-xs text-muted-foreground">Created</dt>
                  <dd className="text-xs">{new Date(session.createdAt).toLocaleString()}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
