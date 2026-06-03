import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xucfprdbduvrjslasyrt.supabase.co';
const supabaseAnonKey = 'sb_publishable_JhFa9TjXwOd2gy5-g2_6Gw_vwY2AqmD';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
