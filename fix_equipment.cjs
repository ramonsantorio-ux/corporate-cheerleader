const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jysqjlynghclhckrhlgq.supabase.co'; // Using placeholder or we can read it from .env
require('dotenv').config({ path: '.env.local' });

async function fixDB() {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  
  const { data, error } = await supabase
    .from('events')
    .update({ equipment: 'Mini Carregadeira' })
    .eq('equipment', 'Mini Pá Carregadeira');
    
  if (error) console.error('Error updating DB:', error);
  else console.log('DB updated successfully!');
}

fixDB();
