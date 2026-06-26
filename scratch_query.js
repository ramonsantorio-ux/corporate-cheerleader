import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env manually
const envPath = path.resolve('.env');
let supabaseUrl = '';
let supabaseKey = '';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
  });
}

const s = createClient(supabaseUrl, supabaseKey);
s.from('competencies').select('*').then(r => console.log('Competencies:', r.data));
s.from('evaluation_cycles').select('*').then(r => console.log('Cycles:', r.data));
