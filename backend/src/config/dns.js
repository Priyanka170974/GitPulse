import dns from 'node:dns';
import { config } from './env.js';

/**
 * Node.js DNS configuration for MongoDB Atlas SRV lookups.
 * ------------------------------------------------------------------
 * WHY THIS EXISTS
 * A `mongodb+srv://` connection string makes the MongoDB Node driver call
 * `dns.resolveSrv("_mongodb._tcp.<cluster>.mongodb.net")`. That call goes
 * through Node's c-ares resolver, which uses the *system* DNS servers.
 * On some networks (router/ISP DNS, campus Wi-Fi, corporate DNS) those
 * servers refuse or drop SRV queries for Atlas and the connection dies with:
 *
 *     querySrv ECONNREFUSED _mongodb._tcp.cluster0.xxxxx.mongodb.net
 *
 * Pointing the c-ares resolver at public recursive resolvers fixes it.
 *
 * NOTE: `dns.setServers()` only affects the c-ares family
 * (resolveSrv / resolveTxt / resolveMx / ...). It does NOT touch
 * `dns.lookup()`, which is what the OS uses to connect to the shard hostnames
 * returned by the SRV record — and that part already works.
 *
 * This is also why `--dns-result-order=ipv4first` does NOT help here:
 * that flag only changes the *ordering* of already-resolved addresses, while
 * the SRV query itself is being refused.
 */

/** Used when DNS_SERVERS is not set in .env. */
const FALLBACK_DNS_SERVERS = ['8.8.8.8', '1.1.1.1'];

/** Values that mean "leave the operating system resolver alone". */
const DISABLE_VALUES = new Set(['system', 'off', 'none', 'default', 'false', '0']);

/**
 * Decides which DNS servers to use.
 * @returns {string[]|null} list of servers, or null to keep the OS resolver
 */
export function resolveDnsServers(rawValue = config.dnsServers) {
  const raw = String(rawValue || '').trim();

  if (!raw) return [...FALLBACK_DNS_SERVERS];
  if (DISABLE_VALUES.has(raw.toLowerCase())) return null;

  const servers = raw
    .split(',')
    .map((server) => server.trim())
    .filter(Boolean);

  return servers.length ? servers : [...FALLBACK_DNS_SERVERS];
}

/** Only an IP (optionally with a port) is accepted — avoids silently bad values. */
function isValidServer(entry) {
  return /^\d{1,3}(\.\d{1,3}){3}(:\d{1,5})?$/.test(entry);
}

let applied = false;

/**
 * Applies the DNS configuration. Safe to call more than once.
 * @returns {{applied: boolean, servers: string[]|null}}
 */
export function configureDns() {
  if (applied) return { applied: true, servers: dns.getServers() };

  const servers = resolveDnsServers();

  if (!servers) {
    console.log('\x1b[90m⚙ DNS: using the operating system resolver (DNS_SERVERS disabled)\x1b[0m');
    applied = true;
    return { applied: false, servers: null };
  }

  const valid = servers.filter(isValidServer);
  if (valid.length === 0) {
    console.warn('\x1b[33m⚠ DNS_SERVERS is not a valid IP list — using the system resolver.\x1b[0m');
    applied = true;
    return { applied: false, servers: null };
  }

  try {
    dns.setServers(valid);
    console.log(`\x1b[90m⚙ DNS: custom resolvers active → ${valid.join(', ')}\x1b[0m`);
    applied = true;
    return { applied: true, servers: valid };
  } catch (error) {
    console.warn(`\x1b[33m⚠ Could not set custom DNS servers: ${error.message}\x1b[0m`);
    return { applied: false, servers: null };
  }
}

/**
 * Small diagnostic helper used by the health endpoint / troubleshooting.
 */
export function dnsStatus() {
  return {
    servers: dns.getServers(),
    srvSupported: true,
  };
}

export default { configureDns, resolveDnsServers, dnsStatus, FALLBACK_DNS_SERVERS };