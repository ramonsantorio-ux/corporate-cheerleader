import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { useOfflineSync } from "./hooks/useOfflineSync";
import AppLayout from "./components/layout/AppLayout";
import Index from "./pages/Index";
import FeedbackDetail from "./pages/FeedbackDetail";
import Configuracoes from "./pages/Configuracoes";
import Desempenho from "./pages/Desempenho";
import AutoAvaliacaoFit from "./pages/AutoAvaliacaoFit";
import Admin from "./pages/Admin";
import CadastroMetas from "./pages/CadastroMetas";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import FuncionarioProfile from "./pages/FuncionarioProfile";
import Eventos from "./pages/Eventos";
import Ausencias from "./pages/Ausencias";
import Colaboradores from "./pages/Colaboradores";
import Organograma from "./pages/Organograma";
import Sucessao from "./pages/Sucessao";
import EvolucaoContrato from "./pages/EvolucaoContrato";
import GestaoNotificacoes from "./pages/GestaoNotificacoes";
import DiscTest from "./pages/DiscTest";
import Treinamentos from "./pages/Treinamentos";
import AssessmentHub from "./pages/AssessmentHub";
import { InstallPWA } from './components/InstallPWA';

class ErrorBoundary extends React.Component<any, { hasError: boolean; errorId: string }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, errorId: '' };
  }
  static getDerivedStateFromError() {
    const errorId = Math.random().toString(36).substring(2, 8).toUpperCase();
    return { hasError: true, errorId };
  }
  componentDidCatch(error: any, info: any) {
    // Log do erro para debugging — NÃO exposto ao usuário
    console.error('[ErrorBoundary] Erro capturado:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-4 max-w-md p-8">
            <div className="text-6xl">⚠️</div>
            <h1 className="text-2xl font-bold text-foreground">Algo deu errado</h1>
            <p className="text-muted-foreground text-sm">
              Ocorreu um erro inesperado. Por favor, recarregue a página.
              Se o problema persistir, entre em contato com o suporte.
            </p>
            <p className="text-xs text-muted-foreground font-mono">Código: {this.state.errorId}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Recarregar página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,       // 5 minutos — não refetch desnecessário
      gcTime: 1000 * 60 * 10,          // 10 minutos de cache
      refetchOnWindowFocus: false,      // Não refetch ao focar a janela
      retry: 1,                         // Apenas 1 retry em caso de erro
    },
  },
});

// Protege rotas que exigem perfil de administrador
function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function ProtectedRoutes() {
  const { user, loading } = useAuth();
  
  useOfflineSync();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Carregando...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Index />} />
          <Route path="/colaboradores" element={<Colaboradores />} />
          <Route path="/cadastro" element={<Navigate to="/colaboradores" replace />} />
          <Route path="/feedbacks" element={<Navigate to="/desempenho?tab=feedbacks" replace />} />
          <Route path="/feedbacks/:id" element={<FeedbackDetail />} />
          <Route path="/novo" element={<Navigate to="/desempenho?tab=feedbacks" replace />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="/desempenho" element={<Desempenho />} />
          <Route path="/desempenho/avaliacoes" element={<Navigate to="/desempenho?tab=metas" replace />} />
          <Route path="/desempenho/competencias" element={<Navigate to="/desempenho?tab=fit-cultural" replace />} />
          <Route path="/desempenho/pdi" element={<Navigate to="/desempenho?tab=pdi" replace />} />
          <Route path="/funcionario/:id" element={<FuncionarioProfile />} />
          <Route path="/eventos" element={<Eventos />} />
          <Route path="/ausencias" element={<Ausencias />} />
          <Route path="/organograma" element={<Organograma />} />
          <Route path="/sucessao" element={<Navigate to="/desempenho?tab=sucessao" replace />} />
          <Route path="/evolucao" element={<EvolucaoContrato />} />
          <Route path="/cadastro-metas" element={<CadastroMetas />} />
          <Route path="/notificacoes" element={<GestaoNotificacoes />} />
          <Route path="/treinamentos" element={<Treinamentos />} />
          <Route path="/assessments" element={<AssessmentHub />} />
          {/* Legacy compat */}
          <Route path="/disc" element={<DiscTest />} />
          <Route path="/disc/:id" element={<DiscTest />} />

          <Route path="/admin" element={<AdminGuard><Admin /></AdminGuard>} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <InstallPWA />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/autoavaliacao-fit-cultural" element={<AutoAvaliacaoFit />} />
            <Route path="/assessment/:type" element={<AssessmentHub />} />
            <Route path="/assessment/:type/:id" element={<AssessmentHub />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
