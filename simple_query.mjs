import { createClient } from '@supabase/supabase-js';

const url = "https://xucfprdbduvrjslasyrt.supabase.co";
const key = "sb_publishable_JhFa9TjXwOd2gy5-g2_6Gw_vwY2AqmD";

const supabase = createClient(url, key);

try {
  const { data, error } = await supabase.from('funcionarios').select('id, nome, email, cargo, departamento').eq('id', '64c2f083-4cbe-4b4c-ac63-2a3f9da3f439');
  console.log('Result:', JSON.stringify(data), error);
} catch (e) {
  console.error('Catch error:', e);
}
