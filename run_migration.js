const fs = require('fs');
const { Client } = require('pg');

const connectionString = 'postgresql://postgres.dyoicvurrhuokfufsrwc:DaveAccounts%40254d@aws-1-eu-central-1.pooler.supabase.com:5432/postgres';

const client = new Client({
  connectionString,
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to database.');

    // Run migration
    const migrationSql = fs.readFileSync('./supabase/migrations/20260613105204_phase_2_generic_domain.sql', 'utf8');
    console.log('Running migration...');
    await client.query(migrationSql);
    console.log('Migration completed.');

    // Run seed
    const seedSql = fs.readFileSync('./supabase/seed.sql', 'utf8');
    console.log('Running seed...');
    await client.query(seedSql);
    console.log('Seed completed.');

  } catch (err) {
    console.error('Error executing query:', err);
  } finally {
    await client.end();
  }
}

run();
