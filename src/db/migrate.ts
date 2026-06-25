import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './index';
import * as path from 'path';

console.log('Running database migrations...');

try {
  migrate(db, { migrationsFolder: path.join(__dirname, '../../drizzle') });
  console.log('Migrations completed successfully.');
  process.exit(0);
} catch (error) {
  console.error('Database migration failed:', error);
  process.exit(1);
}
