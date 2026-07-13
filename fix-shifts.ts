import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const envVars: Record<string, string> = {};
envFile.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value.length) {
    envVars[key.trim()] = value.join('=').trim().replace(/^"|"$/g, '');
  }
});

const supabaseUrl = envVars['VITE_SUPABASE_URL'];
const supabaseKey = envVars['VITE_SUPABASE_PUBLISHABLE_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function standardizeShifts() {
  console.log("Fetching all events...");
  const { data: events, error } = await supabase.from('events').select('id, shift');

  if (error) {
    console.error("Error fetching events:", error);
    return;
  }

  console.log(`Found ${events.length} events. Formatting shifts...`);
  
  let updatedCount = 0;

  for (const ev of events) {
    if (!ev.shift) continue;

    const original = ev.shift;
    let formatted = original.toUpperCase().replace(/\s*-\s*/g, ' ')
                          .replace('A DIA', 'A Dia')
                          .replace('A NOITE', 'A Noite')
                          .replace('B DIA', 'B Dia')
                          .replace('B NOITE', 'B Noite')
                          .trim();

    if (original !== formatted) {
      console.log(`Updating event ${ev.id}: "${original}" -> "${formatted}"`);
      const { error: updateError } = await supabase
        .from('events')
        .update({ shift: formatted })
        .eq('id', ev.id);

      if (updateError) {
        console.error(`Error updating event ${ev.id}:`, updateError);
      } else {
        updatedCount++;
      }
    }
  }

  console.log(`Finished! Updated ${updatedCount} events.`);
}

standardizeShifts();
