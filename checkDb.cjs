const url = 'https://rejtedafznpllsuodnwk.supabase.co/rest/v1/medicoes?select=*';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlanRlZGFmem5wbGxzdW9kbndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5NDQxNzUsImV4cCI6MjA4NzUyMDE3NX0.iQCWKNh6TnE3BR_OKiBrH3zDfTWKGySpOGTP9CO87BM';

fetch(url, {
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`
  }
})
.then(res => res.json())
.then(data => {
  data.forEach(d => {
    const mes = d.mes;
    const manutencao = d.dados.manutencaoPecas || 0;
    const folha = d.dados.custoFolha || 0;
    console.log(`Mês: ${mes} | Manutenção Pecas: ${manutencao} | Custo Folha: ${folha}`);
  });
});
