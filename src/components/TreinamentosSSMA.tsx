import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target, Upload, Pencil, Trash2, ShieldAlert } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, Legend } from 'recharts';
import { readExcelRaw } from '@/lib/excel';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Treinamento {
  id: string;
  nome: string;
  cpf: string;
  funcao: string;
  situacao: string;
  cnh_categoria: string;
  cnh_vencimento: string;
  treinamentos: Record<string, string>;
}

// Lista de RACs para o Radar
const RAC_LIST = [
  'RAC 01 (Altura)', 'RAC 02 (Veículos Leves)', 'RAC 03 (Equipamentos Móveis)', 
  'RAC 04 (Bloqueio de Energia)', 'RAC 05 (Içamento)'
];

export function TreinamentosSSMA() {
  const [data, setData] = useState<Treinamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editItem, setEditItem] = useState<Treinamento | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: records, error } = await supabase.from('treinamentos_ssma').select('*').order('nome');
    if (error) {
      console.error(error);
      // Fallback if table doesn't exist yet
    } else {
      setData(records || []);
    }
    setLoading(false);
  }

  const getStatusColor = (dateStr: string) => {
    if (!dateStr || dateStr.trim() === '' || dateStr.toLowerCase().includes('realizado')) return 'bg-success';
    if (dateStr.toLowerCase().includes('programado')) return 'bg-warning';
    
    // Parse DD/MM/YYYY or YYYY-MM-DD
    let d: Date;
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 3) d = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      else return 'bg-muted';
    } else {
      d = new Date(dateStr);
    }
    
    if (isNaN(d.getTime())) return 'bg-muted';
    
    const now = new Date();
    const diffTime = d.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'bg-destructive';
    if (diffDays <= 30) return 'bg-warning';
    return 'bg-success';
  };

  const getStatusLabel = (dateStr: string) => {
    const color = getStatusColor(dateStr);
    if (color === 'bg-destructive') return 'Vencido';
    if (color === 'bg-warning') return 'Atenção';
    if (color === 'bg-success') return 'Em Dia';
    return 'N/A';
  };

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const ab = await file.arrayBuffer();
    // readExcelRaw retorna arrays brutos (equivalente a sheet_to_json com header:1)
    const rows = await readExcelRaw(ab);
    
    const headers1 = rows[0] || [];
    const headers2 = rows[1] || [];
    
    // Encontrar os índices das colunas de RACs baseados no Header 1 ou Header 2
    const racIndexes: Record<string, number> = {};
    headers1.forEach((h: any, i: number) => {
      if (typeof h === 'string' && h.includes('RAC')) {
        racIndexes[h.trim()] = i;
      }
    });

    const parsedData = rows.slice(2).map(r => {
      if (!r[0]) return null;
      const tData: Record<string, string> = {};
      
      // Mapear NRs e outras coisas dinamicamente
      if (racIndexes['RAC 02']) tData['RAC 02 (Veículos Leves)'] = formatDate(r[racIndexes['RAC 02'] + 3]); // Pula para a coluna de Vencimento
      if (racIndexes['RAC 03']) tData['RAC 03 (Equipamentos Móveis)'] = formatDate(r[racIndexes['RAC 03'] + 3]);
      if (racIndexes['RAC 04']) tData['RAC 04 (Bloqueio de Energia)'] = formatDate(r[racIndexes['RAC 04'] + 2]);
      
      // Mapeamento estático baseado no arquivo de exemplo
      tData['Prontidão'] = formatDate(r[15]);
      tData['Direitos Humanos'] = formatDate(r[16]);
      tData['Regras de Ouro'] = formatDate(r[18]);
      tData['NR 06 (EPI)'] = formatDate(r[42]); // Vencimento6
      tData['NR 20'] = formatDate(r[45]);
      tData['NR 26'] = formatDate(r[48]);

      return {
        nome: String(r[0]),
        cpf: String(r[1] || ''),
        funcao: String(r[2] || ''),
        situacao: String(r[6] || 'ATIVO'),
        cnh_categoria: String(r[8] || ''),
        cnh_vencimento: formatDate(r[11]),
        treinamentos: tData
      };
    }).filter(x => x && x.situacao === 'ATIVO');

    if (!parsedData.length) { 
      toast.error('Nenhum dado ativo válido encontrado na planilha.');
      setLoading(false);
      return; 
    }

    // Insert to DB
    const { error } = await supabase.from('treinamentos_ssma').insert(parsedData);
    if (error) {
      toast.error(`Erro ao salvar: ${error.message}`);
    } else {
      toast.success(`${parsedData.length} registros importados com sucesso!`);
      fetchData();
    }
    setLoading(false);
    e.target.value = '';
  }

  function formatDate(val: any) {
    if (!val) return '';
    if (val instanceof Date) return val.toISOString().slice(0, 10);
    return String(val);
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja excluir este registro?')) return;
    await supabase.from('treinamentos_ssma').delete().eq('id', id);
    toast.success('Excluído');
    fetchData();
  }

  async function handleSaveEdit() {
    if (!editItem) return;
    const { error } = await supabase.from('treinamentos_ssma').update({
      nome: editItem.nome,
      funcao: editItem.funcao,
      treinamentos: editItem.treinamentos
    }).eq('id', editItem.id);
    
    if (error) toast.error('Erro ao salvar');
    else {
      toast.success('Salvo com sucesso');
      setEditItem(null);
      fetchData();
    }
  }

  const radarData = useMemo(() => {
    if (!data.length) return RAC_LIST.map(r => ({ subject: r, A: 0 }));
    
    return RAC_LIST.map(rac => {
      let emDia = 0;
      let totalReq = 0;
      
      data.forEach(d => {
        const val = d.treinamentos?.[rac];
        if (val) {
          totalReq++;
          if (getStatusColor(val) === 'bg-success') emDia++;
        }
      });
      
      return {
        subject: rac,
        A: totalReq > 0 ? Math.round((emDia / totalReq) * 100) : 100 // Se ninguém precisa, 100% de aderência? Ou 0? Vamos 100
      };
    });
  }, [data]);

  const filteredData = data.filter(d => 
    d.nome.toLowerCase().includes(search.toLowerCase()) || 
    d.funcao.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" /> Aderência aos RACs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="hsl(var(--muted-foreground))" strokeOpacity={0.2} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--foreground))', fontSize: 10, fontWeight: 500 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <Radar name="Aderência (%)" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.5} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-warning" /> Controle de Vencimentos
            </CardTitle>
            <div className="flex items-center gap-2">
              <Input 
                placeholder="Buscar colaborador..." 
                className="w-48 h-8 text-xs" 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <label className="cursor-pointer">
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
                <Button variant="outline" size="sm" className="h-8" asChild>
                  <span><Upload className="w-4 h-4 mr-1" /> Importar</span>
                </Button>
              </label>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs py-2">Colaborador</TableHead>
                    <TableHead className="text-xs py-2">Função</TableHead>
                    <TableHead className="text-xs py-2">Status Principal</TableHead>
                    <TableHead className="text-xs py-2 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-4">Carregando...</TableCell></TableRow>
                  ) : filteredData.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">Nenhum registro. Importe a planilha para começar.</TableCell></TableRow>
                  ) : filteredData.map(d => {
                    // Descobre o pior status para mostrar de resumo
                    let piorColor = 'bg-success';
                    Object.values(d.treinamentos).forEach(val => {
                      const color = getStatusColor(val);
                      if (color === 'bg-destructive') piorColor = 'bg-destructive';
                      else if (color === 'bg-warning' && piorColor !== 'bg-destructive') piorColor = 'bg-warning';
                    });
                    
                    return (
                      <TableRow key={d.id}>
                        <TableCell className="text-xs py-2 font-medium">{d.nome}</TableCell>
                        <TableCell className="text-xs py-2 text-muted-foreground">{d.funcao}</TableCell>
                        <TableCell className="text-xs py-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${piorColor}`} />
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">
                              {piorColor === 'bg-success' ? 'Regular' : piorColor === 'bg-warning' ? 'Atenção' : 'Irregular'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs py-2 text-right">
                          <Dialog open={editItem?.id === d.id} onOpenChange={(open) => !open && setEditItem(null)}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditItem(d)}>
                                <Pencil className="w-3 h-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Editar Treinamentos - {d.nome}</DialogTitle>
                              </DialogHeader>
                              {editItem && (
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label>Nome</Label>
                                    <Input value={editItem.nome} onChange={e => setEditItem({...editItem, nome: e.target.value})} />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Função</Label>
                                    <Input value={editItem.funcao} onChange={e => setEditItem({...editItem, funcao: e.target.value})} />
                                  </div>
                                  
                                  <h3 className="font-semibold text-sm mt-4">Vencimentos</h3>
                                  <div className="grid grid-cols-2 gap-3">
                                    {Object.entries(editItem.treinamentos).map(([key, val]) => (
                                      <div key={key} className="space-y-1">
                                        <Label className="text-[10px]">{key}</Label>
                                        <div className="flex items-center gap-2">
                                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusColor(val)}`} />
                                          <Input 
                                            value={val} 
                                            className="h-7 text-xs"
                                            onChange={e => setEditItem({
                                              ...editItem, 
                                              treinamentos: {...editItem.treinamentos, [key]: e.target.value}
                                            })} 
                                          />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <Button className="w-full mt-4" onClick={handleSaveEdit}>Salvar Alterações</Button>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(d.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
