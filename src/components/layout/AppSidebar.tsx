import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, BarChart3, Settings, ChevronLeft, ChevronRight,
  Users, Target, Shield, LogOut, Calendar, AlertTriangle, CalendarDays,
  ChevronDown, Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import busatoGlobo from '@/assets/busato-globo.jpeg';

interface NavGroup {
  label: string;
  items: { to: string; icon: any; label: string }[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Principal',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Geral' },
    ],
  },
  {
    label: 'Gestão de Pessoas',
    items: [
      { to: '/colaboradores', icon: Users, label: 'Colaboradores' },
      { to: '/ausencias', icon: CalendarDays, label: 'Ponto / Férias' },
      { to: '/reunioes', icon: Calendar, label: 'Reuniões 1:1' },
    ],
  },
  {
    label: 'Desempenho & Feedback',
    items: [
      { to: '/desempenho', icon: Target, label: 'Avaliações' },
    ],
  },
  {
    label: 'Operações',
    items: [
      { to: '/eventos', icon: AlertTriangle, label: 'Eventos' },
      { to: '/relatorios', icon: BarChart3, label: 'Relatórios' },
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
      animate={{ width: collapsed ? 68 : 256 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="hidden md:flex flex-col h-screen sticky top-0 z-30 bg-sidebar border-r border-sidebar-border"
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border flex-shrink-0">
        <img src={busatoGlobo} alt="Busato" className="w-9 h-9 rounded-lg flex-shrink-0" />
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.15 }}>
              <span className="text-sidebar-foreground font-bold text-sm tracking-tight block leading-none">BUSATO</span>
              <span className="text-sidebar-foreground/50 text-[10px] font-medium tracking-widest">GESTÃO DE CONTRATO</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto scrollbar-thin">
        {allGroups.map((group, gi) => (
          <div key={group.label} className={cn(gi > 0 && 'mt-1')}>
            {/* Group label */}
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-5 pt-3 pb-1.5"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/40">
                    {group.label}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Collapsed divider */}
            {collapsed && gi > 0 && (
              <div className="mx-3 my-2 border-t border-sidebar-border/50" />
            )}

            {/* Items */}
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
                      'group flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150 relative',
                      isActive
                        ? 'bg-sidebar-primary/15 text-sidebar-primary'
                        : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60'
                    )}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-sidebar-primary"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}

                    <item.icon className={cn(
                      'w-[18px] h-[18px] flex-shrink-0 transition-colors',
                      isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80'
                    )} />

                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -4 }}
                          transition={{ duration: 0.12 }}
                          className="whitespace-nowrap"
                        >
                          {item.label}
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

      {/* Footer */}
      <div className="border-t border-sidebar-border flex-shrink-0">
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-5 py-3 w-full text-[13px] text-sidebar-foreground/60 hover:text-destructive transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap font-medium">
                Sair
              </motion.span>
            )}
          </AnimatePresence>
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-10 w-full border-t border-sidebar-border/50 text-sidebar-foreground/40 hover:text-sidebar-primary transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </motion.aside>
  );
}
