import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, List, BarChart3, Users, Target, Calendar, Settings, AlertTriangle, CalendarDays, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const mainItems = [
  { to: '/', icon: LayoutDashboard, label: 'Geral' },
  { to: '/colaboradores', icon: Users, label: 'Pessoas' },
  { to: '/desempenho', icon: Target, label: 'Avaliações' },
  { to: '/ausencias', icon: CalendarDays, label: 'Ponto' },
];

const moreItems = [
  { to: '/desempenho', icon: Target, label: 'Avaliações' },
  { to: '/eventos', icon: AlertTriangle, label: 'Eventos' },
  { to: '/reunioes', icon: Calendar, label: 'Reuniões' },
  { to: '/relatorios', icon: BarChart3, label: 'Relatórios' },
  { to: '/configuracoes', icon: Settings, label: 'Config.' },
];

export default function MobileNav() {
  const location = useLocation();
  const moreActive = moreItems.some(i => location.pathname.startsWith(i.to));

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border px-1 pb-safe">
      <div className="flex items-center justify-around h-16">
        {mainItems.map((item) => {
          const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors relative',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {isActive && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full bg-primary" />
              )}
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {/* More menu */}
        <Popover>
          <PopoverTrigger asChild>
            <button className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-colors relative',
              moreActive ? 'text-primary' : 'text-muted-foreground'
            )}>
              {moreActive && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full bg-primary" />
              )}
              <MoreHorizontal className="w-5 h-5" />
              <span>Mais</span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" side="top" className="w-48 p-1 mb-2">
            {moreItems.map((item) => {
              const isActive = location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                    isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </PopoverContent>
        </Popover>
      </div>
    </nav>
  );
}
