import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://awohkszkuffzectgmwyh.supabase.co';
const supabaseAnonKey = 'sb_publishable_efFiFYbWsQZCW37mF9ne-Q_IulR1-CH';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
