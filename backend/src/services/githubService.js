import axios from 'axios';
import { ApiError } from '../utils/ApiError.js';
import { config } from '../config/env.js';

/* ------------------------------------------------------------------ *
 * GitHub REST API client
 * All GitHub traffic for GitPulse lives in this service — the React
 * frontend never talks to GitHub directly.
 * ------------------------------------------------------------------ */

const GITHUB_API_BASE = config.githubApiUrl || 'https://api.github.com';
const USER_AGENT = 'GitPulse-App/1.0';
const REQUEST_TIMEOUT_MS = 15000;
const MAX_COMMITS_FETCHED = 100;
const MAX_CONTRIBUTORS_FETCHED = 100;
const MAX_ISSUES_FETCHED = 100;
const MAX_PULLS_FETCHED = 100;

const http = axios.create({
  baseURL: GITHUB_API_BASE,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': USER_AGENT,
  },
});

/** Optional token → 5,000 req/h instead of 60 req/h. */
http.interceptors.request.use((requestConfig) => {
  if (config.githubToken) {
    requestConfig.headers.Authorization = `Bearer ${config.githubToken}`;
  }
  return requestConfig;
});

/* --------------------------- language colours ----------------------- */
/* Curated subset of GitHub Linguist colours used for the charts.        */
const LANGUAGE_COLORS = {
  JavaScript: '#F7DF1E',
  TypeScript: '#3178C6',
  Python: '#3776AB',
  Java: '#B07219',
  'C++': '#F34B7D',
  C: '#555555',
  'C#': '#178600',
  Go: '#00ADD8',
  Rust: '#DEA584',
  Ruby: '#CC342D',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  HTML: '#E34C26',
  CSS: '#563D7C',
  SCSS: '#C6538C',
  Less: '#1D365D',
  Shell: '#89E051',
  PowerShell: '#012456',
  Vue: '#41B883',
  Svelte: '#FF3E00',
  Lua: '#000080',
  Perl: '#0298C3',
  R: '#198CE7',
  Scala: '#C22D40',
  Elixir: '#6E4A7E',
  Haskell: '#5E5086',
  Clojure: '#DB5855',
  Erlang: '#B83998',
  Zig: '#F7A41D',
  'Objective-C': '#438EFF',
  Assembly: '#6E4C13',
  Jupyter: '#DA5B0B',
  Dockerfile: '#384D54',
  'Jupyter Notebook': '#DA5B0B',
  MDX: '#FCB32C',
  Astro: '#FF5A03',
};

const FALLBACK_PALETTE = [
  '#6366F1', '#22D3EE', '#F472B6', '#FBBF24', '#34D399',
  '#A78BFA', '#FB7185', '#38BDF8', '#F97316', '#14B8A6',
];

/* Deterministic initials avatar used when GitHub returns no avatar image. */
function fallbackAvatar(login) {
  const index = String(login)
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % FALLBACK_PALETTE.length;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    String(login).slice(0, 24),
  )}&background=${FALLBACK_PALETTE[index].replace('#', '')}&color=fff&size=96&bold=true`;
}

function colorForLanguage(language, index) {
  if (LANGUAGE_COLORS[language]) return LANGUAGE_COLORS[language];
  return FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
}

/* --------------------------- URL parsing ---------------------------- */

const OWNER_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const REPO_RE = /^[A-Za-z0-9._-]{1,100}$/;

/**
 * Accepts every shape a student/user might paste:
 *   https://github.com/owner/repo
 *   https://github.com/owner/repo.git
 *   github.com/owner/repo/
 *   owner/repo
 *   git@github.com:owner/repo.git
 * Throws a 400 ApiError with a human message when the input is unusable.
 */
export function parseRepositoryUrl(input) {
  if (typeof input !== 'string' || input.trim() === '') {
    throw ApiError.badRequest('Please paste a GitHub repository URL to analyze.', {
      field: 'repoUrl',
    });
  }

  let cleaned = input.trim();

  // git@github.com:owner/repo.git
  if (cleaned.startsWith('git@')) {
    cleaned = cleaned.replace(/^git@github\.com:/i, 'https://github.com/');
  }

  // Remove scheme / host so only the path remains
  cleaned = cleaned.replace(/^https?:\/\//i, '');
  cleaned = cleaned.replace(/^www\./i, '');
  cleaned = cleaned.replace(/^github\.com\//i, '');
  cleaned = cleaned.replace(/\.git$/i, '');
  cleaned = cleaned.replace(/\/+$/, '');
  cleaned = cleaned.split(/[?#]/)[0];

  const segments = cleaned.split('/').filter(Boolean);

  if (segments.length === 0 || segments.length > 2) {
    throw ApiError.badRequest(
      'That does not look like a GitHub repository URL. Use a link like https://github.com/owner/repository',
      { field: 'repoUrl', received: input },
    );
  }

  const [owner, repoName = ''] = segments;

  if (!OWNER_RE.test(owner)) {
    throw ApiError.badRequest('The repository owner name in that URL is not valid.', {
      field: 'repoUrl',
      received: input,
    });
  }

  if (!REPO_RE.test(repoName)) {
    throw ApiError.badRequest(
      'The repository name is missing from that URL. Use a link like https://github.com/owner/repository',
      { field: 'repoUrl', received: input },
    );
  }

  if (['settings', 'notifications', 'pulls', 'issues', 'marketplace'].includes(owner.toLowerCase())) {
    throw ApiError.badRequest('That URL points to a GitHub feature page, not a repository.', {
      field: 'repoUrl',
    });
  }

  return {
    owner,
    repoName,
    fullName: `${owner}/${repoName}`,
    url: `https://github.com/${owner}/${repoName}`,
  };
}

/* ------------------------ GitHub error mapping ---------------------- */

function mapGitHubError(error, { owner, repoName }) {
  const status = error.response?.status;
  const remaining = error.response?.headers?.['x-ratelimit-remaining'];
  const reset = error.response?.headers?.['x-ratelimit-reset'];
  const where = `owner "${owner}" / repository "${repoName}"`;

  if (status === 404) {
    return ApiError.notFound(
      `We could not find that repository (${where}). Check the spelling, or the repository may be private. GitPulse can only analyze public repositories unless a GITHUB_TOKEN with access is configured.`,
      { githubStatus: 404 },
    );
  }

  if (status === 401) {
    return ApiError.badGateway(
      'The GitHub token configured on the server was rejected. Remove or regenerate GITHUB_TOKEN.',
      { githubStatus: 401 },
    );
  }

  if (status === 403 || status === 429) {
    if (String(remaining) === '0') {
      const resetTime = reset ? new Date(Number(reset) * 1000).toLocaleTimeString() : 'soon';
      return ApiError.tooManyRequests(
        `GitHub API rate limit reached (60 requests/hour for unauthenticated requests). Try again after ${resetTime}, or configure a free GITHUB_TOKEN on the server to raise the limit to 5,000 requests/hour.`,
        { githubStatus: status, rateLimit: true },
      );
    }
    return ApiError.badGateway(
      'GitHub refused this request (403). This usually means the request was rate limited or blocked.',
      { githubStatus: 403 },
    );
  }

  if (status >= 500) {
    return ApiError.badGateway(
      'The GitHub API is temporarily unavailable (their servers are having trouble). Please try again in a moment.',
      { githubStatus: status },
    );
  }

  if (error.code === 'ECONNABORTED') {
    return ApiError.badGateway('The request to GitHub timed out. Please check your internet connection and try again.', {
      timeout: true,
    });
  }

  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'EAI_AGAIN') {
    return ApiError.serviceUnavailable(
      'Could not reach the GitHub API. Please check your internet connection.',
      { network: true },
    );
  }

  return ApiError.badGateway(
    'Something went wrong while talking to the GitHub API.',
    { githubStatus: status || null },
  );
}

/** Single low-level request helper with uniform error mapping. */
async function githubRequest(path, params, context) {
  try {
    const { data } = await http.get(path, { params });
    return data;
  } catch (error) {
    const mapped = mapGitHubError(error, context);
    // Keep GitHub's own message for diagnostics. It is never a secret and never
    // contains the token — it is what explains a 401 / 403 / 404 to the operator.
    const githubMessage = error?.response?.data?.message;
    if (githubMessage) {
      mapped.details = { ...(mapped.details || {}), githubMessage };
    }
    throw mapped;
  }
}

/* -------------------------- API operations -------------------------- */

export function fetchRepositoryInfo(owner, repoName) {
  return githubRequest(`/repos/${owner}/${repoName}`, undefined, { owner, repoName });
}

export function fetchLanguages(owner, repoName) {
  return githubRequest(`/repos/${owner}/${repoName}/languages`, undefined, { owner, repoName });
}

export function fetchContributors(owner, repoName) {
  return githubRequest(
    `/repos/${owner}/${repoName}/contributors`,
    { per_page: MAX_CONTRIBUTORS_FETCHED, anon: 'false' },
    { owner, repoName },
  );
}

export function fetchRecentCommits(owner, repoName, sinceDays = 120) {
  const since = new Date(Date.now() - sinceDays * 86400000).toISOString();
  return githubRequest(
    `/repos/${owner}/${repoName}/commits`,
    { per_page: MAX_COMMITS_FETCHED, since },
    { owner, repoName },
  );
}

export function fetchIssues(owner, repoName) {
  return githubRequest(
    `/repos/${owner}/${repoName}/issues`,
    { state: 'all', per_page: MAX_ISSUES_FETCHED, sort: 'updated', direction: 'desc' },
    { owner, repoName },
  );
}

export function fetchPullRequests(owner, repoName) {
  return githubRequest(
    `/repos/${owner}/${repoName}/pulls`,
    { state: 'all', per_page: MAX_PULLS_FETCHED, sort: 'updated', direction: 'desc' },
    { owner, repoName },
  );
}

/**
 * Clone statistics from the GitHub repository traffic API.
 * ---------------------------------------------------------------
 * GET /repos/{owner}/{repo}/traffic/clones returns aggregate counts for the
 * last 14 days: { count, uniques, clones: [{ timestamp, count, uniques }] }.
 *
 * IMPORTANT: GitHub only serves this endpoint to users who have **push access**
 * to the repository, so for most public repositories GitHub answers 403/404.
 * That is an expected, non-fatal outcome — this function therefore never
 * throws and reports availability instead, so a missing clone chart can never
 * break a repository analysis.
 */
export async function fetchCloneStats(owner, repoName) {
  // Every result carries the exact repository it describes. Downstream code
  // refuses to store or serve clone data whose key does not match the
  // repository being analyzed, so two repositories can never share a cache.
  const repositoryKey = `${owner}/${repoName}`;

  if (!config.githubToken) {
    logCloneUnavailable({ owner, repoName, status: null, githubMessage: null, reason: 'no_token' });
    return {
      available: false,
      repositoryKey,
      reason: 'no_token',
      httpStatus: null,
      githubMessage: null,
      count: null,
      uniques: null,
      clones: [],
      message:
        'GitHub requires an authenticated token to serve clone statistics. Add GITHUB_TOKEN to backend/.env to enable this chart.',
    };
  }

  try {
    const data = await githubRequest(
      `/repos/${owner}/${repoName}/traffic/clones`,
      undefined,
      { owner, repoName },
    );

    return {
      available: true,
      repositoryKey,
      reason: null,
      httpStatus: 200,
      githubMessage: null,
      count: Number(data?.count) || 0,
      uniques: Number(data?.uniques) || 0,
      clones: Array.isArray(data?.clones) ? data.clones : [],
      message: null,
    };
  } catch (error) {
    const httpStatus = error?.details?.githubStatus || null;
    const githubMessage = error?.details?.githubMessage || null;

    const classification = classifyCloneFailure(
      httpStatus,
      error?.code,
      githubMessage,
      error?.details?.rateLimit === true,
    );
    logCloneUnavailable({ owner, repoName, status: httpStatus, githubMessage, reason: classification.reason });

    return {
      available: false,
      repositoryKey,
      reason: classification.reason,
      httpStatus,
      githubMessage,
      count: null,
      uniques: null,
      clones: [],
      message: classification.message,
    };
  }
}

/**
 * Validates the configured token WITHOUT ever exposing it.
 *
 * Returns only non-secret facts: whether GitHub accepted the token, which
 * account it belongs to, and how much of the hourly rate limit is left.
 * Used to tell "the token is broken" apart from "the token simply has no
 * traffic rights on this repository" — two very different problems.
 */
export async function checkTokenAccess() {
  if (!config.githubToken) {
    return { configured: false, valid: false, login: null, rateLimitRemaining: null, rateLimit: null, reason: 'no_token' };
  }

  try {
    const res = await githubRequest('/user', undefined, { owner: null, repoName: null });
    return {
      configured: true,
      valid: true,
      login: res?.login || null,
      rateLimitRemaining: Number(http.defaults.headers?.['x-ratelimit-remaining']) || null,
      rateLimit: null,
      reason: null,
    };
  } catch (error) {
    const httpStatus = error?.details?.githubStatus || null;
    return {
      configured: true,
      valid: false,
      login: null,
      rateLimitRemaining: null,
      rateLimit: null,
      reason: classifyCloneFailure(
        httpStatus,
        error?.code,
        error?.details?.githubMessage,
        error?.details?.rateLimit === true,
      ).reason,
      httpStatus,
      githubMessage: error?.details?.githubMessage || null,
    };
  }
}

/** Safe diagnostic line — status + GitHub's message only. The token is never printed. */
function logCloneUnavailable({ owner, repoName, status, githubMessage, reason }) {
  const bits = [
    `\x1b[33m⚠ Clone analytics unavailable\x1b[0m for ${owner}/${repoName}`,
    `reason=${reason}`,
  ];
  if (status) bits.push(`githubHTTP=${status}`);
  if (githubMessage) bits.push(`githubMessage="${githubMessage}"`);

  const hint =
    reason === 'insufficient_permissions'
      ? '\x1b[90m   → GitHub requires repository admin access to serve traffic; this token cannot ' +
        'administer this repository. A fine-grained token selecting it with "Administration: Read" is required.\x1b[0m'
      : '';

  console.warn(`${bits.join(' · ')}`);
  if (hint) console.warn(hint);
}

/**
 * Turns a GitHub failure into a precise reason so the UI (and the logs) can
 * distinguish authentication, permission, not-found, rate-limit and other.
 *
 * `rateLimited` must be checked BEFORE the 403 branch: GitHub answers 403 (not
 * 429) when an hourly quota is exhausted, and a quota problem must never be
 * reported to the user as a permissions problem.
 */
function classifyCloneFailure(httpStatus, apiCode, githubMessage, rateLimited = false) {
  if (rateLimited || apiCode === 'rate_limited' || apiCode === 'too_many_requests' || httpStatus === 429) {
    return {
      reason: 'rate_limited',
      message:
        'GitHub API rate limit reached, so clone statistics were skipped for this analysis. Try again shortly.',
    };
  }

  if (httpStatus === 401) {
    return {
      reason: 'token_invalid',
      message:
        'GitHub rejected the configured GITHUB_TOKEN (401 Unauthorized). Check that the token is still valid and has not been revoked.',
    };
  }

  if (httpStatus === 403) {
    // GitHub returns "Resource not accessible by personal access token" for
    // classic AND fine-grained tokens alike, so the wording cannot be used to
    // tell which kind of token is configured. The one true statement is that
    // this token cannot administer this repository.
    return {
      reason: 'insufficient_permissions',
      message:
        'GitHub requires repository admin access to serve clone statistics, and the configured token does not have admin rights on this repository. To enable this chart, use a fine-grained access token that selects this repository and grants "Administration: Read", then re-analyze.',
    };
  }

  if (httpStatus === 404) {
    return {
      reason: 'traffic_not_found',
      message:
        'GitHub returned 404 for the traffic endpoint. The repository may be private or unknown to this token, and GitHub also hides traffic data for repositories the token cannot administer.',
    };
  }

  if (!httpStatus) {
    return {
      reason: 'network_error',
      message:
        'The GitHub API could not be reached from the server (network or timeout error), so clone statistics were skipped.',
    };
  }

  return {
    reason: 'error',
    message: `GitHub could not return clone statistics for this repository (HTTP ${httpStatus}).`,
  };
}

/* ------------------------- shaping helpers -------------------------- */

export function shapeLanguages(rawLanguages = {}) {
  const entries = Object.entries(rawLanguages);
  const totalBytes = entries.reduce((sum, [, bytes]) => sum + bytes, 0);

  return entries
    .map(([language, bytes], index) => ({
      language,
      bytes,
      percentage: totalBytes > 0 ? Number(((bytes / totalBytes) * 100).toFixed(2)) : 0,
      color: colorForLanguage(language, index),
    }))
    .sort((a, b) => b.bytes - a.bytes);
}

export function shapeContributors(rawContributors = []) {
  return rawContributors
    .filter((c) => c && c.login)
    .map((c) => ({
      login: c.login,
      avatarUrl: c.avatar_url || fallbackAvatar(c.login),
      profileUrl: c.html_url || `https://github.com/${c.login}`,
      contributions: Number(c.contributions) || 0,
    }))
    .sort((a, b) => b.contributions - a.contributions);
}

export function shapeCommits(rawCommits = []) {
  return rawCommits
    .filter((c) => c && c.commit)
    .map((c) => ({
      sha: c.sha,
      shortSha: c.sha.slice(0, 7),
      message: (c.commit.message || '').split('\n')[0].slice(0, 140),
      author: c.author?.login || c.commit.author?.name || 'unknown',
      avatarUrl: c.author?.avatar_url || fallbackAvatar(c.author?.login || c.commit.author?.name || 'unknown'),
      url: c.html_url || '',
      date: c.commit.author?.date || c.commit.committer?.date || new Date().toISOString(),
    }));
}

/**
 * Repository origin, taken from the SAME /repos/{owner}/{repo} response that
 * GitPulse already fetches — this adds no extra GitHub API request.
 *
 * Rules (deliberately conservative — GitPulse never guesses an origin):
 *  • `fork: true`  → GitHub itself links this repository to an upstream project.
 *    `source` is the root of the fork network, `parent` the repository it was
 *    forked from, so `source` is preferred and `parent` is the fallback.
 *  • `fork: false` → GitHub records NO origin. That is not proof the code was
 *    never copied, so we report "no link found" and claim nothing.
 */
export function shapeOrigin(repo = {}) {
  const base = {
    isFork: false,
    verified: false,
    reason: null,
    originFullName: null,
    originOwner: null,
    originUrl: null,
    originDescription: null,
    message: null,
    source: 'GitHub repository metadata',
  };

  if (repo.fork !== true) {
    return {
      ...base,
      reason: 'no_link_found',
      message:
        'GitHub does not link this repository to an upstream project. That is not proof that its code was never copied — GitHub only records an origin for repositories created through its own fork flow.',
    };
  }

  const upstream =
    (repo.source && repo.source.full_name && repo.source) ||
    (repo.parent && repo.parent.full_name && repo.parent) ||
    null;

  if (!upstream) {
    return {
      ...base,
      isFork: true,
      reason: 'incomplete_metadata',
      message:
        'GitHub marks this repository as a fork but did not return the upstream repository in its metadata, so GitPulse cannot name a source.',
    };
  }

  return {
    ...base,
    isFork: true,
    verified: true,
    originFullName: upstream.full_name,
    originOwner: upstream.owner?.login || String(upstream.full_name).split('/')[0],
    originUrl: upstream.html_url || null,
    originDescription: upstream.description || null,
    source: 'GitHub repository metadata · official fork link',
  };
}

export function shapeIssues(rawIssues = []) {
  const issues = rawIssues.filter((item) => item && !item.pull_request); // exclude PRs
  const open = issues.filter((i) => i.state === 'open').length;
  const closed = issues.filter((i) => i.state === 'closed').length;

  const byLabel = new Map();
  issues.forEach((issue) => {
    const primary =
      issue.labels?.find((l) => l && l.name && !l.name.startsWith('wontfix'))?.name ||
      'Unlabelled';
    byLabel.set(primary, (byLabel.get(primary) || 0) + 1);
  });

  const labels = [...byLabel.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return {
    total: issues.length,
    open,
    closed,
    sampled: rawIssues.length >= MAX_ISSUES_FETCHED,
    labels,
  };
}

export function shapePullRequests(rawPulls = []) {
  const open = rawPulls.filter((p) => p.state === 'open').length;
  const closed = rawPulls.filter((p) => p.state === 'closed').length;

  const now = Date.now();
  const mergedLast30 = rawPulls.filter(
    (p) => p.merged_at && now - new Date(p.merged_at).getTime() < 30 * 86400000,
  ).length;

  return { total: rawPulls.length, open, closed, mergedLast30 };
}

/* --------------------------- main entry ----------------------------- */

/**
 * Fetches every GitHub datapoint GitPulse needs for one repository.
 * Calls run in parallel but failures degrade gracefully: a repository that
 * has no issues / no contributors must still be analyzable.
 */
export async function fetchRepositoryData(owner, repoName) {
  const context = { owner, repoName };

  const [repo, languages, contributors, commits, issues, pulls, cloneStats] = await Promise.all([
    fetchRepositoryInfo(owner, repoName), // required — throws on 404
    fetchLanguages(owner, repoName).catch(() => ({})),
    fetchContributors(owner, repoName).catch(() => []),
    fetchRecentCommits(owner, repoName).catch(() => []),
    fetchIssues(owner, repoName).catch(() => []),
    fetchPullRequests(owner, repoName).catch(() => []),
    fetchCloneStats(owner, repoName).catch(() => ({
      available: false,
      reason: 'error',
      count: null,
      uniques: null,
      clones: [],
      message: 'Clone statistics could not be fetched for this repository.',
    })),
  ]);

  const issueSummary = shapeIssues(issues);
  const pullSummary = shapePullRequests(pulls);

  return {
    owner: repo.owner?.login || owner,
    repoName: repo.name || repoName,
    fullName: repo.full_name || `${owner}/${repoName}`,
    repoUrl: repo.html_url || `https://github.com/${owner}/${repoName}`,
    homepage: repo.homepage || '',
    description: repo.description || 'No description provided by the repository owner.',
    stars: Number(repo.stargazers_count) || 0,
    forks: Number(repo.forks_count) || 0,
    watchers: Number(repo.subscribers_count) || 0,
    openIssues: issueSummary.open,
    closedIssues: issueSummary.closed,
    openPullRequests: pullSummary.open,
    closedPullRequests: pullSummary.closed,
    mergedPullRequestsLast30: pullSummary.mergedLast30,
    defaultBranch: repo.default_branch || 'main',
    topics: Array.isArray(repo.topics) ? repo.topics.slice(0, 10) : [],
    license: repo.license?.spdx_id && repo.license.spdx_id !== 'NOASSERTION' ? repo.license.spdx_id : null,
    sizeKb: Number(repo.size) || 0,
    createdOnGitHub: repo.created_at || null,
    githubUpdatedAt: repo.updated_at || null,
    lastPushedAt: repo.pushed_at || null,

    languages: shapeLanguages(languages),
    contributors: shapeContributors(contributors),
    recentCommits: shapeCommits(commits),

    issueLabels: issueSummary.labels,
    issuesSampled: issueSummary.sampled,

    // Derived from the repo response already fetched above — no extra API call
    origin: shapeOrigin(repo),
    // `resolvedKey` records where GitHub actually resolved the requested
    // owner/name to. GitHub silently follows renames and transfers (the
    // facebook/react → react/react move is the classic example), so the path
    // we asked for and the canonical name can legitimately differ. Recording
    // both keeps cache isolation exact instead of producing false mismatches.
    cloneStats: { ...cloneStats, resolvedKey: repo.full_name || null },

    fetchedAt: new Date().toISOString(),
  };
}

/** Live GitHub rate-limit status (shown on the admin dashboard). */
export async function fetchRateLimitStatus() {
  try {
    const { data } = await http.get('/rate_limit');
    const core = data?.resources?.core || {};
    return {
      limit: core.limit ?? null,
      remaining: core.remaining ?? null,
      reset: core.reset ? new Date(core.reset * 1000).toISOString() : null,
      authenticated: Boolean(config.githubToken),
    };
  } catch {
    return { limit: null, remaining: null, reset: null, authenticated: Boolean(config.githubToken) };
  }
}

export const __testing = {
  mapGitHubError,
  colorForLanguage,
  fetchCloneStats,
  classifyCloneFailure,
  buildOriginKey: (owner, repoName) => `${owner}/${repoName}`,
};