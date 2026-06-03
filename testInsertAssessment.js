import { createClient } from '@supabase/supabase-js';

const url = 'https://xucfprdbduvrjslasyrt.supabase.co';
const key = 'sb_publishable_JhFa9TjXwOd2gy5-g2_6Gw_vwY2AqmD';

const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase.from('assessment_results').insert({
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    type: 'disc',
    result: '{}'
  }).select();
  console.log('Error:', error);
}
run();
