/**
 * DNS / connectivity diagnostic for MongoDB Atlas.
 *
 *   npm run check:dns
 *
 * It never prints credentials — only the cluster hostname is shown.
 */
import dns from 'node:dns/promises';
import { config } from '../config/env.js';
import { configureDns } from '../config/dns.js';

const c = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  grey: '\x1b[90m',
  reset: '\x1b[0m',
};

function clusterHost(uri = '') {
  try {
    const url = new URL(uri.replace('mongodb+srv://', 'https://').replace('mongodb://', 'https://'));
    return url.hostname;
  } catch {
    return null;
  }
}

const isSrv = config.mongoUri.startsWith('mongodb+srv://');
const host = clusterHost(config.mongoUri);

console.log(`\n${c.cyan}GitPulse — DNS check${c.reset}`);
console.log(`  connection style : ${isSrv ? 'mongodb+srv (SRV lookup required)' : 'mongodb (direct host)'}`);
console.log(`  cluster host     : ${host || c.red + 'could not be parsed from MONGO_URI' + c.reset}`);
console.log(`  dns (before)     : ${dns.getServers().join(', ')}`);

if (!isSrv || !host) {
  console.log(`\n${c.yellow}Nothing to check — this connection string does not use SRV.\n${c.reset}`);
  process.exit(0);
}

const recordName = `_mongodb._tcp.${host}`;

async function attempt(label, resolver) {
  const started = Date.now();
  try {
    const records = await resolver(recordName);
    const ms = Date.now() - started;
    console.log(
      `  ${c.green}PASS${c.reset} ${label}: ${records.length} SRV record(s) in ${ms}ms → ${records
        .map((r) => `${r.name}:${r.port}`)
        .join(', ')}`,
    );
    return true;
  } catch (error) {
    const ms = Date.now() - started;
    console.log(`  ${c.red}FAIL${c.reset} ${label}: ${error.code || error.message} (${ms}ms)`);
    return false;
  }
}

console.log('');
const before = await attempt('system resolver', (name) => dns.resolveSrv(name));

const { applied, servers } = configureDns();
console.log(`  ${c.grey}configureDns() applied=${applied}${servers ? ` → ${servers.join(', ')}` : ''}${c.reset}`);
console.log(`  dns (after)      : ${dns.getServers().join(', ')}\n`);

const after = await attempt('configured resolver', (name) => dns.resolveSrv(name));

console.log('');
if (after) {
  console.log(`${c.green}✔ SRV resolution works with the configured resolver — Atlas should connect.${c.reset}\n`);
  process.exit(0);
}

console.log(`${c.red}✖ SRV resolution still fails even with the custom resolver.${c.reset}`);
console.log(`  ${c.grey}Next steps:${c.reset}`);
console.log(`   1. Try other public resolvers, e.g. DNS_SERVERS=1.1.1.1,9.9.9.9 npm start`);
console.log(`   2. Check that DNS/NET traffic to port 53 (UDP+TCP) is allowed`);
console.log(`   3. Confirm the cluster exists: nslookup -type=SRV ${recordName} 8.8.8.8\n`);
process.exit(1);