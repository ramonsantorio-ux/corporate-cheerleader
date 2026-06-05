const fs = require('fs');

async function fixDb() {
  const env = fs.readFileSync('.env', 'utf8');
  const urlMatch = env.match(/VITE_SUPABASE_URL="([^"]+)"/);
  const keyMatch = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY="([^"]+)"/);
  
  if (!urlMatch || !keyMatch) {
    console.error("Missing URL or KEY");
    return;
  }
  
  const url = urlMatch[1];
  const key = keyMatch[1];
  
  // Also check if there's "MINI PÁ CARREGADEIRA"
  const fetchUrl = `${url}/rest/v1/events?equipment=eq.MINI%20P%C3%81%20CARREGADEIRA`;
  
  console.log("Fetching: " + fetchUrl);
  
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
    
    if (!res.ok) {
      console.log(res.status, await res.text());
    } else {
      const data = await res.json();
      console.log(`Updated ${data.length} records.`);
    }
  } catch (err) {
    console.error(err);
  }
}

fixDb();
