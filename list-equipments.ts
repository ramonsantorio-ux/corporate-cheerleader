import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const envVars: Record<string, string> = {};
envFile.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value.length > 0) {
    envVars[key.trim()] = value.join('=').trim().replace(/['"]/g, '');
  }
});

const supabaseUrl = envVars['VITE_SUPABASE_URL'];
const supabaseKey = envVars['VITE_SUPABASE_PUBLISHABLE_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: events, error } = await supabase.from('events').select('equipment');
  if (error) {
    console.error("Error fetching events:", error);
    return;
  }

  const distinct = new Set<string>();
  for (const ev of events) {
    if (ev.equipment) {
      distinct.add(ev.equipment);
    }
  }

  console.log("Distinct Equipments:");
  distinct.forEach(e => console.log(`"${e}"`));
}

run();
