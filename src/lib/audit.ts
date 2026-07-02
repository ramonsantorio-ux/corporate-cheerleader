/**
 * Utilitário de Audit Log — registra ações administrativas na tabela audit_log.
 *
 * Estrutura da tabela:
 *   id, action, table_name, record_id, user_id, old_data, new_data, created_at
 */
import { supabase } from '@/integrations/supabase/client';

export type AuditAction =
  | 'user_created'
  | 'user_deleted'
  | 'user_updated'
  | 'user_banned'
  | 'user_unbanned'
  | 'password_changed'
  | 'permissions_updated'
  | 'profile_assigned';

interface AuditEntry {
  action: AuditAction;
  table_name?: string;
  record_id?: string;
  old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
}

/**
 * Registra uma entrada no audit_log.
 * Falhas são silenciosas — nunca bloqueiam a ação principal.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('audit_log').insert({
      action: entry.action,
      table_name: entry.table_name ?? 'profiles',
      record_id: entry.record_id ?? null,
      user_id: user.id,
      old_data: entry.old_data ?? null,
      new_data: entry.new_data ?? null,
    });
  } catch {
    // Log silencioso — nunca interrompe o fluxo principal
    console.warn('[audit] Falha ao registrar entrada:', entry.action);
  }
}
