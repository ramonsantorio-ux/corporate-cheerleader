// Reexporta a instância única do Supabase para evitar múltiplas instâncias GoTrueClient
// (que causam o warning "Multiple GoTrueClient instances detected")
export { supabase } from '@/integrations/supabase/client';
