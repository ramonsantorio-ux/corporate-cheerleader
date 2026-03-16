import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Smile, Plus, Loader2, Trash2, Star } from 'lucide-react';
import PeriodFilter, { getPortoPeriod, type PeriodRange } from '@/components/filters/PeriodFilter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Survey {
  id: string; title: string; description: string; status: string; created_at: string;
  avg_score?: number; response_count?: number;
}

interface Func { id: string; nome: string; }

export default function Clima() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [funcionarios, setFuncionarios] = useState<Func[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [respondOpen, setRespondOpen] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', description: '' });
  const [responseForm, setResponseForm] = useState({ employee_id: '', score: '3', comment: '' });

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    const [sRes, rRes, fRes] = await Promise.all([
      supabase.from('climate_surveys').select('*').order('created_at', { ascending: false }),
      supabase.from('climate_responses').select('survey_id, score'),
      supabase.from('funcionarios').select('id, nome').order('nome'),
    ]);
    setFuncionarios((fRes.data || []) as Func[]);
    const responses = (rRes.data || []) as { survey_id: string; score: number }[];
    const surveyList = ((sRes.data || []) as Survey[]).map(s => {
      const sResponses = responses.filter(r => r.survey_id === s.id);
      const avg = sResponses.length > 0 ? sResponses.reduce((a, r) => a + r.score, 0) / sResponses.length : 0;
      return { ...s, avg_score: Math.round(avg * 10) / 10, response_count: sResponses.length };
    });
    setSurveys(surveyList);
    setLoading(false);
  }

  async function handleCreate() {
    if (!form.title) { toast.error('Informe o título'); return; }
    const { error } = await supabase.from('climate_surveys').insert({ title: form.title, description: form.description });
    if (error) { toast.error('Erro ao criar pesquisa'); return; }
    setCreateOpen(false);
    setForm({ title: '', description: '' });
    toast.success('Pesquisa criada!');
    fetchAll();
  }

  async function handleRespond() {
    if (!responseForm.employee_id || !respondOpen) { toast.error('Selecione o funcionário'); return; }
    const { error } = await supabase.from('climate_responses').insert({
      survey_id: respondOpen,
      employee_id: responseForm.employee_id,
      score: parseInt(responseForm.score),
      comment: responseForm.comment,
    });
    if (error) { toast.error('Erro ao enviar resposta'); return; }
    setRespondOpen(null);
    setResponseForm({ employee_id: '', score: '3', comment: '' });
    toast.success('Resposta registrada!');
    fetchAll();
  }

  async function deleteSurvey(id: string) {
    await supabase.from('climate_surveys').delete().eq('id', id);
    toast.success('Pesquisa removida');
    fetchAll();
  }

  const scoreColor = (s: number) => s >= 4 ? 'text-success' : s >= 3 ? 'text-warning' : 'text-destructive';

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Pesquisas Internas</p>
          <h1 className="text-2xl font-bold text-foreground">Clima Organizacional</h1>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-2" />Nova Pesquisa</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Pesquisa de Clima</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2"><Label>Título</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Pesquisa Q1 2026" /></div>
              <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Objetivo da pesquisa..." rows={3} /></div>
              <Button className="w-full" onClick={handleCreate}>Criar Pesquisa</Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : surveys.length === 0 ? (
        <div className="corporate-section">
          <div className="p-12 text-center text-muted-foreground">
            <Smile className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhuma pesquisa criada</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {surveys.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="corporate-section overflow-hidden">
              <div className="px-5 py-4 flex items-start justify-between border-b border-border">
                <div>
                  <h3 className="font-semibold text-sm text-foreground">{s.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.description || 'Sem descrição'}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteSurvey(s.id)} className="text-destructive hover:text-destructive -mr-2 -mt-1">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="px-5 py-4">
                <div className="flex items-center gap-5 mb-4">
                  <div>
                    <p className={`text-3xl font-bold ${scoreColor(s.avg_score || 0)}`}>{s.avg_score || '—'}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Nota Média</p>
                  </div>
                  <div className="flex-1">
                    <Progress value={(s.avg_score || 0) * 20} className="h-2" />
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-foreground">{s.response_count}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">Respostas</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => setRespondOpen(s.id)}>
                  <Star className="w-4 h-4 mr-2" />Registrar Resposta
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Respond Dialog */}
      <Dialog open={!!respondOpen} onOpenChange={open => !open && setRespondOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Resposta</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Funcionário</Label>
              <Select value={responseForm.employee_id} onValueChange={v => setResponseForm({ ...responseForm, employee_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {funcionarios.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nota (1 a 5)</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setResponseForm({ ...responseForm, score: n.toString() })}
                    className={`w-10 h-10 rounded-lg font-bold text-sm transition-colors ${parseInt(responseForm.score) === n ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Comentário (opcional)</Label>
              <Textarea value={responseForm.comment} onChange={e => setResponseForm({ ...responseForm, comment: e.target.value })} rows={2} />
            </div>
            <Button className="w-full" onClick={handleRespond}>Enviar Resposta</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
