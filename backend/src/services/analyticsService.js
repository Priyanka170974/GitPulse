/**
 * GitPulse Analytics Engine
 * ------------------------------------------------------------------
 * Everything in this file is computed from REAL data returned by the
 * GitHub REST API. No number here is invented or randomised.
 *
 * IMPORTANT FOR THE PRESENTATION:
 * The "pulse score" and the High / Moderate / Low activity labels are
 * defined by this project (GitPulse). They are NOT official GitHub
 * scores or metrics. The UI labels them accordingly.
 */

const DAY_MS = 86400000;

/* --------------------- indicator definitions ----------------------- */
/* Documented thresholds — also rendered in the UI tooltip / About page */
export const THRESHOLDS = {
  commitActivity: {
    label: 'Commit Activity',
    unit: 'commits in the last 30 days',
    high: 20, // >= 20  → high
    moderate: 8, // >= 8   → moderate, else low
    unitNote: 'Raw commits pushed to the default branch in the last 30 days.',
  },
  contributorActivity: {
    label: 'Contributor Activity',
    unit: 'distinct authors in the last 90 days',
    high: 8,
    moderate: 3,
    unitNote: 'Distinct commit authors inside the last 90 days.',
  },
  issueActivity: {
    label: 'Issue Activity',
    unit: 'share of sampled issues that are closed',
    high: 0.6,
    moderate: 0.3,
    unitNote: 'Closed vs. open ratio from the most recent issues fetched from GitHub.',
  },
  updateFrequency: {
    label: 'Update Frequency',
    unit: 'days since the last push',
    high: 1, // <= 1 day  → high
    moderate: 7, // <= 7 days → moderate, else low
    stale: 30,
    unitNote: 'Time elapsed since the repository was last pushed to GitHub.',
  },
};

/** How much each indicator contributes to the composite pulse score. */
export const WEIGHTS = { commitActivity: 0.35, contributorActivity: 0.25, updateFrequency: 0.25, issueActivity: 0.15 };

const LEVEL_LABEL = { high: 'High', moderate: 'Moderate', low: 'Low', unknown: 'Unknown' };

/* ----------------------------- helpers ----------------------------- */

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const startOfDay = (d) => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
};
const dayKey = (d) => startOfDay(d).toISOString().slice(0, 10);
const shortDay = (d) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
const isValidDate = (value) => value instanceof Date && !Number.isNaN(value.getTime());
const toDate = (value) => (isValidDate(value) ? value : new Date(value));

/* -------------------------- commit statistics ---------------------- */

/**
 * Builds commit statistics from the real commit list fetched from GitHub.
 * (GitHub removed/limited the /stats endpoints, so this is derived from
 * the actual commit timestamps — the numbers are still real.)
 */
export function computeCommitStats(commits = [], { sinceDays = 120 } = {}) {
  const now = Date.now();
  const recent = commits
    .map((c) => ({ ...c, date: toDate(c.date) }))
    .filter((c) => isValidDate(c.date) && now - c.date.getTime() <= sinceDays * DAY_MS)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const commits7Days = recent.filter((c) => now - c.date.getTime() <= 7 * DAY_MS).length;
  const commits30Days = recent.filter((c) => now - c.date.getTime() <= 30 * DAY_MS).length;

  const activeDays = new Set(
    recent.filter((c) => now - c.date.getTime() <= 30 * DAY_MS).map((c) => dayKey(c.date)),
  ).size;

  return {
    total: commits.length,
    commits7Days,
    commits30Days,
    activeDays30: activeDays,
    firstCommitAt: recent.length ? recent[0].date : null,
    lastCommitAt: recent.length ? recent[recent.length - 1].date : null,
    commits,
  };
}

/* --------------------------- chart builders ------------------------ */

/** Last 14 days, one point per day (zero-filled so the wave never lies about gaps). */
export function buildDailyCommitActivity(commits = [], days = 14) {
  const today = startOfDay(new Date());
  const buckets = new Map();

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(today.getTime() - i * DAY_MS);
    buckets.set(dayKey(date), { date, commits: 0 });
  }

  commits.forEach((c) => {
    const key = dayKey(c.date);
    if (buckets.has(key)) buckets.get(key).commits += 1;
  });

  return [...buckets.values()].map((bucket) => ({
    date: dayKey(bucket.date),
    label: shortDay(bucket.date),
    commits: bucket.commits,
  }));
}

/** Last 12 weeks, one point per week — the long view of the pulse. */
export function buildWeeklyCommitActivity(commits = [], weeks = 12) {
  const buckets = new Map();
  const thisMonday = (() => {
    const d = startOfDay(new Date());
    const day = (d.getDay() + 6) % 7; // Monday = 0
    return new Date(d.getTime() - day * DAY_MS);
  })();

  for (let i = weeks - 1; i >= 0; i -= 1) {
    const start = new Date(thisMonday.getTime() - i * 7 * DAY_MS);
    buckets.set(dayKey(start), { start, commits: 0 });
  }

  commits.forEach((c) => {
    const date = startOfDay(c.date);
    const monday = new Date(date.getTime() - ((date.getDay() + 6) % 7) * DAY_MS);
    const key = dayKey(monday);
    if (buckets.has(key)) buckets.get(key).commits += 1;
  });

  return [...buckets.values()].map((bucket) => ({
    week: dayKey(bucket.start),
    label: shortDay(bucket.start),
    commits: bucket.commits,
  }));
}

/**
 * Contributors ranked by commits inside the fetched window.
 * Blends the contributors endpoint (all-time totals) with the commit list
 * so the chart reflects recent real activity.
 */
export function buildContributorActivity(commits = [], contributors = [], limit = 10) {
  const recentCounts = new Map();
  commits.forEach((c) => {
    const login = c.author || 'unknown';
    recentCounts.set(login, (recentCounts.get(login) || 0) + 1);
  });

  const avatarByLogin = new Map(contributors.map((c) => [c.login, c.avatarUrl]));
  const profileByLogin = new Map(contributors.map((c) => [c.login, c.profileUrl]));

  const merged = new Map();

  contributors.forEach((c) => {
    merged.set(c.login, {
      login: c.login,
      avatarUrl: c.avatarUrl,
      profileUrl: c.profileUrl,
      allTime: c.contributions,
      recent: recentCounts.get(c.login) || 0,
    });
  });

  recentCounts.forEach((count, login) => {
    if (merged.has(login)) return;
    merged.set(login, { login, avatarUrl: '', profileUrl: profileByLogin.get(login) || '', allTime: count, recent: count });
  });

  const rows = [...merged.values()]
    .map((row) => ({
      login: row.login.length > 18 ? `${row.login.slice(0, 17)}…` : row.login,
      fullLogin: row.login,
      avatarUrl: avatarUrlFor(row.avatarUrl, row.login),
      profileUrl: row.profileUrl,
      commits: row.recent || 0,
      totalContributions: row.allTime,
    }))
    .sort((a, b) => b.commits - a.commits || b.totalContributions - a.totalContributions)
    .slice(0, limit);

  const total = rows.reduce((sum, r) => sum + r.commits, 0) || 1;

  return rows.map((row) => ({ ...row, share: Number(((row.commits / total) * 100).toFixed(1)) }));
}

const AVATAR_COLORS = ['#6366F1', '#22D3EE', '#F472B6', '#FBBF24', '#34D399', '#A78BFA'];
function avatarUrlFor(avatarUrl, login) {
  if (avatarUrl) return avatarUrl;
  const index = String(login).split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % AVATAR_COLORS.length;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(login)}&background=${AVATAR_COLORS[index].replace('#', '')}&color=fff&size=80&bold=true`;
}

/** Open vs closed issues (pull requests excluded by the GitHub service). */
export function buildIssueStatus(openIssues = 0, closedIssues = 0, labels = []) {
  const base = [
    { name: 'Open issues', value: openIssues, color: '#FB7185' },
    { name: 'Closed issues', value: closedIssues, color: '#34D399' },
  ];
  const labelRows = labels.map((l) => ({ name: l.name, value: l.value, color: '#6366F1' }));
  return { pie: base, labels: labelRows };
}

/**
 * Activity timeline = the real sequence of events GitHub returned:
 * the last 8 commits plus the repository creation / last push.
 */
export function buildActivityTimeline(commits = [], { createdOnGitHub, lastPushedAt } = {}) {
  const events = [];

  if (isValidDate(toDate(createdOnGitHub))) {
    events.push({
      type: 'created',
      label: 'Repository created on GitHub',
      date: toDate(createdOnGitHub),
      commits: 0,
    });
  }

  commits
    .slice(-8)
    .reverse()
    .forEach((c) => {
      events.push({
        type: 'commit',
        label: c.message || 'Commit pushed',
        date: toDate(c.date),
        commits: 1,
        author: c.author,
      });
    });

  if (isValidDate(toDate(lastPushedAt))) {
    events.push({ type: 'push', label: 'Last push to GitHub', date: toDate(lastPushedAt), commits: 0 });
  }

  return events.sort((a, b) => new Date(a.date) - new Date(b.date));
}

/* --------------------------- indicators ---------------------------- */

function levelFromCommitActivity(commits30Days) {
  if (commits30Days >= THRESHOLDS.commitActivity.high) {
    return { level: 'high', score: clamp((commits30Days / 30) * 100) };
  }
  if (commits30Days >= THRESHOLDS.commitActivity.moderate) {
    const ratio = (commits30Days - THRESHOLDS.commitActivity.moderate) /
      (THRESHOLDS.commitActivity.high - THRESHOLDS.commitActivity.moderate);
    return { level: 'moderate', score: clamp(45 + ratio * 45) };
  }
  return { level: 'low', score: clamp((commits30Days / THRESHOLDS.commitActivity.moderate) * 45) };
}

function levelFromContributorActivity(activeAuthors90d) {
  if (activeAuthors90d >= THRESHOLDS.contributorActivity.high) return { level: 'high', score: clamp((activeAuthors90d / 12) * 100) };
  if (activeAuthors90d >= THRESHOLDS.contributorActivity.moderate) {
    const ratio = (activeAuthors90d - THRESHOLDS.contributorActivity.moderate) /
      (THRESHOLDS.contributorActivity.high - THRESHOLDS.contributorActivity.moderate);
    return { level: 'moderate', score: clamp(45 + ratio * 45) };
  }
  return { level: 'low', score: clamp((activeAuthors90d / THRESHOLDS.contributorActivity.moderate) * 45) };
}

function levelFromIssueActivity(open, closed) {
  const total = open + closed;
  if (total === 0) return { level: 'unknown', score: 0, ratio: null };
  const ratio = closed / total;
  if (ratio >= THRESHOLDS.issueActivity.high) return { level: 'high', score: clamp(ratio * 100), ratio };
  if (ratio >= THRESHOLDS.issueActivity.moderate) return { level: 'moderate', score: clamp(ratio * 100), ratio };
  return { level: 'low', score: clamp(ratio * 100), ratio };
}

function levelFromUpdateFrequency(daysSincePush) {
  if (daysSincePush === null) return { level: 'unknown', score: 0 };
  if (daysSincePush <= THRESHOLDS.updateFrequency.high) return { level: 'high', score: 100 };
  if (daysSincePush <= THRESHOLDS.updateFrequency.moderate) return { level: 'moderate', score: clamp(100 - daysSincePush * 8, 40, 90) };
  if (daysSincePush <= THRESHOLDS.updateFrequency.stale) return { level: 'low', score: clamp(60 - daysSincePush, 15, 40) };
  return { level: 'low', score: 8 };
}

/** Builds the four GitPulse-defined indicators + the composite pulse score. */
export function computeIndicators({ commitStats, contributors, recentCommits, openIssues, closedIssues, lastPushedAt }) {
  const now = Date.now();
  const dates = recentCommits.map((c) => toDate(c.date)).filter(isValidDate);

  const commits30Days = commitStats.commits30Days;
  const activeAuthors90d = new Set(
    dates.filter((d) => now - d.getTime() <= 90 * DAY_MS).map((d) => toDate(d)),
  );
  const authorSet = new Set(
    recentCommits
      .filter((c) => now - toDate(c.date).getTime() <= 90 * DAY_MS)
      .map((c) => c.author || 'unknown'),
  );
  const activeAuthors = Math.max(authorSet.size, activeAuthors90d.size ? authorSet.size : 0);

  const daysSincePush = isValidDate(toDate(lastPushedAt))
    ? Math.max(0, Math.floor((now - toDate(lastPushedAt).getTime()) / DAY_MS))
    : null;

  const commitActivity = levelFromCommitActivity(commits30Days);
  const contributorActivity = levelFromContributorActivity(activeAuthors);
  const issueActivity = levelFromIssueActivity(openIssues, closedIssues);
  const updateFrequency = levelFromUpdateFrequency(daysSincePush);

  const indicators = [
    {
      key: 'commitActivity',
      label: THRESHOLDS.commitActivity.label,
      level: commitActivity.level,
      score: Math.round(commitActivity.score),
      summary: `${commits30Days} commits in the last 30 days (${commitStats.activeDays30} active days)`,
      metrics: { commits30Days, activeDays30: commitStats.activeDays30, commits7Days: commitStats.commits7Days },
    },
    {
      key: 'contributorActivity',
      label: THRESHOLDS.contributorActivity.label,
      level: contributorActivity.level,
      score: Math.round(contributorActivity.score),
      summary: `${activeAuthors} distinct authors committed in the last 90 days (${contributors.length} total contributors on GitHub)`,
      metrics: { activeAuthors90Days: activeAuthors, totalContributors: contributors.length },
    },
    {
      key: 'issueActivity',
      label: THRESHOLDS.issueActivity.label,
      level: issueActivity.level,
      score: Math.round(issueActivity.score),
      summary:
        issueActivity.ratio === null
          ? 'No issues found on GitHub for this repository'
          : `${closedIssues} closed / ${openIssues} open issues — ${Math.round(issueActivity.ratio * 100)}% resolved`,
      metrics: { openIssues, closedIssues, resolutionRate: issueActivity.ratio },
    },
    {
      key: 'updateFrequency',
      label: THRESHOLDS.updateFrequency.label,
      level: updateFrequency.level,
      score: Math.round(updateFrequency.score),
      summary:
        daysSincePush === null
          ? 'GitHub did not report a push date for this repository'
          : daysSincePush === 0
            ? 'Pushed to GitHub today'
            : `Last push was ${daysSincePush} day${daysSincePush === 1 ? '' : 's'} ago`,
      metrics: { daysSinceLastPush: daysSincePush },
    },
  ];

  // WEIGHTS already sum to 1, so this value is directly on the 0-100 scale.
  let pulseScore = Math.round(indicators.reduce((sum, ind) => sum + ind.score * WEIGHTS[ind.key], 0));
  if (indicators.every((i) => i.level === 'unknown')) pulseScore = 0;
  pulseScore = clamp(pulseScore);

  const pulseLabel =
    pulseScore === 0 ? 'unknown' : pulseScore >= 70 ? 'high' : pulseScore >= 40 ? 'moderate' : 'low';

  return {
    pulseScore,
    pulseLabel,
    indicators,
    meta: { daysSinceLastPush: daysSincePush, activeAuthors90Days: activeAuthors },
  };
}

/* ---------------------------- insights ----------------------------- */

/**
 * Generates plain-language observations strictly from the fetched data.
 * These are described in the UI as "GitPulse-generated insights".
 */
export function generateInsights(data, { commitStats, activity, deltas = null }) {
  const insights = [];
  const languages = data.chartData?.languageDistribution || [];
  const primary = languages[0];

  /* 1. Primary language ------------------------------------------------ */
  if (primary) {
    const share = primary.percentage;
    insights.push({
      key: 'primaryLanguage',
      title: `Primary language: ${primary.language}`,
      detail:
        languages.length === 1
          ? `GitHub reports code written entirely in ${primary.language} (${primary.percentage}% of the ${Math.round(primary.bytes / 1024)} KB measured).`
          : `${primary.language} makes up ${share}% of the measured code base, across ${languages.length} detected languages.`,
      tone: 'info',
    });
  } else {
    insights.push({
      key: 'primaryLanguage',
      title: 'No language data available',
      detail:
        'GitHub did not return language statistics for this repository. This usually happens for very new, empty or binary-only repositories.',
      tone: 'neutral',
    });
  }

  /* 2. Contributors ---------------------------------------------------- */
  const contributors = data.contributors || [];
  const top = contributors[0];
  if (contributors.length > 0) {
    const share = top.contributions / Math.max(1, contributors.reduce((s, c) => s + c.contributions, 0)) * 100;
    insights.push({
      key: 'contributors',
      title: `${contributors.length} contributor${contributors.length === 1 ? '' : 's'} tracked`,
      detail: `${top.login} leads with ${top.contributions} contributions (${share.toFixed(0)}% of the tracked contributions). GitHub activity inside the last 90 days is rated ${LEVEL_LABEL[activity.indicators.find((i) => i.key === 'contributorActivity').level]} by GitPulse.`,
      tone: contributors.length >= 5 ? 'positive' : 'neutral',
    });
  } else {
    insights.push({
      key: 'contributors',
      title: 'No contributors reported',
      detail: 'GitHub did not return a contributor list for this repository.',
      tone: 'neutral',
    });
  }

  /* 3. Commit rhythm --------------------------------------------------- */
  const commitIndicator = activity.indicators.find((i) => i.key === 'commitActivity');
  insights.push({
    key: 'commitActivity',
    title: `Commit rhythm: ${LEVEL_LABEL[commitIndicator.level]}`,
    detail: `${commitStats.commits30Days} commits landed in the last 30 days across ${commitStats.activeDays30} active days, and ${commitStats.commits7Days} in the last 7 days (from the ${commitStats.total} most recent commits fetched from GitHub).`,
    tone: commitIndicator.level === 'high' ? 'positive' : commitIndicator.level === 'low' ? 'warning' : 'neutral',
  });

  /* 4. Week-over-week momentum ---------------------------------------- */
  const weekly = data.chartData?.commitActivityWeekly || [];
  if (weekly.length >= 2) {
    const thisWeek = weekly[weekly.length - 1].commits;
    const lastWeek = weekly[weekly.length - 2].commits;
    if (lastWeek > 0) {
      const change = ((thisWeek - lastWeek) / lastWeek) * 100;
      insights.push({
        key: 'weeklyMomentum',
        title: change === 0 ? 'Weekly momentum unchanged' : `Commits ${change >= 0 ? 'increased' : 'decreased'} ${Math.abs(change).toFixed(0)}% week over week`,
        detail: `This week: ${thisWeek} commit${thisWeek === 1 ? '' : 's'} vs. ${lastWeek} last week, measured from real commit timestamps.`,
        tone: change > 15 ? 'positive' : change < -25 ? 'warning' : 'neutral',
      });
    }
  }

  /* 5. Issues ---------------------------------------------------------- */
  const totalIssues = (data.openIssues || 0) + (data.closedIssues || 0);
  if (totalIssues > 0) {
    const closed = data.closedIssues;
    const pct = Math.round((closed / totalIssues) * 100);
    const issueIndicator = activity.indicators.find((i) => i.key === 'issueActivity');
    insights.push({
      key: 'issues',
      title: `${data.openIssues} open · ${closed} closed issues`,
      detail: `${pct}% of the issues sampled from GitHub are resolved, so GitPulse rates issue activity as ${LEVEL_LABEL[issueIndicator.level]}. ${data.openPullRequests} pull request${data.openPullRequests === 1 ? '' : 's'} are open.`,
      tone: issueIndicator.level === 'high' ? 'positive' : issueIndicator.level === 'low' ? 'warning' : 'neutral',
    });
  } else {
    insights.push({
      key: 'issues',
      title: 'No issues tracked',
      detail: `GitHub returned no issues for this repository. ${data.openPullRequests} pull request${data.openPullRequests === 1 ? '' : 's'} are open.`,
      tone: 'neutral',
    });
  }

  /* 6. Update freshness ------------------------------------------------ */
  const updateIndicator = activity.indicators.find((i) => i.key === 'updateFrequency');
  insights.push({
    key: 'updateFrequency',
    title: `Update frequency: ${LEVEL_LABEL[updateIndicator.level]}`,
    detail: updateIndicator.summary,
    tone: updateIndicator.level === 'high' ? 'positive' : updateIndicator.level === 'low' ? 'warning' : 'neutral',
  });

  /* 7. Change since the previous GitPulse analysis ---------------------- */
  if (deltas && deltas.hasPrevious) {
    const parts = [];
    if (Number.isFinite(deltas.stars)) parts.push(`stars ${deltas.stars >= 0 ? '+' : ''}${deltas.stars}`);
    if (Number.isFinite(deltas.forks)) parts.push(`forks ${deltas.forks >= 0 ? '+' : ''}${deltas.forks}`);
    if (Number.isFinite(deltas.commits30Days)) {
      parts.push(`commits (30d) ${deltas.commits30Days >= 0 ? '+' : ''}${deltas.commits30Days}`);
    }
    if (parts.length) {
      insights.push({
        key: 'delta',
        title: `Change since your analysis on ${deltas.previousAnalyzedAtLabel}`,
        detail: `Compared with the previous GitPulse snapshot this repository moved: ${parts.join(', ')}.`,
        tone: (deltas.stars || 0) >= 0 ? 'positive' : 'warning',
      });
    }
  } else {
    insights.push({
      key: 'delta',
      title: 'First snapshot stored',
      detail: 'This is the first time GitPulse has analyzed this repository. Re-analyze it later to track how these numbers move.',
      tone: 'neutral',
    });
  }

  /* 8. Popularity ------------------------------------------------------- */
  insights.push({
    key: 'popularity',
    title: `${data.stars.toLocaleString()} stars · ${data.forks.toLocaleString()} forks`,
    detail: `${data.watchers.toLocaleString()} people watch this repository${data.license ? ` and it is released under ${data.license}` : ''}. Stars and forks are the exact numbers GitHub returns for the repository.`,
    tone: 'neutral',
  });

  return insights;
}

/* -------------------------- clone activity ------------------------- */

/**
 * Turns the GitHub repository traffic payload into a chart-ready series.
 *
 * GitHub returns aggregate counts only — it never exposes *who* cloned a
 * repository, so GitPulse reports totals and per-day counts and nothing more.
 * When the endpoint is not available (usually because the token has no push
 * access) the result is marked unavailable instead of throwing, so the rest
 * of the analysis still succeeds.
 *
 * Two guarantees this function enforces:
 *
 *  1. CACHE ISOLATION — clone data is accepted only when the payload's
 *     `repositoryKey` matches the repository being analyzed. A mismatch
 *     (impossible from a correct fetch, but cheap to defend against) yields
 *     "unavailable", never another repository's numbers.
 *  2. HONEST ZERO-FILLING — GitHub reports a rolling window of days. Days it
 *     did not report are marked `filled: true` and counted in `filledDays`, so
 *     a quiet day and a day GitHub never sent can never be confused.
 */
export function buildCloneAnalytics(cloneStats, { days = 14, repositoryKey = null } = {}) {
  const receivedKey = cloneStats?.repositoryKey || null;
  const resolvedKey = cloneStats?.resolvedKey || null;
  const expectedKey = repositoryKey || null;

  // Guard 1 — never accept clone data describing a different repository.
  // A payload is acceptable when it matches the repository being served either
  // directly, or through GitHub's own rename/transfer resolution
  // (requested `facebook/react` → canonical `react/react`). A payload from a
  // genuinely different repository matches neither and is discarded.
  const servesExpectedRepo =
    (receivedKey && receivedKey === expectedKey) || (resolvedKey && resolvedKey === expectedKey);

  if (receivedKey && expectedKey && !servesExpectedRepo) {
    return {
      available: false,
      // Re-keyed to the repository actually being served, so the stored block
      // can never point at someone else's numbers.
      repositoryKey: expectedKey,
      reason: 'cache_mismatch',
      message:
        'Stored clone statistics belong to a different repository, so they were discarded instead of being shown here.',
      httpStatus: null,
      githubMessage: null,
      totalClones: null,
      uniqueCloners: null,
      daily: [],
      windowDays: days,
      reportedDays: 0,
      filledDays: days,
      source: null,
    };
  }

  const base = {
    available: false,
    repositoryKey: expectedKey,
    reason: cloneStats?.reason || 'unavailable',
    message:
      cloneStats?.message ||
      'GitHub did not return clone statistics for this repository.',
    httpStatus: cloneStats?.httpStatus ?? null,
    githubMessage: cloneStats?.githubMessage ?? null,
    totalClones: null,
    uniqueCloners: null,
    daily: [],
    windowDays: days,
    reportedDays: 0,
    filledDays: days,
    source: null,
  };

  if (!cloneStats || cloneStats.available !== true) return base;

  const byDay = new Map();
  (cloneStats.clones || []).forEach((entry) => {
    if (!entry?.timestamp) return;
    const date = toDate(entry.timestamp);
    if (!isValidDate(date)) return;
    const key = dayKey(date);
    byDay.set(key, {
      date: key,
      label: shortDay(date),
      count: Number(entry.count) || 0,
      uniques: Number(entry.uniques) || 0,
      filled: false,
    });
  });

  // Always render a full 14-day window so quiet days stay visible, but mark the
  // entries GitHub never actually reported as `filled`.
  const today = startOfDay(new Date());
  const daily = [];
  let reportedDays = 0;

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(today.getTime() - i * DAY_MS);
    const key = date.toISOString().slice(0, 10);
    const reported = byDay.get(key);

    if (reported) {
      reportedDays += 1;
      daily.push(reported);
    } else {
      daily.push({ date: key, label: shortDay(date), count: 0, uniques: 0, filled: true });
    }
  }

  const summedCount = daily.reduce((sum, day) => sum + day.count, 0);
  const summedUniques = daily.reduce((sum, day) => sum + day.uniques, 0);

  return {
    available: true,
    repositoryKey: expectedKey,
    reason: null,
    message: null,
    httpStatus: 200,
    githubMessage: null,
    totalClones: Number.isFinite(cloneStats.count) ? Number(cloneStats.count) : summedCount,
    uniqueCloners: Number.isFinite(cloneStats.uniques) ? Number(cloneStats.uniques) : summedUniques,
    daily,
    windowDays: days,
    reportedDays,
    filledDays: days - reportedDays,
    source: 'GitHub repository traffic API · aggregate counts only',
  };
}

/* ------------------------- clone freshness -------------------------- */

/** Clone data older than this is shown as a historical snapshot, not live. */
export const CLONE_STALE_AFTER_HOURS = 24;

/**
 * Marks stored clone data as fresh or historical so the UI can say which it is.
 * Computed at read time (not stored) because staleness grows with time.
 */
export function describeCloneFreshness(cloneAnalytics, now = new Date()) {
  const payload = { ...(cloneAnalytics || {}) };
  const fetchedAt = payload.fetchedAt ? new Date(payload.fetchedAt) : null;

  if (!fetchedAt || Number.isNaN(fetchedAt.getTime())) {
    return { ...payload, fetchedAt: null, ageHours: null, isStale: false, hasData: payload.available === true };
  }

  const ageHours = Math.max(0, Math.round(((now - fetchedAt) / 3600000) * 10) / 10);

  return {
    ...payload,
    fetchedAt,
    ageHours,
    isStale: ageHours >= CLONE_STALE_AFTER_HOURS,
    hasData: payload.available === true,
  };
}

/* ------------------------- history trend --------------------------- */

/** Turns AnalysisHistory documents into a chart series. */
export function buildHistoryTrend(historyDocs = []) {
  const ordered = [...historyDocs].sort((a, b) => new Date(a.analyzedAt) - new Date(b.analyzedAt));
  return ordered.map((doc) => {
    const s = doc.snapshot || {};
    return {
      analyzedAt: doc.analyzedAt,
      label: new Date(doc.analyzedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
      stars: s.stars ?? 0,
      forks: s.forks ?? 0,
      openIssues: s.openIssues ?? 0,
      contributors: s.contributors ?? 0,
      commits30Days: s.commits30Days ?? 0,
      pulseScore: s.pulseScore ?? 0,
    };
  });
}

/* --------------------------- main entry ---------------------------- */

/**
 * Turns a raw GitHub payload into everything the analytics page needs.
 */
export function computeAnalytics(rawData, { previous = null, deltas = null } = {}) {
  const commitStats = computeCommitStats(rawData.recentCommits || []);

  const activity = computeIndicators({
    commitStats,
    contributors: rawData.contributors || [],
    recentCommits: rawData.recentCommits || [],
    openIssues: rawData.openIssues || 0,
    closedIssues: rawData.closedIssues || 0,
    lastPushedAt: rawData.lastPushedAt,
  });

  const chartData = {
    languageDistribution: rawData.languages || [],
    commitActivityDaily: buildDailyCommitActivity(commitStats.commits),
    commitActivityWeekly: buildWeeklyCommitActivity(commitStats.commits),
    contributorActivity: buildContributorActivity(commitStats.commits, rawData.contributors || []),
    issueStatus: buildIssueStatus(rawData.openIssues || 0, rawData.closedIssues || 0, rawData.issueLabels || []),
    activityTimeline: buildActivityTimeline(commitStats.commits, {
      createdOnGitHub: rawData.createdOnGitHub,
      lastPushedAt: rawData.lastPushedAt,
    }),
    starsForksTrend: [],
  };

  const insights = generateInsights({ ...rawData, chartData }, { commitStats, activity, deltas });

  return {
    commitStats: {
      total: commitStats.total,
      commits7Days: commitStats.commits7Days,
      commits30Days: commitStats.commits30Days,
      activeDays30: commitStats.activeDays30,
      firstCommitAt: commitStats.firstCommitAt,
      lastCommitAt: commitStats.lastCommitAt,
    },
    activity,
    chartData,
    insights,
    cloneAnalytics: buildCloneAnalytics(rawData.cloneStats, { repositoryKey: rawData.fullName || null }),
    analyzedFrom: rawData.fetchedAt || new Date().toISOString(),
  };
}

export default {
  computeAnalytics,
  computeCommitStats,
  computeIndicators,
  generateInsights,
  buildHistoryTrend,
  THRESHOLDS,
  WEIGHTS,
};