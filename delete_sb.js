const supabaseUrl = 'https://xucfprdbduvrjslasyrt.supabase.co';
const supabaseAnonKey = 'sb_publishable_JhFa9TjXwOd2gy5-g2_6Gw_vwY2AqmD';

fetch(`${supabaseUrl}/rest/v1/medicoes?id=eq.5f140849-11f9-4660-abe1-a9208a197fbb`, {
  method: 'DELETE',
  headers: {
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${supabaseAnonKey}`
  }
}).then(r => {
  console.log('Status:', r.status);
});
