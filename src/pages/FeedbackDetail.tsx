import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ThumbsUp, MessageSquare, Calendar, User, Building2, UserCheck, CheckCircle2, Clock, AlertTriangle, ArrowRight, FileText, Shield, X, Loader2 } from 'lucide-react';
import { setorLabels, FeedbackSetor, FeedbackStatus, statusLabels, priorityLabels } from '@/lib/feedbackData';
import StatusBadge from '@/components/feedback/StatusBadge';
import PriorityBadge from '@/components/feedback/PriorityBadge';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface FeedbackRow {
  id: string;
  titulo: string;
  descricao: string;
  setor: string;
  prioridade: string;
  status: string;
  autor: string;
  departamento: string;
  pontos_positivos: string | null;
  pontos_melhoria: string | null;
  observacoes: string | null;
  gestor: string | null;
  votos: number;
  comentarios: number;
  criado_em: string;
  atualizado_em: string;
}

// Status workflow: which transitions are allowed
const STATUS_TRANSITIONS: Record<string, { next: FeedbackStatus; label: string; icon: any; color: string }[]> = {
  novo: [
    { next: 'em_analise', label: 'Iniciar Análise', icon: Clock, color: 'bg-warning text-warning-foreground' },
    { next: 'arquivado', label: 'Arquivar', icon: X, color: 'bg-muted text-muted-foreground' },
  ],
  em_analise: [
    { next: 'em_andamento', label: 'Colocar em Andamento', icon: ArrowRight, color: 'bg-primary text-primary-foreground' },
    { next: 'arquivado', label: 'Arquivar', icon: X, color: 'bg-muted text-muted-foreground' },
  ],
  em_andamento: [
    { next: 'resolvido', label: 'Dar Baixa / Resolver', icon: CheckCircle2, color: 'bg-success text-success-foreground' },
    { next: 'em_analise', label: 'Retornar para Análise', icon: Clock, color: 'bg-warning text-warning-foreground' },
  ],
  resolvido: [
    { next: 'em_andamento', label: 'Reabrir Feedback', icon: ArrowRight, color: 'bg-warning text-warning-foreground' },
    { next: 'arquivado', label: 'Arquivar', icon: X, color: 'bg-muted text-muted-foreground' },
  ],
  arquivado: [
    { next: 'novo', label: 'Reativar Feedback', icon: ArrowRight, color: 'bg-info text-info-foreground' },
  ],
};

const STATUS_TIMELINE_ORDER: FeedbackStatus[] = ['novo', 'em_analise', 'em_andamento', 'resolvido'];

function getStatusIndex(status: string): number {
  const idx = STATUS_TIMELINE_ORDER.indexOf(status as FeedbackStatus);
  return idx >= 0 ? idx : 0;
}

function daysBetween(a: string, b: string) {
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24)));
}

export default function FeedbackDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [feedback, setFeedback] = useState<FeedbackRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolveForm, setResolveForm] = useState({ acaoTomada: '', planoAcao: '', observacoes: '' });
  const [gestorName, setGestorName] = useState('');

  useEffect(() => {
    if (!id) return;
    supabase.from('feedbacks').select('*').eq('id', id).single().then(({ data }) => {
      setFeedback(data as FeedbackRow | null);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (user?.id) {
      supabase.from('profiles').select('full_name').eq('id', user.id).single().then(({ data }) => {
        if (data) setGestorName(data.full_name || user.email || '');
      });
    }
  }, [user]);

  async function changeStatus(newStatus: FeedbackStatus, extraFields?: Record<string, any>) {
    if (!feedback) return;
    setUpdating(true);
    const updateData: Record<string, any> = {
      status: newStatus,
      atualizado_em: new Date().toISOString(),
      ...extraFields,
    };
    const { error } = await supabase.from('feedbacks').update(updateData).eq('id', feedback.id);
    if (error) {
      toast.error('Erro ao atualizar status.');
      setUpdating(false);
      return;
    }

    // If resolving, update employee's feedbacks_resolvidos
    if (newStatus === 'resolvido') {
      const { data: funcData } = await supabase
        .from('funcionarios')
        .select('id, feedbacks_resolvidos')
        .eq('nome', feedback.autor)
        .single();
      if (funcData) {
        await supabase.from('funcionarios').update({
          feedbacks_resolvidos: funcData.feedbacks_resolvidos + 1,
        }).eq('id', funcData.id);
      }
    }

    // Reload
    const { data } = await supabase.from('feedbacks').select('*').eq('id', feedback.id).single();
    setFeedback(data as FeedbackRow | null);
    setUpdating(false);
    toast.success(`Status alterado para "${statusLabels[newStatus]}".`);
  }

  async function handleResolve(e: React.FormEvent) {
    e.preventDefault();
    if (!resolveForm.acaoTomada.trim()) {
      toast.error('Descreva a ação tomada para dar baixa.');
      return;
    }
    const obs = [
      feedback?.observacoes || '',
      `\n--- Resolução (${new Date().toLocaleDateString('pt-BR')}) por ${gestorName} ---`,
      `Ação tomada: ${resolveForm.acaoTomada}`,
      resolveForm.planoAcao ? `Plano de ação: ${resolveForm.planoAcao}` : '',
      resolveForm.observacoes ? `Obs: ${resolveForm.observacoes}` : '',
    ].filter(Boolean).join('\n');

    await changeStatus('resolvido', { observacoes: obs.trim() });
    setResolveOpen(false);
    setResolveForm({ acaoTomada: '', planoAcao: '', observacoes: '' });
  }

  function handleTransition(next: FeedbackStatus) {
    if (next === 'resolvido') {
      setResolveOpen(true);
    } else {
      changeStatus(next);
    }
  }

  if (loading) return <div className="text-center py-20 text-muted-foreground">Carregando...</div>;

  if (!feedback) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Feedback não encontrado.</p>
        <button onClick={() => navigate('/feedbacks')} className="text-primary text-sm mt-2 hover:underline">Voltar aos feedbacks</button>
      </div>
    );
  }

  const setor = feedback.setor as FeedbackSetor;
  const currentStatusIdx = getStatusIndex(feedback.status);
  const transitions = STATUS_TRANSITIONS[feedback.status] || [];
  const daysOpen = daysBetween(feedback.criado_em, feedback.status === 'resolvido' ? feedback.atualizado_em : new Date().toISOString());
  const isResolved = feedback.status === 'resolvido';
  const isArchived = feedback.status === 'arquivado';
  const inputClass = "w-full bg-muted rounded-lg px-4 py-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 transition-shadow";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
      </motion.div>

      {/* ── Status Progress Pipeline ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-xl p-5">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Pipeline de Status</h3>
        <div className="flex items-center gap-1">
          {STATUS_TIMELINE_ORDER.map((st, i) => {
            const reached = !isArchived && currentStatusIdx >= i;
            const isCurrent = feedback.status === st;
            return (
              <div key={st} className="flex items-center flex-1">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg flex-1 transition-all ${
                  isCurrent ? 'bg-primary text-primary-foreground shadow-md' :
                  reached ? 'bg-primary/15 text-primary' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {reached && !isCurrent ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      isCurrent ? 'border-primary-foreground' : reached ? 'border-primary' : 'border-muted-foreground'
                    }`}>{i + 1}</span>
                  )}
                  <span className="text-xs font-medium truncate">{statusLabels[st]}</span>
                </div>
                {i < STATUS_TIMELINE_ORDER.length - 1 && (
                  <ArrowRight className={`w-4 h-4 mx-1 shrink-0 ${reached ? 'text-primary' : 'text-muted-foreground/30'}`} />
                )}
              </div>
            );
          })}
        </div>
        {isArchived && (
          <div className="mt-3 px-3 py-2 bg-muted rounded-lg text-xs text-muted-foreground font-medium">
            ⓘ Este feedback está arquivado.
          </div>
        )}
      </motion.div>

      {/* ── Action Buttons ── */}
      {transitions.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Ações Disponíveis</h3>
          <div className="flex flex-wrap gap-3">
            {transitions.map(t => {
              const Icon = t.icon;
              return (
                <Button
                  key={t.next}
                  onClick={() => handleTransition(t.next)}
                  disabled={updating}
                  className={`${t.color} gap-2 ${t.next === 'resolvido' ? 'text-base px-6 py-3 font-semibold shadow-lg' : ''}`}
                  variant={t.next === 'resolvido' ? 'default' : 'outline'}
                  size={t.next === 'resolvido' ? 'lg' : 'default'}
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                  {t.label}
                </Button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Summary KPIs ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="corporate-kpi">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Dias {isResolved ? 'até resolução' : 'aberto'}</p>
          <p className={`text-2xl font-bold mt-1 ${daysOpen > 15 ? 'text-destructive' : daysOpen > 7 ? 'text-warning' : 'text-foreground'}`}>{daysOpen}d</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="corporate-kpi">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">SLA (≤15d)</p>
          <p className={`text-2xl font-bold mt-1 ${daysOpen <= 15 || isResolved ? 'text-success' : 'text-destructive'}`}>
            {isResolved ? (daysOpen <= 15 ? '✓ OK' : '✗ Estourado') : (daysOpen <= 15 ? 'No prazo' : 'Atrasado')}
          </p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="corporate-kpi">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Prioridade</p>
          <div className="mt-2"><PriorityBadge priority={feedback.prioridade as any} /></div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="corporate-kpi">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Departamento</p>
          <p className="text-sm font-semibold mt-1">{setorLabels[setor] || feedback.setor}</p>
        </motion.div>
      </div>

      {/* ── Main Content ── */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl p-6 space-y-5">
        <h1 className="text-xl font-bold">{feedback.titulo}</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">{feedback.descricao}</p>

        {feedback.pontos_positivos && (
          <div className="bg-success/5 border border-success/20 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-success mb-1 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Pontos Positivos
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{feedback.pontos_positivos}</p>
          </div>
        )}

        {feedback.pontos_melhoria && (
          <div className="bg-warning/5 border border-warning/20 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-warning mb-1 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Pontos de Melhoria
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{feedback.pontos_melhoria}</p>
          </div>
        )}

        {feedback.observacoes && (
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Observações / Registro de Resolução
            </h3>
            <pre className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap font-sans">{feedback.observacoes}</pre>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Funcionário</p>
              <p className="font-medium">{feedback.autor}</p>
            </div>
          </div>
          {feedback.gestor && (
            <div className="flex items-center gap-2 text-sm">
              <UserCheck className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Gestor</p>
                <p className="font-medium">{feedback.gestor}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Criado em</p>
              <p className="font-medium">{new Date(feedback.criado_em).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Atualizado em</p>
              <p className="font-medium">{new Date(feedback.atualizado_em).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Resolve Dialog ── */}
      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" /> Dar Baixa no Feedback
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleResolve} className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Ação Tomada *</label>
              <textarea
                placeholder="Descreva a ação realizada para resolver este feedback..."
                value={resolveForm.acaoTomada}
                onChange={e => setResolveForm({ ...resolveForm, acaoTomada: e.target.value })}
                className={`${inputClass} min-h-[90px] resize-none`}
                maxLength={1000}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Plano de Ação (opcional)</label>
              <textarea
                placeholder="Se necessário, descreva o plano de ação para evitar recorrência..."
                value={resolveForm.planoAcao}
                onChange={e => setResolveForm({ ...resolveForm, planoAcao: e.target.value })}
                className={`${inputClass} min-h-[70px] resize-none`}
                maxLength={1000}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Observações (opcional)</label>
              <textarea
                placeholder="Observações adicionais..."
                value={resolveForm.observacoes}
                onChange={e => setResolveForm({ ...resolveForm, observacoes: e.target.value })}
                className={`${inputClass} min-h-[50px] resize-none`}
                maxLength={500}
              />
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
              <p><strong>Responsável:</strong> {gestorName}</p>
              <p><strong>Data:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
              <p className="mt-1">Ao confirmar, o status será alterado para <strong className="text-success">Resolvido</strong> e o registro será salvo.</p>
            </div>
            <Button type="submit" disabled={updating} className="w-full bg-success text-success-foreground hover:bg-success/90 gap-2">
              {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Confirmar Resolução
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
