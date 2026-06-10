import fs from 'fs';
const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)="?(.*?)"?$/);
  if (match) env[match[1]] = match[2];
});

async function run() {
  const url = `${env.VITE_SUPABASE_URL}/rest/v1/treinamentos_ssma?select=*&limit=1`;
  const response = await fetch(url, {
    headers: {
      'apikey': env.VITE_SUPABASE_PUBLISHABLE_KEY,
      'Authorization': `Bearer ${env.VITE_SUPABASE_PUBLISHABLE_KEY}`
    }
  });
  console.log('Status:', response.status);
  console.log('Body:', await response.text());
}
run();
