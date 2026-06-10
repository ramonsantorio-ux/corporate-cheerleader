require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function test() {
  console.log('Testing connection to Supabase...');
  const { data, error } = await supabase.from('treinamentos_ssma').select('*').limit(1);
  if (error) {
    console.error('Error fetching treinamentos_ssma:', error);
  } else {
    console.log('Success! Data:', data);
  }
}

test();
