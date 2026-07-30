import { NavLink, useLocation } from 'react-router-dom';
import { Activity, Users, Target, Settings, AlertTriangle, CalendarDays, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';

const mainItems = [
  { to: '/', icon: Activity, label: 'Movimentações', key: 'dashboard' },
  { to: '/colaboradores', icon: Users, label: 'Pessoas', key: 'colaboradores' },
  { to: '/desempenho', icon: Target, label: 'Gestão', key: 'desempenho' },
  { to: '/ausencias', icon: CalendarDays, label: 'Ponto', key: 'ausencias' },
];

const moreItems = [
  { to: '/eventos', icon: AlertTriangle, label: 'Eventos SSMA', key: 'eventos' },
  { to: '/configuracoes', icon: Settings, label: 'Configuras', key: 'configuracoes' },
];

export default function MobileNav() {
  const location = useLocation();
  const { isAdmin, permissions } = useAuth();

  const allowedMain = mainItems.filter(i => isAdmin || permissions[i.key]?.can_view === true);
  const allowedMore = moreItems.filter(i => isAdmin || permissions[i.key]?.can_view === true);

  const moreActive = allowedMore.some(i => location.pathname.startsWith(i.to));

  if (allowedMain.length === 0 && allowedMore.length === 0) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border px-1 pb-safe">
      <div className="flex items-center justify-around h-16">
        {allowedMain.map((item) => {
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

        {allowedMore.length > 0 && (
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
              {allowedMore.map((item) => {
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
        )}
      </div>
    </nav>
  );
}
