/**
 * End-to-end smoke test for the GitPulse API.
 *
 *   1. npm start           (terminal 1 — server must be running)
 *   2. npm run smoke       (terminal 2)
 *
 * It exercises the REAL backend against a REAL MongoDB Atlas database and
 * the REAL GitHub REST API: signup, login, JWT protection, analysis,
 * re-analysis, history, comparison, deletion, admin protection,
 * user-data isolation and error handling.
 */

import { config } from '../config/env.js';

const BASE = process.env.SMOKE_BASE_URL || `http://localhost:${config.port}/api`;
const REPO_A = process.env.SMOKE_REPO_A || 'facebook/react';
const REPO_B = process.env.SMOKE_REPO_B || 'vitejs/vite';
const BAD_REPO = 'https://github.com/opencodex/definitely-not-a-real-repo-xyz-404';

let passed = 0;
let failed = 0;
const tokens = {};

const c = { green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m', cyan: '\x1b[36m', grey: '\x1b[90m', reset: '\x1b[0m' };

function check(label, condition, extra = '') {
  if (condition) {
    passed += 1;
    console.log(`${c.green}  PASS${c.reset}  ${label}${extra ? ` ${c.grey}${extra}${c.reset}` : ''}`);
  } else {
    failed += 1;
    console.log(`${c.red}  FAIL${c.reset}  ${label}${extra ? ` ${c.grey}${extra}${c.reset}` : ''}`);
  }
}

async function api(method, path, { body, token, expect } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (expect && res.status !== expect) {
    console.log(`${c.yellow}        (expected HTTP ${expect}, got ${res.status}: ${json?.message ?? 'no body'})${c.reset}`);
  }
  return { status: res.status, body: json };
}

const stamp = Date.now();
const USER_A = { name: `Smoke Tester A ${stamp}`, email: `smoke.a.${stamp}@gitpulse.dev`, password: 'SmokeTest123!' };
const USER_B = { name: `Smoke Tester B ${stamp}`, email: `smoke.b.${stamp}@gitpulse.dev`, password: 'SmokeTest123!' };

async function run() {
  console.log(`\n${c.cyan}GitPulse API smoke test${c.reset} → ${BASE}\n`);

  /* 1. Health ------------------------------------------------------- */
  const health = await api('GET', '/health');
  check('Server is running', health.status === 200);
  check('MongoDB Atlas connection is live', health.body?.data?.database === 'connected',
    `database=${health.body?.data?.database}`);
  if (health.body?.data?.database !== 'connected') {
    console.log(`${c.red}  MongoDB is not connected — aborting.${c.reset}\n`);
    process.exit(1);
  }

  /* 2. Registration + validation ------------------------------------ */
  const badSignup = await api('POST', '/auth/register', { body: { name: 'x', email: 'nope', password: '123' } });
  check('Signup rejects invalid input (400)', badSignup.status === 400);

  const regA = await api('POST', '/auth/register', { body: USER_A });
  check('Signup creates an account (201)', regA.status === 201, `message=${regA.body?.message}`);
  tokens.A = regA.body?.data?.token;

  const regB = await api('POST', '/auth/register', { body: USER_B });
  check('Second user signup (201)', regB.status === 201);
  tokens.B = regB.body?.data?.token;

  const dupe = await api('POST', '/auth/register', { body: USER_A });
  check('Duplicate email is rejected (409)', dupe.status === 409, `message=${dupe.body?.message}`);

  check('Password is never returned', regA.body?.data?.user?.password === undefined);
  check('New user has role "user"', regA.body?.data?.user?.role === 'user');

  /* 3. Login -------------------------------------------------------- */
  const badLogin = await api('POST', '/auth/login', { body: { email: USER_A.email, password: 'wrong-password' } });
  check('Wrong password is rejected (401)', badLogin.status === 401);

  const login = await api('POST', '/auth/login', { body: { email: USER_A.email, password: USER_A.password } });
  check('Login succeeds (200)', login.status === 200);
  tokens.A = login.body?.data?.token || tokens.A;

  /* 4. JWT protection ------------------------------------------------ */
  const noToken = await api('GET', '/repositories');
  check('Protected route rejects a missing token (401)', noToken.status === 401);

  const badToken = await api('GET', '/repositories', { token: 'not.a.real.jwt' });
  check('Protected route rejects an invalid token (401)', badToken.status === 401);

  const me = await api('GET', '/auth/me', { token: tokens.A });
  check('GET /auth/me returns the current user', me.body?.data?.user?.email === USER_A.email);

  const adminBlocked = await api('GET', '/admin/statistics', { token: tokens.A });
  check('Normal user is blocked from admin APIs (403)', adminBlocked.status === 403,
    `message=${adminBlocked.body?.message}`);

  /* 5. Analysis ------------------------------------------------------ */
  const badUrl = await api('POST', '/repositories/analyze', { token: tokens.A, body: { repoUrl: 'not-a-url' } });
  check('Invalid repository URL is rejected (400)', badUrl.status === 400, `message=${badUrl.body?.message}`);

  const missingRepo = await api('POST', '/repositories/analyze', { token: tokens.A, body: { repoUrl: BAD_REPO } });
  check('Non-existent repository is handled', [404, 429].includes(missingRepo.status),
    `status=${missingRepo.status} message=${missingRepo.body?.message?.slice(0, 80)}`);

  const analyzeA = await api('POST', '/repositories/analyze', { token: tokens.A, body: { repoUrl: REPO_A } });
  check(`Analyze ${REPO_A} (201)`, analyzeA.status === 201, `message=${analyzeA.body?.message}`);
  const repoA = analyzeA.body?.data?.repository;
  check('Repository data came from GitHub', repoA?.stars > 0, `stars=${repoA?.stars} forks=${repoA?.forks}`);
  check('Languages were detected', (repoA?.chartData?.languageDistribution?.length || 0) > 0,
    `languages=${repoA?.chartData?.languageDistribution?.length}`);
  check('GitPulse pulse score was computed', typeof repoA?.activity?.pulseScore === 'number',
    `pulse=${repoA?.activity?.pulseScore} (${repoA?.activity?.pulseLabel})`);
  check('Four activity indicators present', (repoA?.activity?.indicators?.length || 0) === 4);
  check('Insights were generated', (repoA?.insights?.length || 0) >= 5, `count=${repoA?.insights?.length}`);
  check('Commit activity chart has daily points', (repoA?.chartData?.commitActivityDaily?.length || 0) === 14);
  check('Commit activity chart has weekly points', (repoA?.chartData?.commitActivityWeekly?.length || 0) === 12);

  const analyzeB = await api('POST', '/repositories/analyze', { token: tokens.A, body: { repoUrl: `https://github.com/${REPO_B}` } });
  check(`Analyze ${REPO_B} (201)`, analyzeB.status === 201);
  const repoB = analyzeB.body?.data?.repository;

  /* 6. Listing + isolation ------------------------------------------ */
  const listA = await api('GET', '/repositories', { token: tokens.A });
  check('Repository list returns both repos', listA.body?.data?.total === 2, `total=${listA.body?.data?.total}`);

  const listB = await api('GET', '/repositories', { token: tokens.B });
  check('User B starts with an empty library', listB.body?.data?.total === 0, `total=${listB.body?.data?.total}`);

  const crossRead = await api('GET', `/repositories/${repoA._id}`, { token: tokens.B });
  check("User B cannot read User A's repository (404)", crossRead.status === 404);

  const crossDelete = await api('DELETE', `/repositories/${repoA._id}`, { token: tokens.B });
  check("User B cannot delete User A's repository (404)", crossDelete.status === 404);

  const search = await api('GET', '/repositories?search=react', { token: tokens.A });
  check('Search filter works', search.body?.data?.total >= 1, `total=${search.body?.data?.total}`);

  const sorted = await api('GET', '/repositories?sort=stars', { token: tokens.A });
  const sortedStars = sorted.body?.data?.repositories?.map((r) => r.stars) || [];
  check('Sorting by stars works', sortedStars.length < 2 || sortedStars[0] >= sortedStars[1]);

  /* 7. Analytics + history ------------------------------------------ */
  const analytics = await api('GET', `/analytics/repositories/${repoA._id}/analytics`, { token: tokens.A });
  check('Analytics endpoint responds (200)', analytics.status === 200);
  check('Analytics contains chart series', Boolean(analytics.body?.data?.charts?.commitActivityDaily));
  check('Analytics exposes indicator definitions', Boolean(analytics.body?.data?.activity?.definitions));

  const history1 = await api('GET', `/repositories/${repoA._id}/history`, { token: tokens.A });
  check('History has 1 snapshot after first analysis', history1.body?.data?.history?.length === 1,
    `snapshots=${history1.body?.data?.history?.length}`);

  /* 8. Re-analyze ---------------------------------------------------- */
  const re = await api('POST', `/repositories/${repoA._id}/reanalyze`, { token: tokens.A });
  check('Re-analyze succeeds (200)', re.status === 200, `message=${re.body?.message}`);
  const reRepo = re.body?.data?.repository;
  check('Re-analyze updated the timestamp', new Date(reRepo?.lastAnalyzedAt) >= new Date(repoA?.lastAnalyzedAt));
  check('Re-analyze incremented the counter', reRepo?.analysisCount === 2, `analysisCount=${reRepo?.analysisCount}`);
  check('Re-analyze returns deltas', re.body?.data?.deltas !== undefined);

  const history2 = await api('GET', `/repositories/${repoA._id}/history`, { token: tokens.A });
  check('History now has 2 snapshots', history2.body?.data?.history?.length === 2,
    `snapshots=${history2.body?.data?.history?.length}`);
  check('History trend contains stars for the chart', typeof history2.body?.data?.trend?.[0]?.stars === 'number');

  const reBad = await api('POST', '/repositories/not-a-real-id/reanalyze', { token: tokens.A });
  check('Re-analyze with a bad id returns 400', reBad.status === 400);

  /* 9. Comparison ---------------------------------------------------- */
  const compare = await api('GET', `/repositories/compare?a=${repoA._id}&b=${repoB._id}`, { token: tokens.A });
  check('Comparison returns both repositories (200)', compare.status === 200);
  check('Comparison includes factual metric rows', (compare.body?.data?.comparison?.length || 0) >= 7);

  const compareMissing = await api('GET', '/repositories/compare?a=abc&b=def', { token: tokens.A });
  check('Comparison without ids is rejected (400)', compareMissing.status === 400);

  /* 10. Delete ------------------------------------------------------- */
  const del = await api('DELETE', `/repositories/${repoB._id}`, { token: tokens.A });
  check('Delete succeeds (200)', del.status === 200, `message=${del.body?.message}`);

  const afterDelete = await api('GET', `/repositories/${repoB._id}`, { token: tokens.A });
  check('Deleted repository returns 404', afterDelete.status === 404);

  const listAfter = await api('GET', '/repositories', { token: tokens.A });
  check('Library now contains 1 repository', listAfter.body?.data?.total === 1);

  /* 11. Logout ------------------------------------------------------- */
  const logout = await api('POST', '/auth/logout', { token: tokens.A });
  check('Logout succeeds (200)', logout.status === 200);

  /* 12. Unknown route ------------------------------------------------ */
  const missing = await api('GET', '/does-not-exist');
  check('Unknown API route returns 404', missing.status === 404);

  /* 13. Cleanup ------------------------------------------------------ */
  await api('DELETE', `/repositories/${repoA._id}`, { token: tokens.A });
  console.log(`${c.grey}        (test repositories removed from the database)${c.reset}`);

  console.log(`\n${c.cyan}─────────────────────────────${c.reset}`);
  console.log(`  ${c.green}passed: ${passed}${c.reset}   ${failed ? c.red : c.grey}failed: ${failed}${c.reset}`);
  console.log(`${c.cyan}─────────────────────────────${c.reset}\n`);

  process.exit(failed === 0 ? 0 : 1);
}

run().catch((error) => {
  console.error(`\n${c.red}Smoke test crashed:${c.reset}`, error.message);
  console.error(`${c.grey}Is the backend running on port ${config.port}?${c.reset}\n`);
  process.exit(1);
});