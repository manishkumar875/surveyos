'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { respondentSessionApi } from '@/lib/respondent-session-api';
import { projectApi } from '@/lib/project-api';
import { getSelectedOrganizationId } from '@/lib/organization-storage';
import type {
  RespondentSession,
  RespondentSessionStatus,
  RespondentSessionPagination,
  Project,
} from '@/types';

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
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${cls}`}
    >
      {label}
    </span>
  );
}

function maskToken(token: string): string {
  if (token.length <= 8) return '••••••••';
  return token.slice(0, 6) + '••••••••••••' + token.slice(-4);
}

function shortUA(ua: string | null | undefined): string {
  if (!ua) return '—';
  return ua.length > 50 ? ua.slice(0, 50) + '…' : ua;
}

// ─── Page ────────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All Statuses' },
  { value: 'STARTED', label: 'Started' },
  { value: 'REDIRECTED', label: 'Redirected' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'TERMINATED', label: 'Terminated' },
  { value: 'QUOTA_FULL', label: 'Quota Full' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'ABANDONED', label: 'Abandoned' },
];

export default function ProjectSessionsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [sessions, setSessions] = useState<RespondentSession[]>([]);
  const [pagination, setPagination] = useState<RespondentSessionPagination>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState('');
  const [ridSearch, setRidSearch] = useState('');
  const [pendingRid, setPendingRid] = useState('');
  const [page, setPage] = useState(1);

  const loadData = useCallback(
    async (orgId: string, pId: string, opts: { status: string; rid: string; page: number }) => {
      try {
        setLoading(true);
        setError(null);

        const projData = await projectApi.getProject(orgId, pId);
        setProject(projData);

        const result = await respondentSessionApi.listRespondentSessions(orgId, {
          projectId: pId,
          status: opts.status ? (opts.status as RespondentSessionStatus) : undefined,
          supplierRespondentId: opts.rid || undefined,
          page: opts.page,
          limit: 25,
        });

        setSessions(result.data);
        setPagination(result.pagination);
      } catch (err) {
        console.error('Failed to load respondent sessions:', err);
        setError('Failed to load respondent sessions. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const orgId = getSelectedOrganizationId();
    if (!orgId) {
      router.replace('/organizations');
      return;
    }
    setOrganizationId(orgId);
    void loadData(orgId, projectId, { status: statusFilter, rid: ridSearch, page });
    // run once per projectId mount
  }, [projectId]);

  // re-fetch when filters / page change
  useEffect(() => {
    if (!organizationId) return;
    void loadData(organizationId, projectId, { status: statusFilter, rid: ridSearch, page });
    // re-run when filters change
  }, [statusFilter, ridSearch, page, organizationId]);

  // Debounce RID search
  useEffect(() => {
    const t = setTimeout(() => {
      setRidSearch(pendingRid);
      setPage(1);
    }, 500);
    return () => clearTimeout(t);
  }, [pendingRid]);

  if (!organizationId) return null;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Breadcrumb */}
      <div className="flex items-center mb-6 space-x-2">
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted h-9 w-9"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Link>
        <span className="text-sm text-muted-foreground">/</span>
        <Link
          href={`/projects/${projectId}`}
          className="text-sm font-medium hover:underline text-muted-foreground"
        >
          {project?.name || 'Project'}
        </Link>
        <span className="text-sm text-muted-foreground">/</span>
        <span className="text-sm font-medium">Respondent Sessions</span>
      </div>

      <PageHeader
        title="Respondent Sessions"
        description={`Live fieldwork traffic for ${project?.name || 'this project'}.`}
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mt-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search by Respondent ID..."
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 pl-9 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-64"
            value={pendingRid}
            onChange={(e) => setPendingRid(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {!loading && (
          <span className="text-sm text-muted-foreground ml-auto">
            {pagination.total.toLocaleString()} session{pagination.total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Content */}
      {loading && sessions.length === 0 ? (
        <LoadingState message="Loading respondent sessions..." />
      ) : error ? (
        <ErrorState
          message={error}
          onRetry={() =>
            void loadData(organizationId, projectId, { status: statusFilter, rid: ridSearch, page })
          }
        />
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center mt-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Activity className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="mt-6 text-xl font-semibold">No sessions found</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            {statusFilter || ridSearch
              ? 'Try adjusting your filters.'
              : 'No respondents have clicked the supplier tracking links yet. Sessions will appear here once traffic starts flowing.'}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-4 rounded-xl border bg-card shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Session Token
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Supplier
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Respondent ID
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      IP Address
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      User Agent
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                      Started
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {maskToken(s.sessionToken)}
                      </td>
                      <td className="px-4 py-3">
                        {s.supplier?.name ?? <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {s.supplierRespondentId ?? <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {s.ipAddress ?? '—'}
                      </td>
                      <td
                        className="px-4 py-3 text-xs text-muted-foreground max-w-[160px] truncate"
                        title={s.userAgent ?? ''}
                      >
                        {shortUA(s.userAgent)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {s.startedAt ? new Date(s.startedAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/projects/${projectId}/sessions/${s.id}`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Details →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium border h-8 w-8 hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium border h-8 w-8 hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
