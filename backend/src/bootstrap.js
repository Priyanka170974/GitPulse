/**
 * GitPulse API — startup bootstrap.
 * ------------------------------------------------------------------
 * This is the file the npm scripts start (src/bootstrap.js).
 *
 * It exists because of ES module evaluation order:
 * every `import` statement at the top of a module is executed BEFORE the
 * body of that module runs. So a plain `import './server.js'` would already
 * load Mongoose and the whole app before we get a chance to touch the DNS
 * settings that MongoDB Atlas SRV lookups depend on.
 *
 * The fix is a tiny two-step entry point:
 *   1. configure the Node.js DNS resolver
 *   2. dynamically import the real server
 *
 * Because the import is dynamic, step 1 is guaranteed to finish first.
 */

import { configureDns } from './config/dns.js';

// Step 1 — must happen before Mongoose resolves _mongodb._tcp.<cluster>
configureDns();

// Step 2 — now it is safe to load the application and its database driver
await import('./server.js');