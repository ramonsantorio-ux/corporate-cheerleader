import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, List, BarChart3, Settings, ChevronLeft, ChevronRight, MessageCircle, Users, Target, Shield, LogOut, Calendar, AlertTriangle, CalendarDays } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/colaboradores', icon: Users, label: 'Colaboradores' },
  { to: '/feedbacks', icon: List, label: 'Feedbacks' },
  { to: '/desempenho', icon: Target, label: 'Desempenho' },
  { to: '/relatorios', icon: BarChart3, label: 'Relatórios' },
  { to: '/reunioes', icon: Calendar, label: 'Reuniões 1:1' },
  { to: '/clima', icon: Smile, label: 'Clima' },
  { to: '/ausencias', icon: CalendarDays, label: 'Ponto / Férias' },
  { to: '/configuracoes', icon: Settings, label: 'Configurações' },
];

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { isAdmin, signOut } = useAuth();

  const allItems = isAdmin ? [...navItems, { to: '/admin', icon: Shield, label: 'Administração' }] : navItems;

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="hidden md:flex flex-col bg-sidebar border-r border-sidebar-border h-screen sticky top-0 z-30"
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
          <MessageCircle className="w-4 h-4 text-sidebar-primary-foreground" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sidebar-foreground font-semibold text-sm whitespace-nowrap">Gestão Porto</motion.span>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {allItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink key={item.to} to={item.to} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors duration-150 ${isActive ? 'bg-sidebar-accent text-sidebar-primary' : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}>
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (<motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">{item.label}</motion.span>)}
              </AnimatePresence>
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border">
        <button onClick={signOut} className="flex items-center gap-3 px-5 py-3 w-full text-sm text-sidebar-foreground hover:text-destructive transition-colors">
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <AnimatePresence>{!collapsed && (<motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">Sair</motion.span>)}</AnimatePresence>
        </button>
      </div>

      <button onClick={() => setCollapsed(!collapsed)} className="flex items-center justify-center h-12 border-t border-sidebar-border text-sidebar-foreground hover:text-sidebar-primary transition-colors">
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </motion.aside>
  );
}
