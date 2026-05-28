const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dyoicvurrhuokfufsrwc.supabase.co';
const supabaseKey = 'sb_publishable_4Xb4nVQw7LhlRU8xfb1jcQ_oMw_4WwB';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  console.log('Testing insert...');
  const payload = {
    FIRST_NAME: 'Test',
    LAST_NAME: 'User',
    GENDER: 'Male',
    EMAIL: 'test@example.com',
    PHONE_NUMBER: '1234567890',
  };
  
  const { data, error } = await supabase.from('employee').insert([payload]);
  if (error) {
    console.error('Insert Error:', error);
  } else {
    console.log('Insert Success:', data);
  }
}

testInsert();
