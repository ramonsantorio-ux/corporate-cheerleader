import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldAlert, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PAGE_ROUTE_MAP: { key: string; path: string }[] = [
  { key: 'dashboard', path: '/' },
  { key: 'colaboradores', path: '/colaboradores' },
  { key: 'organograma', path: '/organograma' },
  { key: 'ausencias', path: '/ausencias' },
  { key: 'desempenho', path: '/desempenho' },
  { key: 'treinamentos', path: '/treinamentos' },
  { key: 'eventos', path: '/eventos' },
  { key: 'evolucao', path: '/evolucao' },
  { key: 'notificacoes', path: '/notificacoes' },
  { key: 'configuracoes', path: '/configuracoes' },
  { key: 'disc', path: '/disc' },
];

export function AccessDenied() {
  const navigate = useNavigate();
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="p-4 bg-destructive/10 text-destructive rounded-full">
        <ShieldAlert className="w-12 h-12" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight">Acesso Restrito</h2>
      <p className="text-muted-foreground text-sm max-w-md">
        Seu perfil de acesso não possui permissão para visualizar este módulo ou página.
        Se você acredita que isto é um erro, solicite a liberação de acesso ao Administrador do sistema.
      </p>
      <Button onClick={() => navigate('/')} variant="outline" className="gap-2">
        <Home className="w-4 h-4" /> Voltar para a Página Inicial
      </Button>
    </div>
  );
}

export function PageGuard({ pageKey, children }: { pageKey: string; children: React.ReactNode }) {
  const { canView } = usePermissions();
  const { isAdmin, loading } = useAuth();

  if (loading) return null;
  if (isAdmin || canView(pageKey)) {
    return <>{children}</>;
  }

  // Se a rota for o Dashboard ('/') e o usuario nao tiver permissao de ver o dashboard,
  // redireciona automaticamente para o primeiro modulo permitido
  if (pageKey === 'dashboard') {
    const firstAllowed = PAGE_ROUTE_MAP.find(item => item.key !== 'dashboard' && canView(item.key));
    if (firstAllowed) {
      return <Navigate to={firstAllowed.path} replace />;
    }
  }

  return <AccessDenied />;
}
