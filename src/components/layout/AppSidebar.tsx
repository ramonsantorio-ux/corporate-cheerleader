import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BarChart3, Settings, ChevronLeft, ChevronRight,
  Users, Target, Shield, LogOut, Calendar, AlertTriangle, CalendarDays,
  Briefcase, Brain, ClipboardList, GitMerge, TrendingUp, FileText, FileWarning
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import busatoGlobo from '@/assets/busato-globo.png';

interface NavItem { to: string; icon: any; label: string; badge?: string }
interface NavGroup { label: string; items: NavItem[] }

const navGroups: NavGroup[] = [
  {
    label: 'Visão Geral',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'Gestão de Pessoas',
    items: [
      { to: '/colaboradores', icon: Users, label: 'Colaboradores' },
      { to: '/organograma', icon: GitMerge, label: 'Organograma' },
      { to: '/ausencias', icon: CalendarDays, label: 'Ponto & Férias' },
    ],
  },
  {
    label: 'Performance',
    items: [
      { to: '/desempenho', icon: Target, label: 'Gestão de Performance' },
      { to: '/sucessao', icon: TrendingUp, label: 'Sucessão & 9Box' },
    ],
  },
  {
    label: 'Talentos & Comportamento',
    items: [
      { to: '/treinamentos', icon: ClipboardList, label: 'Assessments Hub', badge: 'NOVO' },
      { to: '/assessment/disc', icon: Brain, label: 'Teste DISC' },
      { to: '/assessment/mbti', icon: Brain, label: 'MBTI' },
      { to: '/assessment/bigfive', icon: Brain, label: 'Big Five' },
    ],
  },
  {
    label: 'Operações',
    items: [
      { to: '/eventos', icon: AlertTriangle, label: 'Eventos de Campo' },
      { to: '/evolucao', icon: Briefcase, label: 'Contratos' },
      { to: '/notificacoes', icon: FileWarning, label: 'Notificações/Multas' },
      { to: '/relatorios', icon: BarChart3, label: 'C-Level Analytics' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { to: '/configuracoes', icon: Settings, label: 'Configurações' },
    ],
  },
];

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { isAdmin, signOut } = useAuth();

  const allGroups = isAdmin
    ? [
        ...navGroups.slice(0, -1),
        {
          label: 'Sistema',
          items: [
            { to: '/configuracoes', icon: Settings, label: 'Configurações' },
            { to: '/admin', icon: Shield, label: 'Administração' },
          ],
        },
      ]
    : navGroups;

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 252 }}
      transition={{ duration: 0.18, ease: 'easeInOut' }}
      className="hidden md:flex flex-col h-screen sticky top-0 z-30 bg-sidebar border-r border-sidebar-border"
    >
      {/* ── Brand ── */}
      <div className="flex items-center gap-3 px-4 h-14 border-b border-sidebar-border flex-shrink-0">
        <img src={busatoGlobo} alt="Busato" className="w-8 h-8 rounded-lg flex-shrink-0 ring-2 ring-sidebar-primary/30" />
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }}>
              <span className="text-sidebar-foreground font-bold text-sm tracking-tight block leading-none">BUSATO</span>
              <span className="text-sidebar-foreground/40 text-[10px] font-semibold tracking-[0.15em] uppercase">Gestão de Contratos</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {allGroups.map((group, gi) => (
          <div key={group.label} className={cn('mb-1', gi > 0 && 'mt-2')}>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="px-4 pt-3 pb-1">
                  <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-sidebar-foreground/35">
                    {group.label}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {collapsed && gi > 0 && <div className="mx-3 my-1.5 border-t border-sidebar-border/30" />}

            <div className="px-2 space-y-0.5">
              {group.items.map((item) => {
                const isActive = item.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.to);

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'group relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] font-medium transition-all duration-150',
                      isActive
                        ? 'bg-sidebar-primary/12 text-sidebar-primary'
                        : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/70'
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-indicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-sidebar-primary"
                        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                      />
                    )}

                    <item.icon className={cn(
                      'w-4 h-4 flex-shrink-0 transition-colors',
                      isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70'
                    )} />

                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -4 }} transition={{ duration: 0.12 }}
                          className="whitespace-nowrap flex-1 flex items-center justify-between"
                        >
                          {item.label}
                          {item.badge && (
                            <span className="text-[9px] font-bold bg-sidebar-primary text-white px-1.5 py-0.5 rounded-full leading-none">
                              {item.badge}
                            </span>
                          )}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer ── */}
      <div className="border-t border-sidebar-border flex-shrink-0">
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-3 w-full text-[12.5px] text-sidebar-foreground/50 hover:text-destructive transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="whitespace-nowrap font-medium">
                Sair
              </motion.span>
            )}
          </AnimatePresence>
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-8 w-full border-t border-sidebar-border/40 text-sidebar-foreground/30 hover:text-sidebar-primary transition-colors"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>
    </motion.aside>
  );
}
