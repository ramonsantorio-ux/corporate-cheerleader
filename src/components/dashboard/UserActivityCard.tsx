import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCheck, History, Clock, Filter, RefreshCw,
  AlertCircle, ShieldCheck, CheckCircle2, FileEdit,
  User, Calendar, ListFilter, Activity, Search,
  Wrench, Shield, AlertTriangle, Users, MessageSquare, ChevronDown, ChevronUp, FileText, Database
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export interface ActivityItem {
  id: string;
  timestamp: string; // ISO string
  dateStr: string;   // YYYY-MM-DD
  timeStr: string;   // HH:mm:ss
  moduleCategory: 'cco' | 'rh' | 'ssma' | 'feedback' | 'admin';
  moduleLabel: string;
  actionType: 'criacao' | 'edicao' | 'exclusao' | 'seguranca' | 'operacional';
  actionLabel: string;
  actionText: string;
  details: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  payload?: Record<string, unknown> | null;
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
  const [selectedUserId, setSelectedUserId] = useState<string>('ALL');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
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

  // Default filter configuration
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

      // 1. Audit Log entries (Sistema & Administração)
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
          old_data?: Record<string, unknown> | null;
        }) => {
          const dt = new Date(a.created_at);
          items.push({
            id: `audit-${a.id}`,
            timestamp: a.created_at,
            dateStr: a.created_at.split('T')[0],
            timeStr: dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            moduleCategory: 'admin',
            moduleLabel: 'AUDITORIA & SEGURANÇA',
            actionType: 'seguranca',
            actionLabel: 'SISTEMA',
            actionText: `Audit Admin: ${a.action.replace('_', ' ').toUpperCase()}`,
            details: `Tabela: ${a.table_name || 'geral'}${a.new_data ? ` — ${JSON.stringify(a.new_data).substring(0, 70)}` : ''}`,
            userId: a.user_id,
            payload: (a.new_data || a.old_data) as Record<string, unknown>,
          });
        });
      }

      // 2. CCO Maintenance (Manutenção de Frota / Equipamentos)
      const { data: ccoMaint } = await supabase
        .from('cco_maintenance')
        .select('id, created_at, data, servico, motorista, placa, status, tipo_manutencao, area')
        .gte('created_at', dayStart)
        .lte('created_at', dayEnd)
        .order('created_at', { ascending: false });

      if (ccoMaint) {
        ccoMaint.forEach((m: {
          id: string;
          created_at: string;
          servico: string;
          motorista: string;
          placa: string;
          status: string;
          tipo_manutencao: string;
          area: string;
        }) => {
          const dt = new Date(m.created_at);
          items.push({
            id: `cco-maint-${m.id}`,
            timestamp: m.created_at,
            dateStr: m.created_at.split('T')[0],
            timeStr: dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            moduleCategory: 'cco',
            moduleLabel: 'CCO / MANUTENÇÃO',
            actionType: 'operacional',
            actionLabel: 'MANUTENÇÃO',
            actionText: `Lançamento CCO: Placa ${m.placa || 'Sem Placa'}`,
            details: `Serviço: ${m.servico} | Motorista: ${m.motorista} | Tipo: ${m.tipo_manutencao} | Status: ${m.status}`,
            userName: m.motorista,
            payload: m as unknown as Record<string, unknown>,
          });
        });
      }

      // 3. CCO Third Party (OS Terceirizadas)
      const { data: ccoThird } = await supabase
        .from('cco_third_party')
        .select('id, created_at, atendimento, os, tag, status, justificativa, dono')
        .gte('created_at', dayStart)
        .lte('created_at', dayEnd)
        .order('created_at', { ascending: false });

      if (ccoThird) {
        ccoThird.forEach((t: {
          id: string;
          created_at: string;
          atendimento: string;
          os: string;
          tag: string;
          status: string;
          justificativa: string;
          dono: string;
        }) => {
          const dt = new Date(t.created_at);
          items.push({
            id: `cco-third-${t.id}`,
            timestamp: t.created_at,
            dateStr: t.created_at.split('T')[0],
            timeStr: dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            moduleCategory: 'cco',
            moduleLabel: 'CCO / TERCEIROS',
            actionType: 'operacional',
            actionLabel: 'OS TERCEIRO',
            actionText: `Atendimento Terceiro: OS ${t.os || 'N/A'} (TAG: ${t.tag || 'N/A'})`,
            details: `Atendimento: ${t.atendimento} | Responsável: ${t.dono || 'N/I'} | Status: ${t.status}`,
            userName: t.dono,
            payload: t as unknown as Record<string, unknown>,
          });
        });
      }

      // 4. Daily Attendance (Ponto & Frequência RH)
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
            timeStr: dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            moduleCategory: 'rh',
            moduleLabel: 'RH / FREQUÊNCIA',
            actionType: 'edicao',
            actionLabel: 'PONTO',
            actionText: `Lançamento de Frequência: ${funcNome}`,
            details: `Status Registrado: ${statusMap[att.status] || att.status}${att.observation ? ` | Obs: ${att.observation}` : ''}`,
            payload: att as unknown as Record<string, unknown>,
          });
        });
      }

      // 5. Employee Warnings (Advertências RH / Ocorrências)
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
            timeStr: dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            moduleCategory: 'rh',
            moduleLabel: 'RH / ADVERTÊNCIA',
            actionType: 'criacao',
            actionLabel: 'ADVERTÊNCIA',
            actionText: `Registro de Advertência Disciplinar: ${funcNome}`,
            details: `Motivo: ${w.reason}${w.observation ? ` | Obs: ${w.observation}` : ''}`,
            payload: w as unknown as Record<string, unknown>,
          });
        });
      }

      // 6. Absences (Solicitações de Ausência / Férias)
      const { data: absData } = await supabase
        .from('absences')
        .select('id, created_at, start_date, end_date, type, status, reason, funcionarios(nome)')
        .gte('created_at', dayStart)
        .lte('created_at', dayEnd)
        .order('created_at', { ascending: false });

      if (absData) {
        absData.forEach((ab: {
          id: string;
          created_at: string;
          start_date: string;
          end_date: string;
          type: string;
          status: string;
          reason?: string | null;
          funcionarios?: { nome: string } | null;
        }) => {
          const dt = new Date(ab.created_at);
          const funcNome = ab.funcionarios?.nome || 'Colaborador';
          items.push({
            id: `abs-${ab.id}`,
            timestamp: ab.created_at,
            dateStr: ab.created_at.split('T')[0],
            timeStr: dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            moduleCategory: 'rh',
            moduleLabel: 'RH / AUSÊNCIAS',
            actionType: 'criacao',
            actionLabel: 'LICENÇA',
            actionText: `Solicitação de Ausência/Férias: ${funcNome}`,
            details: `Tipo: ${ab.type.toUpperCase()} (${ab.start_date} até ${ab.end_date}) | Status: ${ab.status}`,
            payload: ab as unknown as Record<string, unknown>,
          });
        });
      }

      // 7. Feedbacks entries
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
            timeStr: dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            moduleCategory: 'feedback',
            moduleLabel: 'FEEDBACKS',
            actionType: 'criacao',
            actionLabel: 'FEEDBACK',
            actionText: `Novo Feedback Criado por ${fb.autor}`,
            details: `Setor: ${fb.setor} | Prioridade: ${fb.prioridade.toUpperCase()} | Status: ${fb.status}`,
            userName: fb.autor,
            payload: fb as unknown as Record<string, unknown>,
          });
        });
      }

      // 8. Events entries (SSMA)
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
            timeStr: dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            moduleCategory: 'ssma',
            moduleLabel: 'SSMA / OCORRÊNCIA',
            actionType: 'criacao',
            actionLabel: 'EVENTO SSMA',
            actionText: `Evento Crítico / Ocorrência de Segurança`,
            details: `Envolvido: ${e.involved_name} | Data do Evento: ${e.event_date}`,
            userName: e.involved_name,
            payload: e as unknown as Record<string, unknown>,
          });
        });
      }

      // 9. Funcionarios (Novos Colaboradores)
      const { data: funcData } = await supabase
        .from('funcionarios')
        .select('id, created_at, nome, cargo, departamento')
        .gte('created_at', dayStart)
        .lte('created_at', dayEnd)
        .order('created_at', { ascending: false });

      if (funcData) {
        funcData.forEach((f: {
          id: string;
          created_at: string;
          nome: string;
          cargo: string;
          departamento: string;
        }) => {
          const dt = new Date(f.created_at);
          items.push({
            id: `func-${f.id}`,
            timestamp: f.created_at,
            dateStr: f.created_at.split('T')[0],
            timeStr: dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            moduleCategory: 'rh',
            moduleLabel: 'CADASTRO / COLABORADOR',
            actionType: 'criacao',
            actionLabel: 'CADASTRO',
            actionText: `Novo Colaborador Cadastrado: ${f.nome}`,
            details: `Cargo: ${f.cargo} | Departamento: ${f.departamento}`,
            userName: f.nome,
            payload: f as unknown as Record<string, unknown>,
          });
        });
      }

      // Sort all combined activities by timestamp descending
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setActivities(items);
    } catch (err) {
      console.error('Erro ao buscar movimentações do sistema:', err);
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

  // Filter activities by selected user, module, and search query
  const filteredActivities = useMemo(() => {
    return activities.filter(a => {
      // 1. Filter by user account if selected
      if (selectedUserId !== 'ALL') {
        const targetProf = profiles.find(p => p.id === selectedUserId);
        if (targetProf) {
          const matchesId = a.userId && a.userId === selectedUserId;
          const matchesEmail = a.userEmail && a.userEmail.toLowerCase() === targetProf.email.toLowerCase();
          const matchesName = a.userName && targetProf.full_name && a.userName.toLowerCase().includes(targetProf.full_name.toLowerCase());
          if (!matchesId && !matchesEmail && !matchesName) return false;
        }
      }

      // 2. Filter by module category
      if (selectedModule !== 'ALL' && a.moduleCategory !== selectedModule) {
        return false;
      }

      // 3. Search query text match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fullText = `${a.actionText} ${a.details} ${a.moduleLabel} ${a.userName || ''} ${a.userEmail || ''}`.toLowerCase();
        if (!fullText.includes(q)) return false;
      }

      return true;
    });
  }, [activities, selectedUserId, selectedModule, searchQuery, profiles]);

  const currentUserProfile = useMemo(() => {
    if (!user) return null;
    return profiles.find(p => p.id === user.id) || {
      id: user.id,
      email: user.email || 'usuario@sistema.com',
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário Logado',
    };
  }, [user, profiles]);

  // Counts by module for current filters
  const counts = useMemo(() => {
    const res = { total: filteredActivities.length, cco: 0, rh: 0, ssma: 0, feedback: 0, admin: 0 };
    filteredActivities.forEach(a => {
      if (res[a.moduleCategory] !== undefined) res[a.moduleCategory]++;
    });
    return res;
  }, [filteredActivities]);

  const getModuleBadgeStyle = (category: ActivityItem['moduleCategory']) => {
    switch (category) {
      case 'cco':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'rh':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'ssma':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'feedback':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'admin':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
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
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-border/50 pb-4 mb-4">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <Activity className="w-5 h-5 animate-pulse" />
            <h2 className="text-base font-black uppercase tracking-wider text-foreground">
              Central de Movimentações & Modificações do Sistema
            </h2>
          </div>
          <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
            Monitoramento completo de alterações, criações e edições em todos os módulos (CCO, RH, SSMA, Contratos e Auditoria)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="FILTRAR POR PALAVRA/ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-background/80 border border-border text-foreground rounded-lg pl-8 pr-2 py-1 text-xs font-mono w-full outline-none focus:border-primary placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Date Picker */}
          <div className="flex items-center gap-1 bg-background/80 border border-border rounded-lg px-2.5 py-1 text-xs font-mono">
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
            title="Atualizar movimentações em tempo real"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* ── ACCOUNT LOGIN INFORMATION BAR & CONTROLS ── */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 mb-4 space-y-3">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-primary" />
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
              <ListFilter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold font-mono rounded-lg px-3 py-1.5 outline-none focus:border-primary w-full md:w-60 cursor-pointer"
              >
                <option value="ALL">🌐 Todas as Contas do Sistema ({profiles.length})</option>
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

        {/* Filter by Module Bar */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80 text-xs font-mono">
          <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-primary" /> Módulo:
          </span>
          {[
            { id: 'ALL', label: 'Todos os Módulos' },
            { id: 'cco', label: '⚙️ CCO & Frota' },
            { id: 'rh', label: '👥 Gestão RH & Ponto' },
            { id: 'ssma', label: '⚠️ SSMA & Eventos' },
            { id: 'feedback', label: '💬 Feedbacks' },
            { id: 'admin', label: '🔒 Auditoria & Admin' },
          ].map(mod => (
            <button
              key={mod.id}
              onClick={() => setSelectedModule(mod.id)}
              className={`px-2.5 py-1 rounded-md font-bold transition-all text-[11px] ${selectedModule === mod.id ? 'bg-primary text-primary-foreground font-black shadow-md' : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            >
              {mod.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI METRICS SUMMARY ROW ── */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 mb-4">
        <div className="bg-background/60 border border-border/60 rounded-lg p-2 text-center">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Total Movimentos</span>
          <span className="text-base font-black data-mono text-primary">{counts.total}</span>
        </div>
        <div className="bg-background/60 border border-border/60 rounded-lg p-2 text-center">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">CCO & Frota</span>
          <span className="text-base font-black data-mono text-blue-400">{counts.cco}</span>
        </div>
        <div className="bg-background/60 border border-border/60 rounded-lg p-2 text-center">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Gestão RH</span>
          <span className="text-base font-black data-mono text-emerald-400">{counts.rh}</span>
        </div>
        <div className="bg-background/60 border border-border/60 rounded-lg p-2 text-center">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">SSMA / Risco</span>
          <span className="text-base font-black data-mono text-amber-400">{counts.ssma}</span>
        </div>
        <div className="bg-background/60 border border-border/60 rounded-lg p-2 text-center">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Feedbacks</span>
          <span className="text-base font-black data-mono text-purple-400">{counts.feedback}</span>
        </div>
        <div className="bg-background/60 border border-border/60 rounded-lg p-2 text-center col-span-2 sm:col-span-1">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Audit / Admin</span>
          <span className="text-base font-black data-mono text-rose-400">{counts.admin}</span>
        </div>
      </div>

      {/* ── ACTIVITY TIMELINE FEED LIST ── */}
      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 font-sans">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
            <RefreshCw className="w-5 h-5 animate-spin text-primary" />
            <span className="text-xs font-mono">Buscando histórico de movimentações do sistema...</span>
          </div>
        ) : filteredActivities.length > 0 ? (
          filteredActivities.map((act) => {
            const isExpanded = expandedId === act.id;
            return (
              <div
                key={act.id}
                className="bg-background/40 hover:bg-background/80 border border-border/40 hover:border-primary/40 transition-all rounded-xl p-3 flex flex-col gap-2 group"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-start gap-3">
                    {/* Time Badge */}
                    <div className="flex items-center gap-1 text-[11px] font-bold font-mono text-slate-300 bg-slate-900 border border-slate-800 rounded px-2 py-1 shrink-0 mt-0.5">
                      <Clock className="w-3 h-3 text-primary" />
                      <span>{act.timeStr}</span>
                    </div>

                    {/* Module & Action Content */}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded border ${getModuleBadgeStyle(act.moduleCategory)}`}>
                          {act.moduleLabel}
                        </span>
                        <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                          {act.actionText}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground font-mono mt-1 leading-relaxed">
                        {act.details}
                      </p>
                    </div>
                  </div>

                  {/* Account & Expand toggle */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {(act.userEmail || act.userName) && (
                      <span className="text-[10px] font-mono text-slate-300 bg-slate-900/80 border border-slate-800 rounded px-2 py-0.5">
                        👤 {act.userName || act.userEmail}
                      </span>
                    )}

                    {act.payload && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : act.id)}
                        className="text-xs text-muted-foreground hover:text-foreground p-1 rounded hover:bg-slate-800/50 transition-colors flex items-center gap-1 font-mono"
                        title="Ver payload técnico"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Payload Viewer */}
                <AnimatePresence>
                  {isExpanded && act.payload && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-300 bg-slate-950/90 rounded-lg p-3 overflow-x-auto"
                    >
                      <div className="flex items-center gap-1 text-primary font-bold mb-1">
                        <Database className="w-3 h-3" />
                        <span>PAYLOAD / REGISTRO TÉCNICO COMPLETO:</span>
                      </div>
                      <pre className="text-emerald-400 whitespace-pre-wrap leading-tight">
                        {JSON.stringify(act.payload, null, 2)}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center bg-slate-950/30 border border-dashed border-slate-800 rounded-xl space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/60" />
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Nenhuma movimentação encontrada para o filtro ({selectedDate})
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                {selectedModule !== 'ALL'
                  ? `Nenhum lançamento no módulo [${selectedModule.toUpperCase()}] nesta data.`
                  : 'Tente alterar a data ou remover os filtros de busca.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
