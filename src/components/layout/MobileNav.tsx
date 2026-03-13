import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, List, BarChart3, Users, Target, Calendar, Settings } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Home' },
  { to: '/colaboradores', icon: Users, label: 'Colab.' },
  { to: '/feedbacks', icon: List, label: 'Feedbacks' },
  { to: '/desempenho', icon: Target, label: 'Desemp.' },
  { to: '/reunioes', icon: Calendar, label: '1:1' },
  { to: '/configuracoes', icon: Settings, label: 'Config.' },
];

export default function MobileNav() {
  const location = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border px-2 pb-safe">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink key={item.to} to={item.to} className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
