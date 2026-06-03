import { createClient } from '@supabase/supabase-js';

const url = 'https://xucfprdbduvrjslasyrt.supabase.co';
const key = 'sb_publishable_JhFa9TjXwOd2gy5-g2_6Gw_vwY2AqmD';
const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.from('funcionarios').select('*');
  console.log('Funcionarios:', JSON.stringify(data, null, 2));
}
run();
