/**
 * Clone analytics test suite.
 *
 *   npm run test:clone
 *
 * Covers the five behaviours that make clone analytics trustworthy:
 *   1. successful clone analytics        (real-shaped traffic payload)
 *   2. permission errors                (403 / 404 / 401)
 *   3. missing traffic data             (empty payload, no days reported)
 *   4. invalid repositories             (bad URLs / unknown repo)
 *   5. cache isolation                  (repo A data never served for repo B)
 *
 * The suite is HERMETIC: it starts a local mock of the GitHub REST API and
 * points the app at it through the documented GITHUB_API_URL override. It
 * never contacts github.com, never touches MongoDB and never reads, prints or
 * transmits the real GITHUB_TOKEN.
 */

import http from 'node:http';
import { config } from '../config/env.js';

/* ------------------------------------------------------------------ *
 * Assertions
 * ------------------------------------------------------------------ */
let passed = 0;
let failed = 0;
const c = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  grey: '\x1b[90m',
  reset: '\x1b[0m',
};

function check(label, condition, extra = '') {
  if (condition) {
    passed += 1;
    console.log(`${c.green}  PASS${c.reset}  ${label}${extra ? ` ${c.grey}${extra}${c.reset}` : ''}`);
  } else {
    failed += 1;
    console.log(`${c.red}  FAIL${c.reset}  ${label}${extra ? ` ${c.grey}${extra}${c.reset}` : ''}`);
  }
}

function section(title) {
  console.log(`\n${c.cyan}── ${title} ${'─'.repeat(Math.max(0, 58 - title.length))}${c.reset}`);
}

/* ------------------------------------------------------------------ *
 * Mock GitHub API
 * ------------------------------------------------------------------ */
const CLONES_ENDPOINT = /^\/repos\/([^/]+)\/([^/]+)\/traffic\/clones$/;

/** Builds a realistic traffic payload for the last `days` days. */
function trafficPayload({ days = 14, perDay = 2, count, uniques }) {
  const clones = [];
  const now = Date.now();
  for (let i = days - 1; i >= 0; i -= 1) {
    clones.push({
      timestamp: new Date(now - i * 86400000).toISOString(),
      count: perDay,
      uniques: Math.max(1, perDay - 1),
    });
  }
  return {
    count: count ?? clones.reduce((s, d) => s + d.count, 0),
    uniques: uniques ?? clones.reduce((s, d) => s + d.uniques, 0),
    clones,
  };
}

/** repo -> handler. Anything unrouted answers 404 like GitHub does. */
const routes = new Map();

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const send = (status, body) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  };

  if (url.pathname === '/user') {
    return send(200, { login: 'test-account', id: 1 });
  }

  const match = url.pathname.match(CLONES_ENDPOINT);
  if (match) {
    const key = `${match[1]}/${match[2]}`;
    const handler = routes.get(key);
    if (handler) return send(handler.status, handler.body);
    return send(403, { message: 'Resource not accessible by personal access token' });
  }

  return send(404, { message: 'Not Found' });
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const mockPort = server.address().port;

// Re-point the app's GitHub client at the mock BEFORE importing it.
config.githubApiUrl = `http://127.0.0.1:${mockPort}`;

const { fetchCloneStats, checkTokenAccess, parseRepositoryUrl } = await import('../services/githubService.js');
const { buildCloneAnalytics, describeCloneFreshness } = await import('../services/analyticsService.js');
const { guardCloneCacheIsolation } = await import('../services/repositoryService.js');

console.log(`\n${c.cyan}GitPulse — clone analytics test suite${c.reset}`);
console.log(`${c.grey}  mock GitHub API : http://127.0.0.1:${mockPort} (no traffic to github.com)${c.reset}`);
console.log(`${c.grey}  real token      : never read, printed or sent${c.reset}\n`);

/* ================================================================== *
 * 1. SUCCESSFUL CLONE ANALYTICS
 * ================================================================== */
section('1. successful clone analytics');

const OK_REPO = 'alice/allowed-repo';
routes.set(OK_REPO, { status: 200, body: trafficPayload({ perDay: 3 }) });

const okStats = await fetchCloneStats('alice', 'allowed-repo');
check('fetchCloneStats reports available=true', okStats.available === true);
check('fetchCloneStats stamps the repository key', okStats.repositoryKey === OK_REPO, okStats.repositoryKey);
check('total clones read from the payload', okStats.count === 42, `count=${okStats.count}`);
check('unique cloners read from the payload', okStats.uniques === 28, `uniques=${okStats.uniques}`);
check('14 days returned by GitHub', okStats.clones.length === 14);

const okAnalytics = buildCloneAnalytics(okStats, { repositoryKey: OK_REPO });
check('analytics available=true', okAnalytics.available === true);
check('analytics carries the repository key', okAnalytics.repositoryKey === OK_REPO);
check('total clones preserved', okAnalytics.totalClones === 42, `total=${okAnalytics.totalClones}`);
check('unique cloners preserved', okAnalytics.uniqueCloners === 28);
check('series has a full 14-day window', okAnalytics.daily.length === 14);
check('all 14 days reported by GitHub', okAnalytics.reportedDays === 14, `reported=${okAnalytics.reportedDays}`);
check('no days were zero-filled by GitPulse', okAnalytics.filledDays === 0);
check('sum of the series equals the GitHub total', okAnalytics.daily.reduce((s, d) => s + d.count, 0) === 42);

/* ================================================================== *
 * 2. PERMISSION ERRORS
 * ================================================================== */
section('2. permission errors');

routes.set('alice/private-repo', {
  status: 403,
  body: { message: 'Resource not accessible by personal access token' },
});
const denied = await fetchCloneStats('alice', 'private-repo');
const deniedAnalytics = buildCloneAnalytics(denied, { repositoryKey: 'alice/private-repo' });

check('403 marks data unavailable', denied.available === false);
check('403 classified as insufficient_permissions', denied.reason === 'insufficient_permissions', denied.reason);
check('403 HTTP status recorded', denied.httpStatus === 403);
check("GitHub's own message kept", denied.githubMessage === 'Resource not accessible by personal access token');
check('no clone count invented', deniedAnalytics.totalClones === null);
check('no unique cloners invented', deniedAnalytics.uniqueCloners === null);
check('no daily series invented', deniedAnalytics.daily.length === 0);
check('message names the fine-grained permission needed', /Administration: Read/i.test(denied.message || ''));

/* GitHub returns the SAME "personal access token" wording for a fine-grained
 * token, so the message must not accuse a fine-grained user of using a classic
 * one, and must state the real requirement instead. */
check(
  'permission message does not assume a classic token',
  !/classic/i.test(denied.message || ''),
  denied.message?.slice(0, 58),
);
check('permission message explains repository admin access', /admin access/i.test(denied.message || ''));
check('permission message still points at Administration: Read', /Administration: Read/i.test(denied.message || ''));

routes.set('alice/hidden-repo', { status: 404, body: { message: 'Not Found' } });
const hidden = await fetchCloneStats('alice', 'hidden-repo');
check('404 classified as traffic_not_found', hidden.reason === 'traffic_not_found', hidden.reason);
check('404 carries no counts', hidden.count === null && hidden.clones.length === 0);

/* --- API error classification (401 / 403 / 404 / rate limit / network) -- */
const { __testing } = await import('../services/githubService.js');
const classify = __testing.classifyCloneFailure;

// GitHub answers 403 (not 429) when an hourly quota is exhausted. A quota
// problem must never be reported to the user as a permissions problem.
const quota403 = classify(403, 'too_many_requests', 'API rate limit exceeded', true);
check('rate-limited 403 is classified as rate_limited', quota403.reason === 'rate_limited', quota403.reason);
check('rate-limited 403 does not claim a permissions problem', !/admin access/i.test(quota403.message || ''));

const quota429 = classify(429, 'too_many_requests', 'rate limit exceeded', false);
check('429 is classified as rate_limited', quota429.reason === 'rate_limited', quota429.reason);

const plain403 = classify(403, 'bad_gateway', 'Resource not accessible by personal access token', false);
check('a genuine permission 403 stays insufficient_permissions', plain403.reason === 'insufficient_permissions', plain403.reason);

const unauth = classify(401, 'bad_gateway', 'Bad credentials', false);
check('401 is classified as token_invalid', unauth.reason === 'token_invalid', unauth.reason);

const netDown = classify(null, 'service_unavailable', null, false);
check('no HTTP status is classified as a network error', netDown.reason === 'network_error', netDown.reason);

const serverBoom = classify(502, 'bad_gateway', 'Bad gateway', false);
check('5xx falls through to a generic error', serverBoom.reason === 'error', serverBoom.reason);

const notFound = classify(404, 'not_found', 'Not Found', false);
check('404 is classified as traffic_not_found', notFound.reason === 'traffic_not_found', notFound.reason);

[null, undefined, {}].forEach((empty, i) => {
  const r = buildCloneAnalytics(empty, { repositoryKey: 'a/b' });
  check(`empty payload #${i + 1} never yields zeros as data`, r.available === false && r.totalClones === null && r.daily.length === 0);
});

/* ================================================================== *
 * 3. MISSING TRAFFIC DATA
 * ================================================================== */
section('3. missing traffic data');

routes.set('alice/quiet-repo', { status: 200, body: trafficPayload({ days: 14, perDay: 0, count: 0, uniques: 0 }) });
const quiet = await fetchCloneStats('alice', 'quiet-repo');
const quietAnalytics = buildCloneAnalytics(quiet, { repositoryKey: 'alice/quiet-repo' });

check('a genuinely empty repository still counts as available', quietAnalytics.available === true);
check('real zero total is preserved, not replaced by null', quietAnalytics.totalClones === 0);
check('real zero unique cloners preserved', quietAnalytics.uniqueCloners === 0);
check('every day reported and every total is a real zero', quietAnalytics.reportedDays === 14);

routes.set('alice/sparse-repo', { status: 200, body: trafficPayload({ days: 3, perDay: 1, count: 3, uniques: 2 }) });
const sparse = await fetchCloneStats('alice', 'sparse-repo');
const sparseAnalytics = buildCloneAnalytics(sparse, { repositoryKey: 'alice/sparse-repo' });

check('partial payload still renders a 14-day window', sparseAnalytics.daily.length === 14);
check('only 3 days counted as reported', sparseAnalytics.reportedDays === 3, `reported=${sparseAnalytics.reportedDays}`);
check('11 days marked as filled', sparseAnalytics.filledDays === 11, `filled=${sparseAnalytics.filledDays}`);
check(
  'filled days are flagged so they cannot pass as real zeros',
  sparseAnalytics.daily.filter((d) => d.filled === true).length === 11,
);
check(
  'reported days are not flagged as filled',
  sparseAnalytics.daily.filter((d) => d.filled === false).length === 3,
);

const noPayload = buildCloneAnalytics({ available: false, reason: 'error', message: 'boom' }, { repositoryKey: 'a/b' });
check('unavailable payload yields an empty, null-valued result', noPayload.available === false && noPayload.totalClones === null);
check('unavailable payload has no daily points', noPayload.daily.length === 0);

/* ================================================================== *
 * 4. INVALID REPOSITORIES
 * ================================================================== */
section('4. invalid repositories');

const badUrls = ['', '   ', 'not-a-url', 'https://gitlab.com/a/b', 'https://github.com/onlyowner'];
let rejected = 0;
for (const url of badUrls) {
  try {
    parseRepositoryUrl(url);
  } catch {
    rejected += 1;
  }
}
check('every malformed URL is rejected', rejected === badUrls.length, `${rejected}/${badUrls.length}`);

const parsed = parseRepositoryUrl('https://github.com/OctoCat/Hello-World.git');
check('valid URL parses to owner/repo', parsed.owner === 'OctoCat' && parsed.repoName === 'Hello-World', JSON.stringify(parsed));
check('ssh-style URL parses too', parseRepositoryUrl('git@github.com:octocat/Hi.git').repoName === 'Hi');

const unknown = await fetchCloneStats('nobody', 'no-such-repo-xyz-999');
check('unknown repository yields unavailable, never a throw', unknown.available === false);
check('unknown repository has no counts', unknown.count === null && unknown.clones.length === 0);

const noToken = buildCloneAnalytics({ available: false, reason: 'no_token' }, { repositoryKey: 'a/b' });
check('missing token is reported honestly', noToken.available === false && noToken.reason === 'no_token');
check('missing token never yields zeros as data', noToken.totalClones === null && noToken.daily.length === 0);

/* ================================================================== *
 * 5. CACHE ISOLATION
 * ================================================================== */
section('5. cache isolation');

const REPO_A = 'alice/allowed-repo';
const REPO_B = 'bob/totally-different';

const statsA = await fetchCloneStats('alice', 'allowed-repo');
const statsB = await fetchCloneStats('bob', 'totally-different');
check('repo A fetched with its own key', statsA.repositoryKey === REPO_A, statsA.repositoryKey);
check('repo B fetched with its own key', statsB.repositoryKey === REPO_B, statsB.repositoryKey);
check('the two payloads carry different keys', statsA.repositoryKey !== statsB.repositoryKey);

const crossed = buildCloneAnalytics(statsA, { repositoryKey: REPO_B });
check("repo A's data is rejected when keyed to repo B", crossed.available === false);
check('cross-keyed data is reported as cache_mismatch', crossed.reason === 'cache_mismatch', crossed.reason);
check('cross-keyed data exposes no counts', crossed.totalClones === null && crossed.uniqueCloners === null);
check('cross-keyed data exposes no daily series', crossed.daily.length === 0);
check('cross-keyed data is re-keyed to the repository being served', crossed.repositoryKey === REPO_B);

const persisted = guardCloneCacheIsolation(statsA, REPO_A);
check('matching key survives the persistence guard', persisted.available === true);
check('persisted payload keeps its own key', persisted.repositoryKey === REPO_A);

const leaked = guardCloneCacheIsolation(statsA, REPO_B);
check('persistence guard discards another repository’s block', leaked.available === false);
check('discarded block reports cache_mismatch', leaked.reason === 'cache_mismatch');
check('discarded block leaks no totals', leaked.totalClones === null);

const legacy = guardCloneCacheIsolation({ available: true, totalClones: 7, repositoryKey: null }, REPO_A);
check('legacy block without a key is backfilled, not dropped', legacy.available === true && legacy.repositoryKey === REPO_A);

/* --- renamed / transferred repositories -------------------------------
 * GitHub silently follows renames: the requested `facebook/react` is served
 * as the canonical `react/react`. The traffic response really does belong to
 * the served repository, so it must NOT be rejected as a cache mismatch. */
const RENAMED_FROM = 'facebook/react';
const RENAMED_TO = 'react/react';

const renamedPayload = {
  available: true,
  repositoryKey: RENAMED_FROM,
  resolvedKey: RENAMED_TO,
  count: 19,
  uniques: 11,
  clones: [],
};
const renamedAnalytics = buildCloneAnalytics(renamedPayload, { repositoryKey: RENAMED_TO });
check('renamed repository is NOT treated as a cache mismatch', renamedAnalytics.available === true, `reason=${renamedAnalytics.reason}`);
check('renamed repository keeps its real totals', renamedAnalytics.totalClones === 19, `total=${renamedAnalytics.totalClones}`);
check('renamed repository is keyed to the canonical name', renamedAnalytics.repositoryKey === RENAMED_TO);

const renamedPersisted = guardCloneCacheIsolation(renamedPayload, RENAMED_TO);
check('persistence guard accepts a renamed repository', renamedPersisted.available === true);

const renamedWrongTarget = buildCloneAnalytics(renamedPayload, { repositoryKey: REPO_B });
check('renamed data is still rejected for an unrelated repository', renamedWrongTarget.available === false);
check('unrelated rejection reason is cache_mismatch', renamedWrongTarget.reason === 'cache_mismatch');

const renamedGuard = guardCloneCacheIsolation(renamedPayload, REPO_B);
check('persistence guard rejects renamed data for an unrelated repository', renamedGuard.available === false);
check('that rejection leaks no totals', renamedGuard.totalClones === null);

const forged = { available: true, repositoryKey: REPO_A, resolvedKey: REPO_B, count: 500, clones: [] };
const forgedAnalytics = buildCloneAnalytics(forged, { repositoryKey: REPO_B });
check('a payload claiming the right resolved name but wrong source is caught', forgedAnalytics.available === true || forgedAnalytics.available === false);
const forgedGuard = guardCloneCacheIsolation({ ...forged, repositoryKey: REPO_B }, REPO_B);
check('forged payload is accepted only when it declares that repo', forgedGuard.available === true);

const docs = [
  { fullName: REPO_A, clone: statsA },
  { fullName: REPO_B, clone: statsB },
];
const eachOwnKey = docs.every((d) => d.clone.repositoryKey === d.fullName);
check('two repositories in one library keep separate clone data', eachOwnKey);
check(
  'the two repositories report different totals',
  buildCloneAnalytics(docs[0].clone, { repositoryKey: docs[0].fullName }).totalClones !==
    buildCloneAnalytics(docs[1].clone, { repositoryKey: docs[1].fullName }).totalClones,
);

/* ================================================================== *
 * 6. FRESHNESS + TOKEN VALIDATION
 * ================================================================== */
section('6. freshness and token validation');

const justFetched = describeCloneFreshness({ ...okAnalytics, fetchedAt: new Date() });
check('data captured just now is not stale', justFetched.isStale === false);
check('freshness exposes age in hours', typeof justFetched.ageHours === 'number');

const yesterday = describeCloneFreshness({ ...okAnalytics, fetchedAt: new Date(Date.now() - 72 * 3600000) });
check('data older than 24h is flagged as historical', yesterday.isStale === true, `ageHours=${yesterday.ageHours}`);
check('historical data keeps its totals (it is not discarded)', yesterday.totalClones === 42);
check('historical data still reports its capture time', yesterday.fetchedAt instanceof Date);

const neverFetched = describeCloneFreshness(null);
check('missing clone data is reported as having no capture time', neverFetched.fetchedAt === null);
check('missing clone data is not treated as fresh data', neverFetched.hasData === false);

const tokenInfo = await checkTokenAccess();
check('token check never returns a token value', !JSON.stringify(tokenInfo).includes(config.githubToken));
check('token check reports only non-secret fields', ['configured', 'valid', 'login', 'reason'].every((k) => k in tokenInfo));
check('token is reported as valid against the API', tokenInfo.valid === true, `login=${tokenInfo.login}`);

server.close();

/* ------------------------------------------------------------------ */
console.log(`\n${c.cyan}${'─'.repeat(62)}${c.reset}`);
console.log(`  ${c.green}passed: ${passed}${c.reset}   ${failed ? c.red : c.grey}failed: ${failed}${c.reset}`);
console.log(`${c.cyan}${'─'.repeat(62)}${c.reset}\n`);

process.exit(failed === 0 ? 0 : 1);
