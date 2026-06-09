import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Users, CalendarDays, BookOpen, Target, Loader2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FastTextarea } from '@/components/ui/fast-textarea';
import { FastInput } from '@/components/ui/fast-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ExpandableChart } from '@/components/ui/ExpandableChart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DDSRecord {
  id: string;
  data: string;
  tema: string;
  metodo: string;
  previstos: number;
  participantes: number;
  comentarios: string;
}

const CHART_COLORS = ['hsl(155, 60%, 38%)', 'hsl(200, 80%, 38%)', 'hsl(38, 90%, 50%)', 'hsl(270, 60%, 55%)'];

export default function DDS() {
  const [records, setRecords] = useState<DDSRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    data: new Date().toISOString().split('T')[0],
    tema: '',
    metodo: 'Presencial',
    previstos: '',
    participantes: '',
    comentarios: ''
  });

  useEffect(() => { fetchRecords(); }, []);

  async function fetchRecords() {
    setLoading(true);
    const { data, error } = await supabase.from('dds_records').select('*').order('data', { ascending: false });
    if (!error && data) {
      setRecords(data);
    }
    setLoading(false);
  }

  async function handleSubmit() {
    if (!form.data || !form.tema || !form.previstos || !form.participantes) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    const { error } = await supabase.from('dds_records').insert({
      data: form.data,
      tema: form.tema,
      metodo: form.metodo,
      previstos: parseInt(form.previstos) || 0,
      participantes: parseInt(form.participantes) || 0,
      comentarios: form.comentarios
    });
    if (error) { toast.error('Erro ao salvar DDS'); return; }
    
    toast.success('DDS Registrado com Sucesso!');
    setDialogOpen(false);
    setForm({ data: new Date().toISOString().split('T')[0], tema: '', metodo: 'Presencial', previstos: '', participantes: '', comentarios: '' });
    fetchRecords();
  }

  async function handleDelete(id: string) {
    await supabase.from('dds_records').delete().eq('id', id);
    toast.success('Registro excluído');
    fetchRecords();
  }

  const analytics = useMemo(() => {
    let totalRealizados = records.length;
    let totalPrevistos = 0;
    let totalParticipantes = 0;
    
    const byMonth: Record<string, { realizados: number, aderencia: number, totalPrev: number, totalPart: number }> = {};
    const topTemas: Record<string, number> = {};

    records.forEach(r => {
      totalPrevistos += r.previstos;
      totalParticipantes += r.participantes;
      
      const month = r.data.slice(0, 7);
      if (!byMonth[month]) byMonth[month] = { realizados: 0, aderencia: 0, totalPrev: 0, totalPart: 0 };
      byMonth[month].realizados++;
      byMonth[month].totalPrev += r.previstos;
      byMonth[month].totalPart += r.participantes;

      topTemas[r.tema] = (topTemas[r.tema] || 0) + 1;
    });

    const monthData = Object.entries(byMonth).sort(([a],[b]) => a.localeCompare(b)).map(([m, data]) => {
      const [y, mm] = m.split('-');
      return {
        month: `${mm}/${y.slice(2)}`,
        realizados: data.realizados,
        aderencia: data.totalPrev > 0 ? Math.round((data.totalPart / data.totalPrev) * 100) : 0
      };
    });

    const aderenciaGeral = totalPrevistos > 0 ? Math.round((totalParticipantes / totalPrevistos) * 100) : 0;
    const temasRank = Object.entries(topTemas).sort(([,a],[,b]) => b - a).slice(0, 5).map(([name, value]) => ({ name, value }));

    return { totalRealizados, totalPrevistos, totalParticipantes, aderenciaGeral, monthData, temasRank };
  }, [records]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Diálogo Diário de Segurança (DDS)</h1>
          <p className="text-muted-foreground text-sm mt-1">Controle de engajamento e temas abordados</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Registrar DDS</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Novo DDS</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Data *</Label><Input type="date" value={form.data} onChange={e => setForm({...form, data: e.target.value})} /></div>
                <div className="space-y-2">
                  <Label>Método</Label>
                  <Select value={form.metodo} onValueChange={v => setForm({...form, metodo: v})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Presencial">Presencial</SelectItem>
                      <SelectItem value="Online">Online</SelectItem>
                      <SelectItem value="Misto">Misto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tema Abordado *</Label>
                <FastInput value={form.tema} onValueChange={v => setForm(f => ({...f, tema: v}))} placeholder="Ex: Uso Correto de EPIs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Previstos *</Label><Input type="number" value={form.previstos} onChange={e => setForm({...form, previstos: e.target.value})} /></div>
                <div className="space-y-2"><Label>Participantes *</Label><Input type="number" value={form.participantes} onChange={e => setForm({...form, participantes: e.target.value})} /></div>
              </div>
              <div className="space-y-2">
                <Label>Comentários/Anotações</Label>
                <FastTextarea value={form.comentarios} onValueChange={v => setForm(f => ({...f, comentarios: v}))} rows={2} />
              </div>
              <Button className="w-full" onClick={handleSubmit}>Salvar DDS</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="visao" className="w-full mb-8 mt-2">
        <TabsList className="w-full justify-start h-auto flex-wrap p-1.5 bg-muted/30 rounded-xl mb-6 border border-border">
          <TabsTrigger value="visao" className="px-5 py-2.5 text-sm font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Visão Geral & Métricas</TabsTrigger>
          <TabsTrigger value="historico" className="px-5 py-2.5 text-sm font-semibold rounded-lg data-[state=active]:bg-background data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all">Histórico de Registros</TabsTrigger>
        </TabsList>

        <TabsContent value="visao" className="space-y-6 outline-none">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">DDS Realizados</p>
              <p className="text-2xl font-bold text-foreground mt-1">{analytics.totalRealizados}</p>
            </div>
            <BookOpen className="w-8 h-8 text-primary/20" />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Previsão</p>
              <p className="text-2xl font-bold text-foreground mt-1">{analytics.totalPrevistos}</p>
            </div>
            <Target className="w-8 h-8 text-orange-500/20" />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-success">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Participantes</p>
              <p className="text-2xl font-bold text-foreground mt-1">{analytics.totalParticipantes}</p>
            </div>
            <Users className="w-8 h-8 text-success/20" />
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Aderência Geral</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{analytics.aderenciaGeral}%</p>
            </div>
            <div className="text-right">
               <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Engajamento</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
             <CardTitle className="text-sm font-semibold">Evolução de Aderência %</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="h-[250px]">
               <ExpandableChart title="Aderência Mensal ao DDS">
                 <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={analytics.monthData}>
                     <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 88%)" />
                     <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                     <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                     <Tooltip />
                     <Line type="monotone" dataKey="aderencia" stroke="hsl(200, 80%, 45%)" strokeWidth={3} dot={{ r: 4 }} name="Aderência %" />
                   </LineChart>
                 </ResponsiveContainer>
               </ExpandableChart>
             </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
             <CardTitle className="text-sm font-semibold">Top Temas Abordados</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="h-[250px]">
               <ExpandableChart title="Temas Mais Frequentes">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={analytics.temasRank} layout="vertical" margin={{ left: 10 }}>
                     <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 88%)" />
                     <XAxis type="number" tick={{ fontSize: 11 }} />
                     <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
                     <Tooltip />
                     <Bar dataKey="value" name="Vezes" fill="hsl(155, 60%, 38%)" radius={[0, 4, 4, 0]} />
                   </BarChart>
                 </ResponsiveContainer>
               </ExpandableChart>
             </div>
          </CardContent>
        </Card>
      </div>
      </TabsContent>

      <TabsContent value="historico" className="space-y-6 outline-none">
      <Card>
        <CardHeader className="pb-2">
           <CardTitle className="text-sm font-semibold">Histórico de DDS</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
             <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                   <tr className="border-b bg-muted/30">
                     <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground uppercase">Data</th>
                     <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground uppercase">Tema</th>
                     <th className="px-4 py-3 text-center font-semibold text-xs text-muted-foreground uppercase">Método</th>
                     <th className="px-4 py-3 text-center font-semibold text-xs text-muted-foreground uppercase">Prev / Part</th>
                     <th className="px-4 py-3 text-center font-semibold text-xs text-muted-foreground uppercase">Aderência</th>
                     <th className="px-4 py-3 text-right font-semibold text-xs text-muted-foreground uppercase">Ação</th>
                   </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => {
                     const pct = r.previstos > 0 ? Math.round((r.participantes / r.previstos) * 100) : 0;
                     return (
                       <tr key={r.id} className={`border-b hover:bg-muted/20 ${i % 2 === 0 ? 'bg-card' : 'bg-muted/5'}`}>
                         <td className="px-4 py-3 font-medium text-xs">{new Date(r.data + 'T12:00').toLocaleDateString('pt-BR')}</td>
                         <td className="px-4 py-3 font-medium">{r.tema}</td>
                         <td className="px-4 py-3 text-center"><span className="text-[10px] bg-muted px-2 py-0.5 rounded-full">{r.metodo}</span></td>
                         <td className="px-4 py-3 text-center text-xs font-semibold">{r.previstos} / <span className="text-primary">{r.participantes}</span></td>
                         <td className="px-4 py-3 text-center">
                           <span className={`text-xs font-bold ${pct >= 80 ? 'text-success' : pct >= 50 ? 'text-warning' : 'text-destructive'}`}>
                             {pct}%
                           </span>
                         </td>
                         <td className="px-4 py-3 text-right">
                           <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => handleDelete(r.id)}>
                             <Trash2 className="w-3 h-3" />
                           </Button>
                         </td>
                       </tr>
                     );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      </TabsContent>
      </Tabs>
    </div>
  );
}
