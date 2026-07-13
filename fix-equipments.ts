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
  const { data: events, error } = await supabase.from('events').select('*');
  if (error) {
    console.error("Error fetching events:", error);
    return;
  }

  let updatedCount = 0;
  for (const ev of events) {
    if (ev.equipment && ev.equipment !== 'NA' && ev.equipment !== 'N/A') {
      const equipRaw = ev.equipment;
      const normalized = equipRaw.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, ' ');
      
      if (equipRaw !== normalized) {
        console.log(`Updating "${equipRaw}" -> "${normalized}"`);
        const { error: upError } = await supabase.from('events').update({ equipment: normalized }).eq('id', ev.id);
        if (upError) {
          console.error(`Error updating id ${ev.id}:`, upError);
        } else {
          updatedCount++;
        }
      }
    }
  }

  console.log(`Done. Updated ${updatedCount} events.`);
}

run();
