import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
let url = '';
let key = '';
envFile.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].replace(/"/g, '').trim();
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].replace(/"/g, '').trim();
});

const supabase = createClient(url, key);

async function run() {
  const id = '64c2f083-4cbe-4b4c-ac63-2a3f9da3f439';
  console.log('--- Buscando funcionário ID:', id);
  const { data: func, error } = await supabase.from('funcionarios').select('*').eq('id', id);
  console.log('Funcionario:', JSON.stringify(func, null, 2), error);

  console.log('--- Buscando em user_activities:');
  const { data: acts } = await supabase.from('user_activities').select('*').order('created_at', { ascending: false }).limit(20);
  console.log('Recent user_activities:', JSON.stringify(acts, null, 2));

  console.log('--- Buscando em audit_logs / logs:');
  try {
    const { data: logs } = await supabase.from('audit_logs').select('*').limit(10);
    console.log('Audit logs:', logs);
  } catch(e) {
    console.log('No audit_logs table');
  }
}

run();
