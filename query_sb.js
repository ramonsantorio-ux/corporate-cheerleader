const supabaseUrl = 'https://xucfprdbduvrjslasyrt.supabase.co';
const supabaseAnonKey = 'sb_publishable_JhFa9TjXwOd2gy5-g2_6Gw_vwY2AqmD';

fetch(`${supabaseUrl}/rest/v1/medicoes?select=*`, {
  headers: {
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${supabaseAnonKey}`
  }
}).then(r => r.json()).then(data => {
  const jun = data.find(d => d.mes === 'Jun/2026');
  const mai = data.find(d => d.mes === 'Mai/2026');
  console.log('Jun/2026:', JSON.stringify(jun, null, 2));
  console.log('Mai/2026:', JSON.stringify(mai, null, 2));
});
