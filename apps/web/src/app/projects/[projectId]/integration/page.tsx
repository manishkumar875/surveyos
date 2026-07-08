/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unnecessary-type-assertion */
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  Zap,
  Info,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { projectIntegrationApi } from '@/lib/project-integration-api';
import { projectApi } from '@/lib/project-api';
import { getSelectedOrganizationId } from '@/lib/organization-storage';
import { ApiError } from '@/lib/api-client';
import type { ProjectIntegration, IntegrationStatus, Project } from '@/types';

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  IntegrationStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  WAITING: {
    label: 'Waiting',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: <Clock className="h-3.5 w-3.5 mr-1" />,
  },
  TESTING: {
    label: 'Testing',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: <Activity className="h-3.5 w-3.5 mr-1" />,
  },
  LIVE: {
    label: 'Live',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <Zap className="h-3.5 w-3.5 mr-1" />,
  },
  FAILED: {
    label: 'Failed',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: <XCircle className="h-3.5 w-3.5 mr-1" />,
  },
};

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-8 w-8 hover:bg-muted shrink-0"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  );
}

// ─── Callback URL row ─────────────────────────────────────────────────────────

function CallbackUrlRow({ label, url }: { label: string; url: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={url}
          className="flex h-9 w-full rounded-md border border-input bg-muted/40 px-3 py-1 text-xs font-mono shadow-sm text-muted-foreground focus:outline-none"
        />
        <CopyButton value={url} />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProjectIntegrationPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [integration, setIntegration] = useState<ProjectIntegration | null>(null);
  const [pageState, setPageState] = useState<'loading' | 'not-initialized' | 'ready' | 'error'>(
    'loading',
  );
  const [pageError, setPageError] = useState<string | null>(null);

  // Form states
  const [surveyUrl, setSurveyUrl] = useState('');
  const [surveyUrlSaving, setSurveyUrlSaving] = useState(false);
  const [surveyUrlError, setSurveyUrlError] = useState<string | null>(null);
  const [surveyUrlSuccess, setSurveyUrlSuccess] = useState(false);

  const [paramMappingText, setParamMappingText] = useState('');
  const [paramMappingSaving, setParamMappingSaving] = useState(false);
  const [paramMappingError, setParamMappingError] = useState<string | null>(null);
  const [paramMappingSuccess, setParamMappingSuccess] = useState(false);

  const [statusValue, setStatusValue] = useState<IntegrationStatus>('WAITING');
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusSuccess, setStatusSuccess] = useState(false);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    passed: boolean;
    message: string;
    checks: Record<string, boolean>;
  } | null>(null);

  const [initializing, setInitializing] = useState(false);

  const applyIntegration = (data: ProjectIntegration) => {
    setIntegration(data);
    setSurveyUrl(data.clientSurveyUrl ?? '');
    setParamMappingText(
      data.parameterMapping ? JSON.stringify(data.parameterMapping, null, 2) : '',
    );
    setStatusValue(data.status);
    setPageState('ready');
  };

  const loadIntegration = useCallback(
    async (orgId: string) => {
      try {
        const res = await projectIntegrationApi.getProjectIntegration(orgId, projectId);
        applyIntegration(res.data);
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 404) {
          setPageState('not-initialized');
        } else {
          setPageError('Failed to load integration. Please try again.');
          setPageState('error');
        }
      }
    },
    [projectId],
  );

  useEffect(() => {
    let mounted = true;
    const orgId = getSelectedOrganizationId();
    if (!orgId) {
      router.replace('/organizations' as any);
      return;
    }
    setOrganizationId(orgId);

    async function load() {
      try {
        const [proj] = await Promise.all([projectApi.getProject(orgId!, projectId)]);
        if (mounted) {
          setProject(proj);
          await loadIntegration(orgId!);
        }
      } catch {
        if (mounted) {
          setPageError('Failed to load project. It may have been deleted.');
          setPageState('error');
        }
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [projectId, router, loadIntegration]);

  const handleInitialize = async () => {
    if (!organizationId) return;
    setInitializing(true);
    try {
      const res = await projectIntegrationApi.initProjectIntegration(organizationId, projectId);
      applyIntegration(res.data);
    } catch {
      setPageError('Failed to initialize integration. Please try again.');
    } finally {
      setInitializing(false);
    }
  };

  const handleSaveSurveyUrl = async () => {
    if (!organizationId) return;
    setSurveyUrlSaving(true);
    setSurveyUrlError(null);
    setSurveyUrlSuccess(false);
    try {
      const res = await projectIntegrationApi.updateProjectIntegration(organizationId, projectId, {
        clientSurveyUrl: surveyUrl || null,
      });
      applyIntegration(res.data);
      setSurveyUrlSuccess(true);
      setTimeout(() => setSurveyUrlSuccess(false), 3000);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setSurveyUrlError(err.message || 'Failed to save survey URL.');
      } else {
        setSurveyUrlError('Failed to save survey URL.');
      }
    } finally {
      setSurveyUrlSaving(false);
    }
  };

  const handleSaveParamMapping = async () => {
    if (!organizationId) return;
    setParamMappingError(null);
    setParamMappingSuccess(false);

    // Validate JSON
    let parsed: Record<string, string[]> | null = null;
    if (paramMappingText.trim()) {
      try {
        parsed = JSON.parse(paramMappingText) as Record<string, string[]>;
      } catch {
        setParamMappingError('Invalid JSON. Please fix the syntax before saving.');
        return;
      }
    }

    setParamMappingSaving(true);
    try {
      const res = await projectIntegrationApi.updateProjectIntegration(organizationId, projectId, {
        parameterMapping: parsed,
      });
      applyIntegration(res.data);
      setParamMappingSuccess(true);
      setTimeout(() => setParamMappingSuccess(false), 3000);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setParamMappingError(err.message || 'Failed to save parameter mapping.');
      } else {
        setParamMappingError('Failed to save parameter mapping.');
      }
    } finally {
      setParamMappingSaving(false);
    }
  };

  const handleRunTest = async () => {
    if (!organizationId) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await projectIntegrationApi.testProjectIntegration(organizationId, projectId);
      setTestResult({
        passed: res.passed,
        message: res.message,
        checks: res.checks as unknown as Record<string, boolean>,
      });
      // Refresh integration after test (status may have changed)
      await loadIntegration(organizationId);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setTestResult({ passed: false, message: err.message || 'Test failed.', checks: {} });
      } else {
        setTestResult({
          passed: false,
          message: 'Test failed due to unexpected error.',
          checks: {},
        });
      }
    } finally {
      setTesting(false);
    }
  };

  const handleSaveStatus = async () => {
    if (!organizationId) return;
    setStatusSaving(true);
    setStatusError(null);
    setStatusSuccess(false);
    try {
      const res = await projectIntegrationApi.updateIntegrationStatus(
        organizationId,
        projectId,
        statusValue,
      );
      applyIntegration(res.data);
      setStatusSuccess(true);
      setTimeout(() => setStatusSuccess(false), 3000);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setStatusError(err.message || 'Failed to update status.');
      } else {
        setStatusError('Failed to update status.');
      }
    } finally {
      setStatusSaving(false);
    }
  };

  // ── Render states ────────────────────────────────────────────────────────────

  if (!organizationId) return null;

  if (pageState === 'loading') return <LoadingState message="Loading integration..." />;

  if (pageState === 'error') {
    return (
      <div className="flex-1 p-4 md:p-8 pt-6">
        <ErrorState
          message={pageError || 'Unknown error'}
          onRetry={() => {
            window.location.reload();
          }}
        />
      </div>
    );
  }

  const statusCfg = integration ? STATUS_CONFIG[integration.status] : null;

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2">
        <Link
          href={`/projects/${projectId}` as any}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted h-9 w-9"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Link>
        <span className="text-sm text-muted-foreground">/</span>
        <Link
          href={`/projects/${projectId}` as any}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {project?.name ?? 'Project'}
        </Link>
        <span className="text-sm text-muted-foreground">/</span>
        <span className="text-sm font-medium">Integration</span>
      </div>

      <div className="flex items-start justify-between">
        <PageHeader
          title="Project Integration"
          description="Configure callback URLs and client survey integration."
        />
        {statusCfg && (
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${statusCfg.color}`}
          >
            {statusCfg.icon}
            {statusCfg.label}
          </span>
        )}
      </div>

      {/* ── Not initialized state ─────────────────────────────────────────────── */}
      {pageState === 'not-initialized' && (
        <div className="rounded-xl border bg-card text-card-foreground shadow p-8 flex flex-col items-center text-center space-y-4">
          <div className="p-4 rounded-full bg-muted">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Integration Not Initialized</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            This project does not have an integration set up yet. Initialize it to generate callback
            URLs that you can send to the client.
          </p>
          <button
            onClick={() => void handleInitialize()}
            disabled={initializing}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-6 py-2 mt-2"
          >
            {initializing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Initialize Integration
          </button>
        </div>
      )}

      {/* ── Ready state ───────────────────────────────────────────────────────── */}
      {pageState === 'ready' && integration && (
        <div className="space-y-6">
          {/* ── Info banner ── */}
          <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            <Info className="h-4 w-4 mt-0.5 shrink-0" />
            <p>
              <strong>Workflow:</strong> Copy the callback URLs below and send them to the client.
              The client configures these in their survey platform. Once done, the client sends you
              the Survey URL — paste it into the Client Survey URL field, then run Test Integration
              to verify the setup.
            </p>
          </div>

          {/* ── Section: Callback URLs ── */}
          <div className="rounded-xl border bg-card text-card-foreground shadow">
            <div className="p-6 pb-3">
              <h3 className="font-semibold text-base">Callback URLs</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Send these URLs to the client. They must configure all of them in their survey
                platform.
              </p>
            </div>
            <div className="px-6 pb-6 space-y-4">
              <CallbackUrlRow
                label="Complete Callback URL"
                url={integration.callbackUrls.completeCallbackUrl}
              />
              <CallbackUrlRow
                label="Terminate Callback URL"
                url={integration.callbackUrls.terminateCallbackUrl}
              />
              <CallbackUrlRow
                label="Quota Full Callback URL"
                url={integration.callbackUrls.quotaFullCallbackUrl}
              />
              <CallbackUrlRow
                label="Security Callback URL"
                url={integration.callbackUrls.securityCallbackUrl}
              />
              <CallbackUrlRow
                label="Test Callback URL"
                url={integration.callbackUrls.testCallbackUrl}
              />
            </div>
          </div>

          {/* ── Section: Client Survey URL ── */}
          <div className="rounded-xl border bg-card text-card-foreground shadow">
            <div className="p-6 pb-3">
              <h3 className="font-semibold text-base">Client Survey URL</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Once the client sends the programmed survey URL, paste it here. Respondents will be
                redirected to this URL.
              </p>
            </div>
            <div className="px-6 pb-6 space-y-3">
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://survey.client.com/s/abc123"
                  value={surveyUrl}
                  onChange={(e) => setSurveyUrl(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
                <button
                  onClick={() => void handleSaveSurveyUrl()}
                  disabled={surveyUrlSaving}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 shrink-0"
                >
                  {surveyUrlSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </button>
              </div>
              {surveyUrlError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> {surveyUrlError}
                </p>
              )}
              {surveyUrlSuccess && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Survey URL saved successfully.
                </p>
              )}
            </div>
          </div>

          {/* ── Section: Parameter Mapping ── */}
          <div className="rounded-xl border bg-card text-card-foreground shadow">
            <div className="p-6 pb-3">
              <h3 className="font-semibold text-base">Parameter Mapping</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Map SurveyOS fields to supplier query parameters. This ensures respondent IDs and
                session tokens are captured correctly from supplier traffic.
              </p>
            </div>
            <div className="px-6 pb-6 space-y-3">
              <textarea
                value={paramMappingText}
                onChange={(e) => setParamMappingText(e.target.value)}
                rows={8}
                placeholder={`{\n  "supplierRespondentId": ["rid", "subid", "respondentId"],\n  "sessionToken": ["sessionToken", "sid"]\n}`}
                className="flex min-h-[160px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm font-mono shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                spellCheck={false}
              />
              <p className="text-xs text-muted-foreground">
                JSON format. Keys are SurveyOS fields, values are arrays of supplier parameter names
                to check (in priority order).
              </p>
              {paramMappingError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> {paramMappingError}
                </p>
              )}
              {paramMappingSuccess && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Parameter mapping saved successfully.
                </p>
              )}
              <div className="flex justify-end">
                <button
                  onClick={() => void handleSaveParamMapping()}
                  disabled={paramMappingSaving}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4"
                >
                  {paramMappingSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Mapping
                </button>
              </div>
            </div>
          </div>

          {/* ── Section: Test Integration ── */}
          <div className="rounded-xl border bg-card text-card-foreground shadow">
            <div className="p-6 pb-3">
              <h3 className="font-semibold text-base">Test Integration</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Run a configuration check to verify all required fields are set. The integration
                status will be updated automatically.
              </p>
            </div>
            <div className="px-6 pb-6 space-y-4">
              <button
                onClick={() => void handleRunTest()}
                disabled={testing}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-6"
              >
                {testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running Test...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" /> Run Test Integration
                  </>
                )}
              </button>

              {testResult && (
                <div
                  className={`rounded-lg border p-4 space-y-3 ${testResult.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
                >
                  <div
                    className={`flex items-center gap-2 font-semibold text-sm ${testResult.passed ? 'text-green-800' : 'text-red-800'}`}
                  >
                    {testResult.passed ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    {testResult.message}
                  </div>
                  {Object.keys(testResult.checks).length > 0 && (
                    <ul className="space-y-1">
                      {Object.entries(testResult.checks).map(([key, val]) => (
                        <li key={key} className="flex items-center gap-2 text-xs">
                          {val ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-red-600" />
                          )}
                          <span className={val ? 'text-green-800' : 'text-red-800'}>
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Section: Update Status ── */}
          <div className="rounded-xl border bg-card text-card-foreground shadow">
            <div className="p-6 pb-3">
              <h3 className="font-semibold text-base">Integration Status</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Manually override the integration status. Note: Setting to <strong>Live</strong>{' '}
                requires the Client Survey URL to be saved first.
              </p>
            </div>
            <div className="px-6 pb-6 space-y-3">
              <div className="flex gap-2 items-center">
                <select
                  value={statusValue}
                  onChange={(e) => setStatusValue(e.target.value as IntegrationStatus)}
                  className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="WAITING">Waiting</option>
                  <option value="TESTING">Testing</option>
                  <option value="LIVE">Live</option>
                  <option value="FAILED">Failed</option>
                </select>
                <button
                  onClick={() => void handleSaveStatus()}
                  disabled={statusSaving}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4"
                >
                  {statusSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Status
                </button>
              </div>
              {statusError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> {statusError}
                </p>
              )}
              {statusSuccess && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Status updated successfully.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
