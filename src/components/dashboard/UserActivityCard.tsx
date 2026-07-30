import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  UserCheck, History, Clock, Filter, RefreshCw,
  AlertCircle, ShieldCheck, CheckCircle2, FileEdit,
  User, Calendar, ListFilter, Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export interface ActivityItem {
  id: string;
  timestamp: string; // ISO string
  dateStr: string;   // YYYY-MM-DD
  timeStr: string;   // HH:mm
  module: 'ponto' | 'advertencia' | 'feedback' | 'evento' | 'manutencao' | 'auditoria';
  moduleLabel: string;
  actionText: string;
  details: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
}

interface ProfileOption {
  id: string;
  email: string;
  full_name: string;
}

export function UserActivityCard() {
  const { user, isAdmin } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('ALL'); // 'ALL' or user.id
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Load profiles list for admin filter
  useEffect(() => {
    async function loadProfiles() {
      if (!user) return;
      try {
        const { data } = await supabase.from('profiles').select('id, email, full_name');
        if (data) {
          setProfiles(data as ProfileOption[]);
        }
      } catch (err) {
        console.error('Erro ao carregar perfis:', err);
      }
    }
    loadProfiles();
  }, [user]);

  // Set default selectedUserId to current user id when user loads
  useEffect(() => {
    if (user && selectedUserId === 'ALL' && !isAdmin) {
      setSelectedUserId(user.id);
    }
  }, [user, isAdmin, selectedUserId]);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    const dayStart = `${selectedDate}T00:00:00.000Z`;
    const dayEnd = `${selectedDate}T23:59:59.999Z`;

    try {
      const items: ActivityItem[] = [];

      // 1. Audit Log entries
      const { data: auditData } = await supabase
        .from('audit_log')
        .select('*')
        .gte('created_at', dayStart)
        .lte('created_at', dayEnd)
        .order('created_at', { ascending: false });

      if (auditData) {
        auditData.forEach((a: {
          id: string;
          created_at: string;
          action: string;
          table_name: string;
          user_id: string;
          new_data?: Record<string, unknown> | null;
        }) => {
          const dt = new Date(a.created_at);
          items.push({
            id: `audit-${a.id}`,
            timestamp: a.created_at,
            dateStr: a.created_at.split('T')[0],
            timeStr: dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            module: 'auditoria',
            moduleLabel: 'AUDITORIA',
            actionText: `Ação de Sistema: ${a.action.replace('_', ' ').toUpperCase()}`,
            details: `Tabela ${a.table_name || 'geral'}${a.new_data ? ` — ${JSON.stringify(a.new_data).substring(0, 60)}...` : ''}`,
            userId: a.user_id,
          });
        });
      }

      // 2. Daily Attendance entries
      const { data: attData } = await supabase
        .from('daily_attendance')
        .select('id, created_at, date, status, observation, employee_id, funcionarios(nome)')
        .gte('created_at', dayStart)
        .lte('created_at', dayEnd)
        .order('created_at', { ascending: false });

      if (attData) {
        attData.forEach((att: {
          id: string;
          created_at: string;
          date: string;
          status: string;
          observation?: string | null;
          funcionarios?: { nome: string } | null;
        }) => {
          const dt = new Date(att.created_at);
          const funcNome = att.funcionarios?.nome || 'Colaborador';
          const statusMap: Record<string, string> = {
            presenca: 'Presença',
            falta: 'Falta Injustificada',
            falta_injustificada: 'Falta Injustificada',
            atestado: 'Atestado Médico',
            folga: 'Folga',
            ferias: 'Férias'
          };
          items.push({
            id: `att-${att.id}`,
            timestamp: att.created_at,
            dateStr: att.created_at.split('T')[0],
            timeStr: dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            module: 'ponto',
            moduleLabel: 'PONTO & FREQUÊNCIA',
            actionText: `Lançamento de Ponto: ${funcNome}`,
            details: `Status: ${statusMap[att.status] || att.status}${att.observation ? ` | Obs: ${att.observation}` : ''}`,
          });
        });
      }

      // 3. Employee Warnings entries
      const { data: warnData } = await supabase
        .from('employee_warnings')
        .select('id, created_at, date, reason, observation, employee_id, funcionarios(nome)')
        .gte('created_at', dayStart)
        .lte('created_at', dayEnd)
        .order('created_at', { ascending: false });

      if (warnData) {
        warnData.forEach((w: {
          id: string;
          created_at: string;
          reason: string;
          observation?: string | null;
          funcionarios?: { nome: string } | null;
        }) => {
          const dt = new Date(w.created_at);
          const funcNome = w.funcionarios?.nome || 'Colaborador';
          items.push({
            id: `warn-${w.id}`,
            timestamp: w.created_at,
            dateStr: w.created_at.split('T')[0],
            timeStr: dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            module: 'advertencia',
            moduleLabel: 'ADVERTÊNCIA',
            actionText: `Registro de Advertência: ${funcNome}`,
            details: `Motivo: ${w.reason}${w.observation ? ` | Obs: ${w.observation}` : ''}`,
          });
        });
      }

      // 4. Feedbacks entries
      const { data: fbData } = await supabase
        .from('feedbacks')
        .select('id, criado_em, autor, setor, status, prioridade')
        .gte('criado_em', dayStart)
        .lte('criado_em', dayEnd)
        .order('criado_em', { ascending: false });

      if (fbData) {
        fbData.forEach((fb: {
          id: string;
          criado_em: string;
          autor: string;
          setor: string;
          status: string;
          prioridade: string;
        }) => {
          const dt = new Date(fb.criado_em);
          items.push({
            id: `fb-${fb.id}`,
            timestamp: fb.criado_em,
            dateStr: fb.criado_em.split('T')[0],
            timeStr: dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            module: 'feedback',
            moduleLabel: 'FEEDBACK',
            actionText: `Novo Feedback Criado por ${fb.autor}`,
            details: `Setor: ${fb.setor} | Prioridade: ${fb.prioridade.toUpperCase()} | Status: ${fb.status}`,
            userName: fb.autor,
          });
        });
      }

      // 5. Events entries (SSMA)
      const { data: evtData } = await supabase
        .from('events')
        .select('id, created_at, event_date, involved_name')
        .gte('created_at', dayStart)
        .lte('created_at', dayEnd)
        .order('created_at', { ascending: false });

      if (evtData) {
        evtData.forEach((e: {
          id: string;
          created_at: string;
          event_date: string;
          involved_name: string;
        }) => {
          const dt = new Date(e.created_at);
          items.push({
            id: `evt-${e.id}`,
            timestamp: e.created_at,
            dateStr: e.created_at.split('T')[0],
            timeStr: dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            module: 'evento',
            moduleLabel: 'SST / EVENTO',
            actionText: `Evento Crítico / Ocorrência SST`,
            details: `Envolvido: ${e.involved_name} | Data Evento: ${e.event_date}`,
            userName: e.involved_name,
          });
        });
      }

      // Sort all combined activities by timestamp descending
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setActivities(items);
    } catch (err) {
      console.error('Erro ao buscar lançamentos:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchActivities();
  };

  // Filter activities by selected user if specific user selected
  const filteredActivities = useMemo(() => {
    if (selectedUserId === 'ALL') return activities;
    const targetProf = profiles.find(p => p.id === selectedUserId);
    if (!targetProf) return activities;

    return activities.filter(a => {
      if (a.userId && a.userId === selectedUserId) return true;
      if (a.userEmail && a.userEmail.toLowerCase() === targetProf.email.toLowerCase()) return true;
      if (a.userName && targetProf.full_name && a.userName.toLowerCase().includes(targetProf.full_name.toLowerCase())) return true;
      return false;
    });
  }, [activities, selectedUserId, profiles]);

  const currentUserProfile = useMemo(() => {
    if (!user) return null;
    return profiles.find(p => p.id === user.id) || {
      id: user.id,
      email: user.email || 'usuario@sistema.com',
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário Logado',
    };
  }, [user, profiles]);

  const activeFilterName = useMemo(() => {
    if (selectedUserId === 'ALL') return 'Todas as contas';
    const prof = profiles.find(p => p.id === selectedUserId);
    return prof ? `${prof.full_name} (${prof.email})` : 'Conta Selecionada';
  }, [selectedUserId, profiles]);

  // Counts by module for today
  const counts = useMemo(() => {
    const res = { total: filteredActivities.length, ponto: 0, advertencia: 0, feedback: 0, evento: 0, auditoria: 0 };
    filteredActivities.forEach(a => {
      if (res[a.module] !== undefined) res[a.module]++;
    });
    return res;
  }, [filteredActivities]);

  const getModuleBadgeStyle = (module: ActivityItem['module']) => {
    switch (module) {
      case 'ponto':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'advertencia':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'feedback':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'evento':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'auditoria':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="command-card p-5 flex flex-col justify-between border-l-4 border-l-primary bg-card/60 backdrop-blur-md shadow-xl"
    >
      {/* ── CARD HEADER ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/50 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <UserCheck className="w-5 h-5" />
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
              Lançamentos & Alterações do Dia por Conta
            </h2>
          </div>
          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
            Acompanhamento diário das ações, edições e lançamentos por conta de acesso
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Date Picker */}
          <div className="flex items-center gap-1 bg-background/80 border border-border rounded-lg px-2 py-1 text-xs font-mono">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-foreground outline-none text-xs font-bold cursor-pointer"
            />
          </div>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-8 w-8 shrink-0"
            title="Atualizar lançamentos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* ── ACCOUNT LOGIN INFORMATION BAR ── */}
      <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-white">
                {currentUserProfile?.full_name || 'Conta Atual'}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" /> SESSÃO ATIVA
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400">
              Login: <span className="text-slate-200 font-bold">{currentUserProfile?.email}</span>
            </p>
          </div>
        </div>

        {/* Account Selector Filter (Admin or Multi-account view) */}
        {isAdmin && profiles.length > 0 && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <ListFilter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="bg-background/90 border border-border text-foreground text-xs font-bold font-mono rounded-lg px-3 py-1.5 outline-none focus:border-primary w-full md:w-56 cursor-pointer"
            >
              <option value="ALL">🌐 Todas as Contas ({profiles.length})</option>
              {user && (
                <option value={user.id}>
                  👤 Minha Conta ({user.email})
                </option>
              )}
              {profiles
                .filter(p => p.id !== user?.id)
                .map(p => (
                  <option key={p.id} value={p.id}>
                    👤 {p.full_name || p.email}
                  </option>
                ))
              }
            </select>
          </div>
        )}
      </div>

      {/* ── KPI METRICS SUMMARY ROW ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
        <div className="bg-background/60 border border-border/60 rounded-lg p-2 text-center">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Total Hoje</span>
          <span className="text-base font-black data-mono text-primary">{counts.total}</span>
        </div>
        <div className="bg-background/60 border border-border/60 rounded-lg p-2 text-center">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Ponto/Falta</span>
          <span className="text-base font-black data-mono text-blue-400">{counts.ponto}</span>
        </div>
        <div className="bg-background/60 border border-border/60 rounded-lg p-2 text-center">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Advertência</span>
          <span className="text-base font-black data-mono text-amber-400">{counts.advertencia}</span>
        </div>
        <div className="bg-background/60 border border-border/60 rounded-lg p-2 text-center">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Feedbacks</span>
          <span className="text-base font-black data-mono text-purple-400">{counts.feedback}</span>
        </div>
        <div className="bg-background/60 border border-border/60 rounded-lg p-2 text-center col-span-2 sm:col-span-1">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Eventos/Outros</span>
          <span className="text-base font-black data-mono text-rose-400">{counts.evento + counts.auditoria}</span>
        </div>
      </div>

      {/* ── ACTIVITY TIMELINE FEED LIST ── */}
      <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1 font-sans">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2 text-muted-foreground">
            <RefreshCw className="w-5 h-5 animate-spin text-primary" />
            <span className="text-xs font-mono">Carregando lançamentos do dia...</span>
          </div>
        ) : filteredActivities.length > 0 ? (
          filteredActivities.map((act) => (
            <div
              key={act.id}
              className="bg-background/40 hover:bg-background/80 border border-border/40 hover:border-primary/40 transition-all rounded-lg p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 group"
            >
              <div className="flex items-start gap-3">
                {/* Time Badge */}
                <div className="flex items-center gap-1 text-[11px] font-bold font-mono text-slate-300 bg-slate-900 border border-slate-800 rounded px-2 py-1 shrink-0 mt-0.5">
                  <Clock className="w-3 h-3 text-primary" />
                  <span>{act.timeStr}</span>
                </div>

                {/* Content */}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border ${getModuleBadgeStyle(act.module)}`}>
                      {act.moduleLabel}
                    </span>
                    <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                      {act.actionText}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5 leading-relaxed">
                    {act.details}
                  </p>
                </div>
              </div>

              {/* User email badge if available */}
              {(act.userEmail || act.userName) && (
                <div className="text-[10px] font-mono text-slate-400 bg-slate-900/60 border border-slate-800 rounded px-2 py-0.5 shrink-0 self-end sm:self-center">
                  👤 {act.userName || act.userEmail}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-slate-950/30 border border-dashed border-slate-800 rounded-xl space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/60" />
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Nenhum lançamento registrado no dia ({selectedDate})
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                {selectedUserId === 'ALL'
                  ? 'Todas as contas estão sem lançamentos ou edições nesta data.'
                  : `A conta [${activeFilterName}] ainda não efetuou lançamentos hoje.`}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
