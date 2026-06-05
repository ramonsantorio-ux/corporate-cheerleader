const fs = require('fs');

async function fixDb() {
  const env = fs.readFileSync('.env', 'utf8');
  const urlMatch = env.match(/VITE_SUPABASE_URL="([^"]+)"/);
  const keyMatch = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY="([^"]+)"/);
  
  if (!urlMatch || !keyMatch) return;
  const url = urlMatch[1];
  const key = keyMatch[1];
  
  // ilike %PÁ CARREGADEIRA%
  const fetchUrl = `${url}/rest/v1/events?equipment=ilike.*P%C3%81%20CARREGADEIRA*`;
  
  try {
    const res = await fetch(fetchUrl, {
      method: 'PATCH',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ equipment: 'MINI CARREGADEIRA' })
    });
    const data = await res.json();
    console.log(`Updated ${data.length} records.`);
  } catch (err) {
    console.error(err);
  }
}

fixDb();
