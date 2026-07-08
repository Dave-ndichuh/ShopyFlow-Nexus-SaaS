const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.dyoicvurrhuokfufsrwc:DaveAccounts%40254d@aws-1-eu-central-1.pooler.supabase.com:5432/postgres' });
async function check() {
  await client.connect();
  const res = await client.query(`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name IN ('invoices', 'services', 'product', 'workspaces')
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}
check();
