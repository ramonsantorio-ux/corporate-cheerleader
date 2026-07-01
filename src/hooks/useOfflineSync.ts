import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Guarda chaves que já tentamos sincronizar na sessão atual para não causar loop
const attemptedKeys = new Set<string>();

export function useOfflineSync() {
  useEffect(() => {
    const syncData = async () => {
      if (!navigator.onLine) return;

      // SEGURANÇA: valida a sessão ativa antes de qualquer operação
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const keys = Object.keys(localStorage);
      const assessmentKeys = keys.filter(k => 
        k.startsWith('disc_') || 
        k.startsWith('mbti_') || 
        k.startsWith('bigfive_') || 
        k.startsWith('gallup_') || 
        k.startsWith('lpi_')
      );

      for (const key of assessmentKeys) {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          
          let data;
          try {
             data = JSON.parse(raw);
          } catch (e) {
             continue; // ignore invalid JSON
          }
          
          // Se já foi sincronizado com sucesso, pula
          if (data._synced) continue;

          // Se já tentou nessa sessão (e falhou), pula para não inundar o Supabase de erros RLS
          if (attemptedKeys.has(key)) continue;

          // O formato da chave é tipo_userId, ex: disc_123e4567-e89b-12d3...
          const firstUnderscoreIndex = key.indexOf('_');
          if (firstUnderscoreIndex === -1) continue;
          
          const type = key.substring(0, firstUnderscoreIndex);
          
          // SEGURANÇA: usa sempre o user_id da sessão autenticada,
          // nunca extrai da chave do localStorage (poderia ser manipulado)
          const dataToSync = { ...data };
          delete dataToSync._synced;

          attemptedKeys.add(key);

          const { error } = await supabase.from('assessment_results').insert({
            user_id: user.id,
            type: type,
            result_data: dataToSync
          });

          if (!error) {
            // Sincronizou com sucesso!
            data._synced = true;
            localStorage.setItem(key, JSON.stringify(data));
            console.log(`[Sync] ${key} sincronizado com a nuvem com sucesso.`);
          } else {
            console.warn(`[Sync] Falha ao sincronizar ${type}:`, error.message);
          }
        } catch (e) {
          console.error(`[Sync] Erro inesperado:`, e);
        }
      }
    };

    // Dá um tempinho para a aplicação carregar antes de rodar o sync pesado no fundo
    const timer = setTimeout(syncData, 3000);
    
    // Tenta sincronizar sempre que a conexão de rede voltar
    window.addEventListener('online', syncData);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('online', syncData);
    };
  }, []);
}
