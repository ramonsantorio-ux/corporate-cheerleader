import { Bell, Search, AlertTriangle, ShieldAlert, MessageSquare, Calendar, Clock } from 'lucide-react';
import busatoGlobo from '@/assets/busato-globo.png';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface AlertItem {
  id: string;
  type: 'warning' | 'event' | 'feedback' | 'absence' | 'overtime';
  title: string;
  description: string;
  date: string;
  link?: string;
  icon: typeof AlertTriangle;
  color: string;
}

export default function TopBar() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('seen_alerts');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  useEffect(() => {
    fetchAlerts();
  }, []);

  async function fetchAlerts() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const since = thirtyDaysAgo.toISOString().slice(0, 10);

    const [warnRes, evtRes, fbRes, attRes] = await Promise.all([
      supabase.from('employee_warnings').select('id, date, reason, employee_id, applied').gte('date', since).order('date', { ascending: false }).limit(20),
      supabase.from('events').select('id, event_date, description, involved_name').gte('event_date', since).order('event_date', { ascending: false }).limit(20),
      supabase.from('feedbacks').select('id, titulo, status, criado_em, autor').in('status', ['novo', 'em_analise']).order('criado_em', { ascending: false }).limit(20),
      supabase.from('daily_attendance').select('id, date, status, employee_id').gte('date', since).in('status', ['falta', 'falta_injustificada']).order('date', { ascending: false }).limit(20),
    ]);

    // Get employee names for warnings and absences
    const empIds = new Set<string>();
    warnRes.data?.forEach((w: any) => empIds.add(w.employee_id));
    attRes.data?.forEach((a: any) => empIds.add(a.employee_id));

    let nameMap: Record<string, string> = {};
    if (empIds.size > 0) {
      const { data: emps } = await supabase.from('funcionarios').select('id, nome').in('id', Array.from(empIds));
      if (emps) nameMap = Object.fromEntries(emps.map((e: any) => [e.id, e.nome]));
    }

    const items: AlertItem[] = [];

    // Warnings
    warnRes.data?.forEach((w: any) => {
      items.push({
        id: `warn-${w.id}`,
        type: 'warning',
        title: `Advertência ${w.applied ? 'aplicada' : 'pendente'}`,
        description: `${nameMap[w.employee_id] || 'Colaborador'} — ${w.reason || 'Sem motivo'}`,
        date: w.date,
        link: undefined,
        icon: ShieldAlert,
        color: 'text-destructive',
      });
    });

    // Events
    evtRes.data?.forEach((e: any) => {
      items.push({
        id: `evt-${e.id}`,
        type: 'event',
        title: 'Evento registrado',
        description: `${e.involved_name} — ${e.description?.slice(0, 60) || ''}`,
        date: e.event_date,
        link: '/eventos',
        icon: AlertTriangle,
        color: 'text-warning',
      });
    });

    // Pending feedbacks
    fbRes.data?.forEach((f: any) => {
      items.push({
        id: `fb-${f.id}`,
        type: 'feedback',
        title: `Feedback ${f.status === 'novo' ? 'novo' : 'em análise'}`,
        description: `${f.titulo} — ${f.autor}`,
        date: f.criado_em?.slice(0, 10),
        link: `/feedbacks/${f.id}`,
        icon: MessageSquare,
        color: 'text-primary',
      });
    });

    // Absences (unexcused)
    attRes.data?.forEach((a: any) => {
      items.push({
        id: `abs-${a.id}`,
        type: 'absence',
        title: 'Falta injustificada',
        description: nameMap[a.employee_id] || 'Colaborador',
        date: a.date,
        icon: Clock,
        color: 'text-destructive',
      });
    });

    // Sort by date desc
    items.sort((a, b) => b.date.localeCompare(a.date));
    setAlerts(items);
  }

  const unseenCount = useMemo(() => alerts.filter(a => !seen.has(a.id)).length, [alerts, seen]);

  function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen && unseenCount > 0) {
      const newSeen = new Set(seen);
      alerts.forEach(a => newSeen.add(a.id));
      setSeen(newSeen);
      try { localStorage.setItem('seen_alerts', JSON.stringify(Array.from(newSeen))); } catch {}
    }
  }

  function handleClick(alert: AlertItem) {
    if (alert.link) {
      navigate(alert.link);
      setOpen(false);
    }
  }

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3 md:hidden">
        <img src={busatoGlobo} alt="Busato" className="w-8 h-8" />
        <span className="font-semibold text-sm">Busato</span>
      </div>

      <div className="hidden md:flex items-center gap-2 bg-muted rounded-lg px-3 py-2 w-80">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar feedbacks..."
          className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex items-center gap-3">
        <Popover open={open} onOpenChange={handleOpen}>
          <PopoverTrigger asChild>
            <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              {unseenCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center font-bold px-1">
                  {unseenCount > 99 ? '99+' : unseenCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-96 p-0">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-sm">Notificações</h3>
              <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
            </div>
            <ScrollArea className="max-h-[400px]">
              {alerts.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">Nenhuma notificação</div>
              ) : (
                <div className="divide-y divide-border">
                  {alerts.map(alert => (
                    <button
                      key={alert.id}
                      onClick={() => handleClick(alert)}
                      className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex items-start gap-3 ${!seen.has(alert.id) ? 'bg-primary/5' : ''}`}
                    >
                      <alert.icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${alert.color}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold">{alert.title}</span>
                          <Badge variant="outline" className="text-[9px] px-1 py-0">{alert.type === 'warning' ? 'Adv.' : alert.type === 'event' ? 'Evento' : alert.type === 'feedback' ? 'FB' : 'Falta'}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{alert.description}</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5">{new Date(alert.date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
          JD
        </div>
      </div>
    </header>
  );
}
