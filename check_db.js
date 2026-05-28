const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dyoicvurrhuokfufsrwc.supabase.co';
const supabaseKey = 'sb_publishable_4Xb4nVQw7LhlRU8xfb1jcQ_oMw_4WwB';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCategories() {
  console.log('Fetching categories...');
  const { data, error } = await supabase.from('category').select('*');
  if (error) {
    console.error('Error fetching categories:', error);
  } else {
    console.log('Categories found:', data.length);
    console.log(data);
  }
}

checkCategories();
