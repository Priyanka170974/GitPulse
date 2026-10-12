import {
  Activity,
  Atom,
  BarChart3,
  Cloud,
  Compass,
  Database,
  FolderGit2,
  GitCompareArrows,
  History,
  House,
  KeyRound,
  Languages,
  LayoutDashboard,
  LineChart,
  Package,
  Palette,
  Radar,
  RefreshCw,
  Route,
  Send,
  Server,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  Zap,
} from 'lucide-react';

/* Explicit icon maps keep the bundle tree-shakeable (no namespace imports). */

export const FEATURE_ICONS = {
  Radar,
  LineChart,
  Languages,
  UsersRound,
  History,
  GitCompareArrows,
  RefreshCw,
  ShieldCheck,
};

export const TECH_ICONS = {
  Atom,
  Zap,
  Palette,
  Route,
  Send,
  BarChart3,
  Sparkles,
  Server,
  Package,
  KeyRound,
  Database,
  Cloud,
};

export const NAV_ICONS = {
  LayoutDashboard,
  FolderGit2,
  GitCompareArrows,
  History,
  Compass,
  UserRound,
  ShieldCheck,
  House,
};

export const PIPELINE_ICONS = {
  Cloud,
  Activity,
  Database,
  LayoutDashboard,
};

export default { FEATURE_ICONS, TECH_ICONS, NAV_ICONS, PIPELINE_ICONS };