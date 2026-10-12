/**
 * End-to-end API check of the new clone-analytics contract.
 * Runs the real backend against a mock GitHub so both the "traffic allowed"
 * and "traffic denied" paths are exercised, then inspects the API payload.
 */

import http from 'node:http';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const PORT = 5006;
const DAY = 86400000;

const c = { green: '\x1b[32m', red: '\x1b[31m', cyan: '\x1b[36m', grey: '\x1b[90m', reset: '\x1b[0m' };
let passed = 0, failed = 0;
const check = (l, ok, extra = '') => {
  if (ok) { passed += 1; console.log(`${c.green}  PASS${c.reset}  ${l}${extra ? ` ${c.grey}${extra}${c.reset}` : ''}`); }
  else { failed += 1; console.log(`${c.red}  FAIL${c.reset}  ${l}${extra ? ` ${c.grey}${extra}${c.reset}` : ''}`); }
};

const cloneDays = [];
for (let i = 13; i >= 0; i -= 1) {
  cloneDays.push({ timestamp: new Date(Date.now() - i * DAY).toISOString(), count: 3 + (i % 4), uniques: 2 });
}

const REPOS = {
  'octo/allowed': {
    stars: 120, forks: 12, size: 900, topics: ['demo'],
    languages: { JavaScript: 50000 },
    commits: Array.from({ length: 40 }, (_, i) => ({
      sha: `${i}`.padStart(40, '0'),
      commit: { author: { name: `D${i % 5}`, date: new Date(Date.now() - (i % 40) * DAY).toISOString() }, message: `c${i}` },
      author: { login: `d${i % 5}` },
    })),
    traffic: { status: 200, body: { count: cloneDays.reduce((s, d) => s + d.count, 0), uniques: cloneDays.reduce((s, d) => s + d.uniques, 0), clones: cloneDays } },
  },
  'octo/denied': {
    stars: 40, forks: 3, size: 300, topics: ['demo'],
    languages: { TypeScript: 20000 },
    commits: Array.from({ length: 20 }, (_, i) => ({
      sha: `${i}`.padStart(40, '0'),
      commit: { author: { name: `D${i % 3}`, date: new Date(Date.now() - (i % 20) * DAY).toISOString() }, message: `c${i}` },
      author: { login: `d${i % 3}` },
    })),
    traffic: { status: 403, body: { message: 'Resource not accessible by personal access token' } },
  },
};

const mock = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const send = (s, b) => { res.writeHead(s, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(b)); };
  const p = url.pathname;
  if (p === '/user') return send(200, { login: 'mock', id: 1 });
  const m = p.match(/^\/repos\/([^/]+)\/([^/]+)(\/.*)?$/);
  if (!m) return send(404, { message: 'Not Found' });
  const repo = REPOS[`${m[1]}/${m[2]}`];
  if (!repo) return send(404, { message: 'Not Found' });
  const rest = m[3] || '';
  if (rest === '/traffic/clones') return send(repo.traffic.status, repo.traffic.body);
  if (rest === '') {
    return send(200, {
      full_name: `${m[1]}/${m[2]}`, name: m[2], owner: { login: m[1] },
      html_url: `https://github.com/${m[1]}/${m[2]}`, description: 'demo',
      stargazers_count: repo.stars, forks_count: repo.forks, subscribers_count: 9,
      default_branch: 'main', topics: repo.topics, license: { spdx_id: 'MIT' }, size: repo.size,
      created_at: new Date(Date.now() - 400 * DAY).toISOString(),
      updated_at: new Date().toISOString(), pushed_at: new Date().toISOString(), fork: false,
    });
  }
  if (rest === '/languages') return send(200, repo.languages);
  if (rest === '/contributors') return send(200, [{ login: 'a', id: 1, type: 'User', contributions: 10, avatar_url: '', html_url: '' }]);
  if (rest === '/commits') return send(200, repo.commits);
  if (rest === '/issues') return send(200, []);
  if (rest === '/pulls') return send(200, []);
  return send(404, { message: 'Not Found' });
});

await new Promise((r) => mock.listen(0, '127.0.0.1', r));
const api = `http://127.0.0.1:${mock.address().port}`;

const child = spawn(process.execPath, ['src/bootstrap.js'], {
  cwd: backend,
  env: { ...process.env, PORT: String(PORT), GITHUB_API_URL: api },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let log = '';
child.stdout.on('data', (d) => { log += d; });
child.stderr.on('data', (d) => { log += d; });

let up = false;
for (let i = 0; i < 90 && !up; i += 1) {
  await new Promise((r) => setTimeout(r, 1000));
  try {
    const b = await fetch(`http://localhost:${PORT}/api/health`).then((r) => r.json());
    up = b?.data?.database === 'connected';
  } catch { /* wait */ }
}
if (!up) { console.log(`${c.red}startup failed${c.reset}\n${log.slice(-1500)}`); child.kill(); mock.close(); process.exit(1); }

const BASE = `http://localhost:${PORT}/api`;
const hdr = { 'Content-Type': 'application/json' };
const stamp = Date.now();

const reg = await fetch(`${BASE}/auth/register`, {
  method: 'POST', headers: hdr,
  body: JSON.stringify({ name: 'Clone E2E', email: `clonee2e.${stamp}@gitpulse.dev`, password: 'VerifyPass123!' }),
}).then((r) => r.json());
const auth = { ...hdr, Authorization: `Bearer ${reg.data.token}` };

async function analyze(url) {
  const r = await fetch(`${BASE}/repositories/analyze`, { method: 'POST', headers: auth, body: JSON.stringify({ repoUrl: url }) });
  const body = await r.json();
  const id = body?.data?.repository?._id;
  const ax = await fetch(`${BASE}/analytics/repositories/${id}/analytics`, { headers: auth }).then((x) => x.json());
  return { status: r.status, repo: body?.data?.repository, analytics: ax?.data };
}

console.log(`\n${c.cyan}End-to-end clone analytics over the API${c.reset}\n`);

/* --- repo with traffic access ------------------------------------- */
console.log(`${c.cyan}repository the token may read traffic for${c.reset}\n`);
const ok = await analyze('https://github.com/octo/allowed');
const ca = ok.analytics?.cloneAnalytics;

check('analysis succeeded (201)', ok.status === 201, `status=${ok.status}`);
check('clone data is available', ca?.available === true);
check('payload carries the repository key', ca?.repositoryKey === 'octo/allowed', ca?.repositoryKey);
check('key matches the repository being served', ca?.repositoryKey === ok.repo?.fullName);
check('real total clones returned', typeof ca?.totalClones === 'number' && ca.totalClones > 0, `total=${ca?.totalClones}`);
check('real unique cloners returned', typeof ca?.uniqueCloners === 'number' && ca.uniqueCloners > 0, `uniques=${ca?.uniqueCloners}`);
check('14 daily points returned', ca?.daily?.length === 14);
check('all 14 days reported by GitHub', ca?.reportedDays === 14, `reported=${ca?.reportedDays}`);
check('no days were zero-filled', ca?.filledDays === 0);
check('capture time recorded', Boolean(ca?.fetchedAt));
check('freshness reported as not stale', ca?.isStale === false, `ageHours=${ca?.ageHours}`);
check('age in hours exposed', typeof ca?.ageHours === 'number');

/* --- repo where traffic is denied ---------------------------------- */
console.log(`\n${c.cyan}public repository where GitHub denies traffic${c.reset}\n`);
const denied = await analyze('https://github.com/octo/denied');
const dc = denied.analytics?.cloneAnalytics;

check('analysis still succeeded (201) — nothing else broke', denied.status === 201, `status=${denied.status}`);
check('stars still fetched', denied.repo?.stars === 40, `stars=${denied.repo?.stars}`);
check('languages still fetched', (denied.repo?.chartData?.languageDistribution?.length || 0) > 0);
check('clone data marked unavailable', dc?.available === false);
check('reason is the permission reason', dc?.reason === 'insufficient_permissions', dc?.reason);
check('GitHub HTTP status surfaced', dc?.httpStatus === 403);
check('no clone total invented', dc?.totalClones === null);
check('no unique cloners invented', dc?.uniqueCloners === null);
check('no daily series invented', dc?.daily?.length === 0);
check('no clone zeros displayed as real data', dc?.reportedDays === 0);
check('denied block is keyed to its own repository', dc?.repositoryKey === 'octo/denied', dc?.repositoryKey);
check('origin detection still present and separate', denied.analytics?.originInfo !== undefined);

/* --- isolation between the two ------------------------------------- */
console.log(`\n${c.cyan}cache isolation across both repositories${c.reset}\n`);
check('allowed repo key differs from denied repo key', ca.repositoryKey !== dc.repositoryKey);
check('allowed repo reports real counts', ca.totalClones > 0);
check('denied repo reports no counts at all', dc.totalClones === null && dc.uniqueCloners === null);
check('allowed repo daily array is populated', ca.daily.length === 14);
check('denied repo daily array is empty', dc.daily.length === 0);

child.kill();
mock.close();

console.log(`\n${c.cyan}${'─'.repeat(58)}${c.reset}`);
console.log(`  ${c.green}passed: ${passed}${c.reset}   ${failed ? c.red : c.grey}failed: ${failed}${c.reset}\n`);
process.exit(failed === 0 ? 0 : 1);
