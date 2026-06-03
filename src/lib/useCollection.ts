import { useState, useEffect } from 'react';
import { supabase } from './supabase';

export function useCollection<T>(collectionName: string, defaultData: T[]) {
  const localKey = `corporate_cheerleader_${collectionName}`;
  
  const [data, setData] = useState<T[]>(() => {
    const saved = localStorage.getItem(localKey);
    if (saved) {
      try { 
        return JSON.parse(saved); 
      } catch (e) { 
        return defaultData; 
      }
    }
    return defaultData;
  });

  const [isSyncing, setIsSyncing] = useState(false);

  const updateData = async (newData: T[] | ((prev: T[]) => T[])) => {
    // Allow function updates similar to setState
    const resolvedData = typeof newData === 'function' ? (newData as Function)(data) : newData;
    
    setData(resolvedData);
    localStorage.setItem(localKey, JSON.stringify(resolvedData));
    
    if (navigator.onLine) {
      setIsSyncing(true);
      try {
        await supabase
          .from('app_collections')
          .upsert({ colecao: collectionName, dados: resolvedData }, { onConflict: 'colecao' });
      } catch (e) {
        console.error(`Falha ao sincronizar ${collectionName}`, e);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  useEffect(() => {
    const fetchFromCloud = async () => {
      if (!navigator.onLine) return;
      setIsSyncing(true);
      try {
        const { data: cloudData, error } = await supabase
          .from('app_collections')
          .select('dados')
          .eq('colecao', collectionName)
          .single();
          
        if (!error && cloudData && cloudData.dados) {
          // Se a nuvem tem dados, usamos eles
          setData(cloudData.dados as T[]);
          localStorage.setItem(localKey, JSON.stringify(cloudData.dados));
        } else if (error && error.code === 'PGRST116') {
          // PGRST116 = Não encontrou linha. A nuvem está vazia.
          // Vamos fazer o upload dos dados locais (Migração)
          const saved = localStorage.getItem(localKey);
          if (saved) {
            const local = JSON.parse(saved);
            if (local && local.length > 0) {
               await supabase.from('app_collections').upsert({ colecao: collectionName, dados: local }, { onConflict: 'colecao' });
            }
          }
        }
      } catch (e) {
        console.error(`Erro ao buscar ${collectionName} da nuvem:`, e);
      } finally {
        setIsSyncing(false);
      }
    };

    fetchFromCloud();

    const handleOnline = () => {
      // Quando a internet voltar, primeiro tenta puxar da nuvem
      fetchFromCloud();
      
      // E também força o upload do que tem no porta-malas local
      const saved = localStorage.getItem(localKey);
      if (saved) {
         supabase.from('app_collections').upsert({ colecao: collectionName, dados: JSON.parse(saved) }, { onConflict: 'colecao' });
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [collectionName]);

  return { data, updateData, isSyncing };
}
