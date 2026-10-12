/**
 * Runs the existing smoke suite end-to-end against a MOCK GitHub API.
 *
 * Purpose: prove the clone-analytics changes are sound without depending on a
 * real GitHub token (the one currently in backend/.env has been revoked by
 * GitHub and answers 401). Nothing here touches github.com, and the real token
 * is never printed or forwarded to the mock.
 *
 *   node mockGithubSmoke.mjs
 */

import http from 'node:http';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const backend = path.resolve(here, '../..');
const PORT = 5005;

const c = { green: '\x1b[32m', red: '\x1b[31m', cyan: '\x1b[36m', grey: '\x1b[90m', reset: '\x1b[0m' };

/* ------------------------- mock GitHub payloads ---------------------- */
const DAY = 86400000;

function commits(count, daysBack) {
  const out = [];
  const now = Date.now();
  for (let i = 0; i < count; i += 1) {
    const when = new Date(now - (i % daysBack) * DAY - Math.floor(i / daysBack) * DAY * 0.3);
    out.push({
      sha: `${i}`.padStart(40, '0'),
      commit: {
        author: { name: `Dev ${i % 7}`, date: when.toISOString() },
        message: `Mock commit ${i}`,
      },
      author: { login: `dev${i % 7}` },
    });
  }
  return out;
}

const REPOS = {
  'facebook/react': {
    stars: 228000,
    forks: 46500,
    size: 120000,
    topics: ['javascript', 'react'],
    languages: { JavaScript: 900000, TypeScript: 120000 },
    commits: commits(90, 70),
    fork: false,
  },
  'vitejs/vite': {
    stars: 67000,
    forks: 6600,
    size: 40000,
    topics: ['build-tool'],
    languages: { TypeScript: 400000 },
    commits: commits(80, 60),
    fork: true,
    parent: { full_name: 'facebook/react', html_url: 'https://github.com/facebook/react', owner: { login: 'facebook' } },
  },
};

// react -> traffic available, vite -> traffic denied (403)
const TRAFFIC = {
  'facebook/react': {
    status: 200,
    body: (() => {
      const clones = [];
      for (let i = 13; i >= 0; i -= 1) {
        clones.push({
          timestamp: new Date(Date.now() - i * DAY).toISOString(),
          count: 4 + (i % 3),
          uniques: 2 + (i % 2),
        });
      }
      return {
        count: clones.reduce((s, d) => s + d.count, 0),
        uniques: clones.reduce((s, d) => s + d.uniques, 0),
        clones,
      };
    })(),
  },
  'vitejs/vite': {
    status: 403,
    body: { message: 'Resource not accessible by personal access token' },
  },
};

const mock = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const send = (status, body) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  };
  const p = url.pathname;

  if (p === '/user') return send(200, { login: 'mock-account', id: 42 });

  const m = p.match(/^\/repos\/([^/]+)\/([^/]+)(\/.*)?$/);
  if (!m) return send(404, { message: 'Not Found' });

  const key = `${m[1]}/${m[2]}`;
  const rest = m[3] || '';
  const repo = REPOS[key];

  if (!repo) return send(404, { message: 'Not Found' });

  if (rest === '/traffic/clones') {
    const t = TRAFFIC[key];
    return t ? send(t.status, t.body) : send(403, { message: 'Resource not accessible by personal access token' });
  }

  if (rest === '') {
    return send(200, {
      full_name: key,
      name: m[2],
      owner: { login: m[1] },
      html_url: `https://github.com/${key}`,
      homepage: `https://${key.split('/')[1]}.dev`,
      description: `Mock repository ${key}`,
      stargazers_count: repo.stars,
      forks_count: repo.forks,
      subscribers_count: Math.round(repo.stars / 10),
      default_branch: 'main',
      topics: repo.topics,
      license: { spdx_id: 'MIT' },
      size: repo.size,
      created_at: new Date(Date.now() - 900 * DAY).toISOString(),
      updated_at: new Date(Date.now() - 2 * DAY).toISOString(),
      pushed_at: new Date(Date.now() - DAY).toISOString(),
      fork: repo.fork || false,
      parent: repo.parent || null,
      source: repo.parent || null,
      open_issues_count: 0,
    });
  }

  if (rest === '/languages') return send(200, repo.languages);
  if (rest === '/contributors') {
    return send(200, Array.from({ length: 9 }, (_, i) => ({
      login: `dev${i}`, id: i, type: 'User', contributions: 400 - i * 30,
      avatar_url: '', html_url: `https://github.com/dev${i}`,
    })));
  }
  if (rest === '/commits') return send(200, repo.commits);
  if (rest === '/issues') {
    return send(200, Array.from({ length: 8 }, (_, i) => ({
      number: i + 1, state: i % 2 ? 'closed' : 'open', title: `Issue ${i}`,
      labels: i % 2 ? [{ name: 'bug' }] : [], user: { login: `dev${i % 7}` }, created_at: new Date().toISOString(),
    })));
  }
  if (rest === '/pulls') {
    return send(200, Array.from({ length: 6 }, (_, i) => ({
      number: 100 + i, state: i % 2 ? 'closed' : 'open', title: `PR ${i}`,
      user: { login: `dev${i % 7}` }, created_at: new Date().toISOString(),
      merged_at: i % 2 ? new Date().toISOString() : null,
    })));
  }

  return send(404, { message: 'Not Found' });
});

await new Promise((r) => mock.listen(0, '127.0.0.1', r));
const mockPort = mock.address().port;
const apiBase = `http://127.0.0.1:${mockPort}`;

console.log(`\n${c.cyan}Running the existing smoke suite against a mock GitHub API${c.reset}`);
console.log(`${c.grey}  mock      : ${apiBase}${c.reset}`);
console.log(`${c.grey}  real token: never sent to the mock, never printed${c.reset}\n`);

const child = spawn(process.execPath, ['src/bootstrap.js'], {
  cwd: backend,
  env: { ...process.env, PORT: String(PORT), GITHUB_API_URL: apiBase, NODE_ENV: 'development' },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let serverLog = '';
child.stdout.on('data', (d) => { serverLog += d; });
child.stderr.on('data', (d) => { serverLog += d; });

// Wait for readiness (server up AND Atlas connected).
let up = false;
for (let i = 0; i < 90 && !up; i += 1) {
  await new Promise((r) => setTimeout(r, 1000));
  try {
    const res = await fetch(`http://localhost:${PORT}/api/health`);
    const body = await res.json();
    up = res.ok && body?.data?.database === 'connected';
  } catch { /* not up yet */ }
}

if (!up) {
  console.log(`${c.red}Backend failed to start:${c.reset}\n${serverLog.slice(-2000)}`);
  child.kill();
  mock.close();
  process.exit(1);
}

console.log(`${c.green}  backend ready on :${PORT}${c.reset}\n`);

const smoke = spawn(process.execPath, ['src/scripts/smokeTest.js'], {
  cwd: backend,
  env: { ...process.env, SMOKE_BASE_URL: `http://localhost:${PORT}/api`, PORT: String(PORT) },
  stdio: 'inherit',
});

const code = await new Promise((r) => smoke.on('exit', r));

child.kill();
mock.close();
process.exit(code ?? 1);
