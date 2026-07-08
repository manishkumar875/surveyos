import { randomUUID } from 'crypto';

// Configuration
const HOST = process.env.API_HOST || 'http://localhost:4000';
const API_BASE = `${HOST}/api/v1`;

let accessToken = '';
let organizationId = '';
let projectId = '';
let supplierId = '';
let projectSupplierId = '';
let trackingUrl = '';
let sessionToken = '';
let quotaId = '';
let callbackEventId = '';
let completeCallbackUrl = '';

// Helper to print pass/fail
function pass(msg) {
  console.log(`[PASS] ${msg}`);
}

function fail(msg) {
  console.error(`[FAIL] ${msg}`);
  process.exit(1);
}

function info(msg) {
  console.log(`[INFO] ${msg}`);
}

async function apiFetch(endpoint, options = {}, expectRedirect = false) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...options.headers,
  };

  const fetchOptions = {
    ...options,
    headers,
    redirect: expectRedirect ? 'manual' : 'follow',
  };

  try {
    const res = await fetch(url, fetchOptions);

    if (expectRedirect) {
      if (res.status >= 300 && res.status < 400) {
        return { status: res.status, location: res.headers.get('location') };
      }
      return { status: res.status, error: `Expected redirect but got ${res.status}` };
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      return { status: res.status, data };
    } else if (contentType.includes('text/csv')) {
      const text = await res.text();
      return { status: res.status, data: text, isCsv: true };
    } else {
      const text = await res.text();
      return { status: res.status, data: text };
    }
  } catch (error) {
    return { status: 500, error: error.message };
  }
}

async function runSmokeTest() {
  info('Starting SurveyOS MVP Smoke Test...');

  // A) Health Check
  info('Step A: Health/API availability');
  const healthRes = await apiFetch('/health');
  if (healthRes.status === 200 && healthRes.data?.data?.status === 'ok') {
    pass('Health endpoint reachable');
  } else {
    fail(`Health endpoint failed. Status: ${healthRes.status}. Is the API server running?`);
  }

  // B) Auth Flow
  info('Step B: Auth flow');
  const testEmail = `smoke-test-${Date.now()}@surveyos.local`;
  const testPassword = 'Password123!';

  const signupRes = await apiFetch('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email: testEmail, password: testPassword, name: 'Smoke Tester' }),
  });
  if (signupRes.status === 201) {
    pass('User signed up successfully');
  } else {
    fail(`Signup failed: ${JSON.stringify(signupRes.data)}`);
  }

  const signinRes = await apiFetch('/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ email: testEmail, password: testPassword }),
  });
  if (signinRes.status === 200 && signinRes.data?.accessToken) {
    accessToken = signinRes.data.accessToken;
    pass('User signed in successfully (Token masked)');
  } else {
    fail(`Signin failed: ${JSON.stringify(signinRes.data)}`);
  }

  // C) Organization Flow
  info('Step C: Organization flow');
  const orgName = `Org-${Date.now()}`;
  const createOrgRes = await apiFetch('/organizations', {
    method: 'POST',
    body: JSON.stringify({ name: orgName }),
  });
  if (createOrgRes.status === 201) {
    organizationId = createOrgRes.data.data.organization.id;
    pass(`Organization created: ${organizationId}`);
  } else {
    fail(`Organization creation failed: ${JSON.stringify(createOrgRes.data)}`);
  }

  const listOrgRes = await apiFetch('/organizations');
  if (listOrgRes.status === 200 && listOrgRes.data?.data?.length > 0) {
    pass('Organizations listed successfully');
  } else {
    fail(`Organization list failed: ${JSON.stringify(listOrgRes.data)}`);
  }

  const getOrgRes = await apiFetch(`/organizations/${organizationId}`);
  if (getOrgRes.status === 200) {
    pass('Organization details retrieved successfully');
  } else {
    fail(`Organization get details failed: ${JSON.stringify(getOrgRes.data)}`);
  }

  // D) Project Flow
  info('Step D: Project flow');
  const createProjectRes = await apiFetch(`/organizations/${organizationId}/projects`, {
    method: 'POST',
    body: JSON.stringify({ name: 'Smoke Test Project', clientName: 'Smoke Client' }),
  });
  if (createProjectRes.status === 201) {
    projectId = createProjectRes.data.data.id;
    pass(`Project created: ${projectId}`);
  } else {
    fail(`Project creation failed: ${JSON.stringify(createProjectRes.data)}`);
  }

  const listProjRes = await apiFetch(`/organizations/${organizationId}/projects`);
  if (listProjRes.status === 200) {
    pass('Projects listed successfully');
  } else {
    fail('Project list failed');
  }

  // E) Project Integration Flow
  info('Step E: Project Integration flow');
  const initIntRes = await apiFetch(
    `/organizations/${organizationId}/projects/${projectId}/integration`,
    {
      method: 'POST',
    },
  );
  if (initIntRes.status === 201 || initIntRes.status === 200) {
    completeCallbackUrl = initIntRes.data.data.callbackUrls.completeCallbackUrl;
    pass('Integration initialized');
  } else if (initIntRes.status === 409) {
    pass('Integration already exists');
  } else {
    fail(`Integration init failed: ${JSON.stringify(initIntRes.data)}`);
  }

  const updateIntRes = await apiFetch(
    `/organizations/${organizationId}/projects/${projectId}/integration`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        clientSurveyUrl: 'https://example.com/survey?session={sessionToken}',
      }),
    },
  );
  if (updateIntRes.status === 200) {
    pass('Integration updated with safe clientSurveyUrl');
  } else {
    fail(`Integration update failed: ${JSON.stringify(updateIntRes.data)}`);
  }

  const updateStatusRes = await apiFetch(
    `/organizations/${organizationId}/projects/${projectId}/integration/status`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status: 'LIVE' }),
    },
  );
  if (updateStatusRes.status === 200) {
    pass('Integration updated to LIVE');
  } else {
    fail(`Integration status update failed: ${JSON.stringify(updateStatusRes.data)}`);
  }

  // F) Supplier Flow
  info('Step F: Supplier flow');
  const createSuppRes = await apiFetch(`/organizations/${organizationId}/suppliers`, {
    method: 'POST',
    body: JSON.stringify({ name: 'Smoke Supplier' }),
  });
  if (createSuppRes.status === 201) {
    supplierId = createSuppRes.data.data.id;
    pass(`Supplier created: ${supplierId}`);
  } else {
    fail(`Supplier creation failed: ${JSON.stringify(createSuppRes.data)}`);
  }

  const listSuppRes = await apiFetch(`/organizations/${organizationId}/suppliers`);
  if (listSuppRes.status === 200) {
    pass('Suppliers listed successfully');
  } else {
    fail('Supplier list failed');
  }

  // G) Project Supplier Assignment flow
  info('Step G: Project Supplier Assignment flow');
  const assignSuppRes = await apiFetch(
    `/organizations/${organizationId}/projects/${projectId}/suppliers`,
    {
      method: 'POST',
      body: JSON.stringify({ supplierId }),
    },
  );
  if (assignSuppRes.status === 201) {
    projectSupplierId = assignSuppRes.data.data.id;
    trackingUrl = assignSuppRes.data.data.trackingUrl;
    pass(`Supplier assigned to project. Tracking URL generated (masked).`);
  } else {
    fail(`Supplier assignment failed: ${JSON.stringify(assignSuppRes.data)}`);
  }

  // H) Quota flow
  info('Step H: Quota flow');
  const createQuotaRes = await apiFetch(
    `/organizations/${organizationId}/projects/${projectId}/quotas`,
    {
      method: 'POST',
      body: JSON.stringify({ name: 'Completes', targetCompletes: 1 }),
    },
  );
  if (createQuotaRes.status === 201) {
    quotaId = createQuotaRes.data.data.id;
    pass(`Quota created: ${quotaId}`);
  } else {
    fail(`Quota creation failed: ${JSON.stringify(createQuotaRes.data)}`);
  }

  const listQuotaRes = await apiFetch(
    `/organizations/${organizationId}/projects/${projectId}/quotas`,
  );
  if (listQuotaRes.status === 200) {
    pass('Quotas listed successfully');
  } else {
    fail('Quota list failed');
  }

  // I) Public Tracking flow
  info('Step I: Public Tracking flow');
  const trackTarget = `${trackingUrl}?rid=smoke-resp-1`;
  const trackRes = await apiFetch(trackTarget, {}, true); // expectRedirect = true
  if (trackRes.status === 302 && trackRes.location) {
    pass('Tracking link resolved and returned 302 redirect');

    const locUrl = new URL(trackRes.location);
    sessionToken = locUrl.searchParams.get('sessionToken');
    if (sessionToken) {
      pass(`Redirect contained sessionToken (masked)`);
    } else {
      fail(`Redirect URL missing sessionToken: ${trackRes.location}`);
    }
  } else {
    fail(
      `Tracking link failed or did not redirect. Status: ${trackRes.status}, Error: ${trackRes.error}`,
    );
  }

  // J) Callback flow
  info('Step J: Callback flow');
  const callbackRes = await apiFetch(`${completeCallbackUrl}?sessionToken=${sessionToken}`);
  if (callbackRes.status === 200 && callbackRes.data?.success) {
    callbackEventId = callbackRes.data.callbackEventId;
    pass('Complete callback processed successfully');
    if (callbackRes.data?.quotaUpdates?.quotasUpdated > 0) {
      pass(`Quota update summary recorded: ${callbackRes.data.quotaUpdates.quotasUpdated} updated`);
    } else {
      info('Quota updates processed, but count was 0 (expected if criteria did not match)');
    }
  } else {
    fail(`Complete callback failed: ${JSON.stringify(callbackRes.data)}`);
  }

  // K) Respondent Session API
  info('Step K: Respondent Session API');
  const sessionListRes = await apiFetch(`/organizations/${organizationId}/respondent-sessions`);
  if (sessionListRes.status === 200) {
    const sessions = sessionListRes.data.data;
    if (sessions.length > 0) {
      const sess = sessions[0];
      if (sess.status === 'COMPLETED') {
        pass(`Respondent session status is COMPLETED`);
      } else {
        fail(`Respondent session status is ${sess.status}, expected COMPLETED`);
      }
    } else {
      fail('No respondent sessions found');
    }
  } else {
    fail(`Failed to list respondent sessions: ${JSON.stringify(sessionListRes.data)}`);
  }

  // L) Dashboard API
  info('Step L: Dashboard API');
  const dashSumRes = await apiFetch(`/organizations/${organizationId}/dashboard/summary`);
  if (dashSumRes.status === 200) {
    pass('Organization dashboard summary retrieved');
  } else {
    fail(`Dashboard summary failed: ${JSON.stringify(dashSumRes.data)}`);
  }

  const projectPerfRes = await apiFetch(
    `/organizations/${organizationId}/dashboard/projects/${projectId}/performance`,
  );
  if (projectPerfRes.status === 200) {
    pass('Project performance dashboard retrieved');
  } else {
    fail(`Project performance failed: ${JSON.stringify(projectPerfRes.data)}`);
  }

  // M) Report Export API
  info('Step M: Report Export API');
  const exportJsonRes = await apiFetch(
    `/organizations/${organizationId}/reports/export?reportType=respondentSessions&format=json`,
  );
  if (exportJsonRes.status === 200 && exportJsonRes.data?.data) {
    pass('Report export JSON retrieved successfully');
  } else {
    fail(`Report export JSON failed: ${JSON.stringify(exportJsonRes.data)}`);
  }

  const exportCsvRes = await apiFetch(
    `/organizations/${organizationId}/reports/export?reportType=quotas&format=csv`,
  );
  if (exportCsvRes.status === 200 && exportCsvRes.isCsv) {
    pass('Report export CSV retrieved successfully');
  } else {
    fail(`Report export CSV failed: status ${exportCsvRes.status}`);
  }

  // N) Fraud Signal API
  info('Step N: Fraud Signal API');
  const listFraudRes = await apiFetch(`/organizations/${organizationId}/fraud-signals`);
  if (listFraudRes.status === 200) {
    pass(`Fraud signals listed successfully (Count: ${listFraudRes.data.data.length})`);
  } else {
    fail(`Fraud signals list failed: ${JSON.stringify(listFraudRes.data)}`);
  }

  info('===============================================');
  pass('SMOKE TEST SUITE COMPLETED SUCCESSFULLY');
  process.exit(0);
}

runSmokeTest().catch((e) => {
  fail(`Unhandled error in smoke test: ${e.message}`);
});
