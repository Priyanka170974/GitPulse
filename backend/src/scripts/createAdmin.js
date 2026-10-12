/**
 * Creates an administrator account so the Admin Dashboard can be demoed.
 *
 *   npm run seed:admin
 *
 * Optional arguments:
 *   node src/scripts/createAdmin.js "Name" "email@example.com" "password123"
 *
 * When arguments are omitted the script prompts for them.
 * Nothing is hard-coded — the password is always supplied by the operator.
 */
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';

const rl = readline.createInterface({ input, output });

function question(prompt) {
  return rl.question(prompt);
}

async function run() {
  let [name, email, password] = process.argv.slice(2);

  if (!name) name = await question('Admin name: ');
  if (!email) email = await question('Admin email: ');
  if (!password) password = await question('Admin password (min 8 characters): ');

  name = String(name).trim();
  email = String(email).trim().toLowerCase();
  password = String(password);

  if (name.length < 2) throw new Error('Name must be at least 2 characters long.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error('That email address is not valid.');
  if (password.length < 8) throw new Error('Password must be at least 8 characters long.');

  await connectDB();

  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = 'admin';
    existing.password = password;
    await existing.save();
    console.log(`\n\x1b[33m● Existing account "${email}" was promoted to admin and its password was reset.\x1b[0m\n`);
  } else {
    const user = await User.create({ name, email, password, role: 'admin' });
    console.log(`\n\x1b[32m✔ Admin created: ${user.email} (role: ${user.role})\x1b[0m\n`);
  }

  await disconnectDB();
}

run()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error(`\n\x1b[41m✖ ${error.message}\x1b[0m\n`);
    try {
      await disconnectDB();
    } catch {
      /* ignore */
    }
    process.exit(1);
  })
  .finally(() => rl.close());