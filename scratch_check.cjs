require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
s.from('fit_cultural').select('*').limit(1).then(r => console.log('fit_cultural columns:', Object.keys(r.data[0] || {})));
