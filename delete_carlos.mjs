import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env', 'utf-8');
let url = '';
let key = '';
envFile.split('\n').forEach(line => {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].replace(/"/g, '').trim();
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].replace(/"/g, '').trim();
});

const supabase = createClient(url, key);

async function deleteCarlos() {
  const id = '64c2f083-4cbe-4b4c-ac63-2a3f9da3f439';
  console.log('Autenticando...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'ramon.leonard@busato.com.br',
    password: 'busato123'
  });

  if (authError) {
    console.error('Erro ao autenticar:', authError.message);
    return;
  }

  console.log('Autenticado com sucesso como:', authData.user?.email);

  // Deletar possíveis dependências
  const tables = [
    'fit_cultural_avaliacoes',
    'fit_cultural_respostas',
    'feedbacks',
    'pdi',
    'pdi_acoes',
    'ausencias',
    'advertencias',
    'assessment_results',
    'metas',
    'historico_cargos',
    'employee_documents'
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).delete().eq('funcionario_id', id).select();
      if (data && data.length > 0) {
        console.log(`Deletado de ${table}:`, data.length);
      }
    } catch (e) {}
    try {
      const { data, error } = await supabase.from(table).delete().eq('employee_id', id).select();
      if (data && data.length > 0) {
        console.log(`Deletado de ${table} (employee_id):`, data.length);
      }
    } catch (e) {}
  }

  // Deletar da tabela funcionarios
  console.log('Deletando de funcionarios...');
  const { data: delFunc, error: delErr } = await supabase
    .from('funcionarios')
    .delete()
    .eq('id', id)
    .select();

  console.log('Resultado delete:', delFunc, delErr);

  // Verificar
  const { data: check } = await supabase.from('funcionarios').select('id, nome').eq('id', id);
  console.log('Verificação se ainda existe:', check);
}

deleteCarlos();
