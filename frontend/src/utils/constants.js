export const APP_NAME = 'GitPulse';
export const TAGLINE = 'Understand the Pulse of Your Code.';
export const APP_VERSION = '1.0.0';

export const SCORE_DISCLAIMER =
  'The GitPulse score and the High / Moderate / Low activity labels are calculated by GitPulse from real GitHub data. They are not official GitHub metrics or scores.';

export const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { to: '/repositories', label: 'My Repositories', icon: 'FolderGit2' },
  { to: '/compare', label: 'Compare', icon: 'GitCompareArrows' },
  { to: '/history', label: 'History', icon: 'History' },
  { to: '/about', label: 'About', icon: 'Compass' },
  { to: '/profile', label: 'Profile', icon: 'UserRound' },
];

export const DASHBOARD_STATS = [
  { key: 'repositories', label: 'Repositories analyzed', icon: 'FolderGit2', tone: 'iris' },
  { key: 'stars', label: 'Total stars', icon: 'Star', tone: 'amber' },
  { key: 'forks', label: 'Total forks', icon: 'GitFork', tone: 'aqua' },
  { key: 'contributors', label: 'Contributors tracked', icon: 'UsersRound', tone: 'mint' },
  { key: 'analyses', label: 'Analyses this week', icon: 'RefreshCw', tone: 'coral' },
];

export const TONE_GRADIENTS = {
  iris: 'from-iris-500 to-iris-400',
  aqua: 'from-aqua-400 to-aqua-500',
  mint: 'from-mint-400 to-mint-500',
  amber: 'from-amber-400 to-coral-400',
  coral: 'from-coral-400 to-coral-500',
};

export const REPO_SORTS = [
  { value: 'recent', label: 'Recently analyzed' },
  { value: 'stars', label: 'Most stars' },
  { value: 'forks', label: 'Most forks' },
  { value: 'contributors', label: 'Most contributors' },
  { value: 'issues', label: 'Most open issues' },
  { value: 'pulse', label: 'Highest pulse score' },
  { value: 'name', label: 'Name (A–Z)' },
];

export const ACTIVITY_FILTERS = [
  { value: 'all', label: 'All activity levels' },
  { value: 'high', label: 'High commit activity' },
  { value: 'moderate', label: 'Moderate commit activity' },
  { value: 'low', label: 'Low commit activity' },
];

export const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently analyzed' },
  { value: 'stars', label: 'Most stars' },
  { value: 'forks', label: 'Most forks' },
  { value: 'contributors', label: 'Most contributors' },
  { value: 'issues', label: 'Most open issues' },
  { value: 'pulse', label: 'Highest GitPulse score' },
  { value: 'name', label: 'Name (A–Z)' },
];

export const PIPELINE_STEPS = [
  {
    icon: 'Github',
    title: 'GitHub repository',
    text: 'You paste any public repository URL.',
  },
  {
    icon: 'Cloud',
    title: 'GitHub REST API',
    text: 'The backend fetches stars, languages, commits, contributors and issues.',
  },
  {
    icon: 'Activity',
    title: 'GitPulse analytics',
    text: 'analyticsService turns raw data into indicators, insights and chart series.',
  },
  {
    icon: 'Database',
    title: 'MongoDB Atlas',
    text: 'Mongoose stores the repository plus an immutable analysis snapshot.',
  },
  {
    icon: 'LayoutDashboard',
    title: 'Interactive dashboard',
    text: 'React + Recharts render the pulse in your browser.',
  },
];

export const FEATURES = [
  {
    icon: 'Radar',
    title: 'Repository Pulse',
    text: 'A composite GitPulse score built from commit rhythm, contributor spread, issue resolution and update freshness.',
    tone: 'iris',
  },
  {
    icon: 'LineChart',
    title: 'Commit waveform',
    text: 'Daily and weekly commit activity derived from real commit timestamps — zeros included, so gaps stay visible.',
    tone: 'aqua',
  },
  {
    icon: 'Languages',
    title: 'Language distribution',
    text: 'Byte-level language data straight from the GitHub languages endpoint, rendered as a donut plus a ranked list.',
    tone: 'coral',
  },
  {
    icon: 'UsersRound',
    title: 'Contributor map',
    text: 'See who is actually pushing the project and how the workload is distributed across contributors.',
    tone: 'mint',
  },
  {
    icon: 'History',
    title: 'Analysis history',
    text: 'Every analysis and re-analysis writes a snapshot, so you can watch stars, forks and issues move over time.',
    tone: 'amber',
  },
  {
    icon: 'GitCompareArrows',
    title: 'Side-by-side compare',
    text: 'Pick two saved repositories and compare factual metrics. GitPulse never decides which one is better.',
    tone: 'iris',
  },
  {
    icon: 'RefreshCw',
    title: 'True re-analysis',
    text: 'Re-analyze performs a brand new GitHub API call and stores a new snapshot — it never re-sends cached data.',
    tone: 'aqua',
  },
  {
    icon: 'ShieldCheck',
    title: 'Private library',
    text: 'Every query is scoped to the signed-in user, so one account can never read another account\u2019s repositories.',
    tone: 'coral',
  },
];

export const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Sign in',
    text: 'Create an account. Passwords are hashed with bcrypt and your session is a signed JWT.',
  },
  {
    step: '02',
    title: 'Paste a URL',
    text: 'Any public GitHub repository — yours, a friend\u2019s, or something open source you admire.',
  },
  {
    step: '03',
    title: 'GitPulse analyzes',
    text: 'The Node backend calls the GitHub REST API, computes indicators and stores everything in MongoDB Atlas.',
  },
  {
    step: '04',
    title: 'Read the pulse',
    text: 'Charts, insights and history are rendered instantly — and you can re-analyze whenever you want fresh data.',
  },
];

export const TECH_STACK = [
  { name: 'React 18', role: 'Component UI + hooks', icon: 'Atom', tone: 'aqua' },
  { name: 'Vite', role: 'Frontend build tool', icon: 'Zap', tone: 'amber' },
  { name: 'Tailwind CSS', role: 'Design system', icon: 'Palette', tone: 'iris' },
  { name: 'React Router', role: 'Client-side routing', icon: 'Route', tone: 'coral' },
  { name: 'Axios', role: 'HTTP client for the REST API', icon: 'Send', tone: 'aqua' },
  { name: 'Recharts', role: 'Interactive charts', icon: 'BarChart3', tone: 'mint' },
  { name: 'Lucide', role: 'Icon set', icon: 'Sparkles', tone: 'amber' },
  { name: 'Node.js', role: 'Runtime for the API', icon: 'Server', tone: 'mint' },
  { name: 'Express', role: 'REST routing layer', icon: 'Package', tone: 'iris' },
  { name: 'JWT + bcryptjs', role: 'Auth & password hashing', icon: 'KeyRound', tone: 'coral' },
  { name: 'Mongoose', role: 'MongoDB object modelling', icon: 'Database', tone: 'mint' },
  { name: 'MongoDB Atlas', role: 'Cloud database', icon: 'Cloud', tone: 'aqua' },
];

export const ARCHITECTURE_FLOW = [
  'User (browser)',
  'React + Tailwind UI',
  'Axios → REST API',
  'Express route',
  'JWT middleware',
  'Controller',
  'GitHub service',
  'GitHub REST API',
  'Analytics service',
  'Mongoose → MongoDB Atlas',
  'JSON response',
  'Recharts dashboard',
];

export const FUTURE_IMPROVEMENTS = [
  'Scheduled background re-analysis with a job queue so snapshots accumulate automatically.',
  'Compare more than two repositories at once and export the comparison as a PNG or CSV.',
  'Team workspaces where several members share one repository library with roles.',
  'Commit sentiment and code-review indicators derived from pull request metadata.',
  'Offline-friendly PWA mode with cached analytics for the last viewed repositories.',
  'Public share links that generate a read-only analytics page for a single repository.',
];

export default {
  APP_NAME,
  TAGLINE,
  NAV_LINKS,
  PIPELINE_STEPS,
  FEATURES,
  HOW_IT_WORKS,
  TECH_STACK,
};