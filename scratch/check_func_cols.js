import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vyfswptkscedqamxlluu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5ZnN3cHRrc2NlZHFhbXhsbHV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzODk2NjcsImV4cCI6MjA1NTk2NTY2N30.rQInM38-GjC2xlySszHk1V-0EStmO7vS-S-c-gJ7z5s';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('funcionarios').select('*').limit(1);
  if (error) console.error(error);
  else console.log('COLUNAS FUNCIONARIOS:', Object.keys(data[0] || {}));
}

check();
