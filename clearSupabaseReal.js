import { createClient } from '@supabase/supabase-js';

const url = 'https://xucfprdbduvrjslasyrt.supabase.co';
const key = 'sb_publishable_JhFa9TjXwOd2gy5-g2_6Gw_vwY2AqmD';

const supabase = createClient(url, key);

async function run() {
  try {
    console.log('Zerando o banco de dados...');
    const { error: delError } = await supabase.from('medicoes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delError) console.error(delError);
    else console.log('SUCESSO! Banco limpo.');
  } catch (err) {
    console.error(err);
  }
}
run();
