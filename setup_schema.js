const { Client } = require('pg');

const connectionString = 'postgresql://postgres.dyoicvurrhuokfufsrwc:DaveAccounts%40254d@aws-1-eu-central-1.pooler.supabase.com:5432/postgres';

const client = new Client({
  connectionString,
});

const alterTableQuery = `
ALTER TABLE product
ADD COLUMN IF NOT EXISTS "STATUS" VARCHAR(20) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS "UOM" VARCHAR(20) DEFAULT 'pcs',
ADD COLUMN IF NOT EXISTS "REORDER_THRESHOLD" INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS "COST_PRICE" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "BARCODE" VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS "IMAGE_URL" VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS "TAX_RATE" NUMERIC DEFAULT 16.0,
ADD COLUMN IF NOT EXISTS "BRAND" VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS "WEIGHT" VARCHAR(50) DEFAULT NULL;
`;

async function run() {
  try {
    await client.connect();
    console.log('Connected to database.');
    await client.query(alterTableQuery);
    console.log('Successfully altered product table.');
  } catch (err) {
    console.error('Error executing query:', err);
  } finally {
    await client.end();
  }
}

run();
