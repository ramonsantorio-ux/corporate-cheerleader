import React from "react";
import { Toaster } from "@/components/ui/toaster";

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '50px', background: 'red', color: 'white', zIndex: 9999, position: 'absolute', width: '100%', height: '100%' }}>
          <h1>RUNTIME ERROR!</h1>
          <pre>{this.state.error?.toString()}</pre>
          <pre>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AppLayout from "./components/layout/AppLayout";
import Index from "./pages/Index";
import FeedbackDetail from "./pages/FeedbackDetail";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import Desempenho from "./pages/Desempenho";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import FuncionarioProfile from "./pages/FuncionarioProfile";
import Reunioes from "./pages/Reunioes";
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
import Feedback360 from "./pages/Feedback360";
import { InstallPWA } from './components/InstallPWA';


const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Carregando...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Index />} />
        <Route path="/colaboradores" element={<Colaboradores />} />
        <Route path="/cadastro" element={<Navigate to="/colaboradores" replace />} />
        <Route path="/feedbacks" element={<Navigate to="/desempenho?tab=feedbacks" replace />} />
        <Route path="/feedbacks/:id" element={<FeedbackDetail />} />
        <Route path="/novo" element={<Navigate to="/desempenho?tab=feedbacks" replace />} />
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
        <Route path="/desempenho" element={<Desempenho />} />
        <Route path="/desempenho/avaliacoes" element={<Navigate to="/desempenho?tab=metas" replace />} />
        <Route path="/desempenho/competencias" element={<Navigate to="/desempenho?tab=fit-cultural" replace />} />
        <Route path="/desempenho/pdi" element={<Navigate to="/desempenho?tab=pdi" replace />} />
        <Route path="/funcionario/:id" element={<FuncionarioProfile />} />
        <Route path="/reunioes" element={<Reunioes />} />
        <Route path="/eventos" element={<Eventos />} />
        <Route path="/ausencias" element={<Ausencias />} />
        <Route path="/organograma" element={<Organograma />} />
        <Route path="/sucessao" element={<Sucessao />} />
        <Route path="/evolucao" element={<ErrorBoundary><EvolucaoContrato /></ErrorBoundary>} />
        <Route path="/notificacoes" element={<GestaoNotificacoes />} />
        <Route path="/treinamentos" element={<Treinamentos />} />
        <Route path="/assessments" element={<Treinamentos />} />
        <Route path="/assessment/:type" element={<AssessmentHub />} />
        <Route path="/assessment/:type/:id" element={<AssessmentHub />} />
        <Route path="/feedback360" element={<Feedback360 />} />
        {/* Legacy compat */}
        <Route path="/disc" element={<DiscTest />} />
        <Route path="/disc/:id" element={<DiscTest />} />

        <Route path="/admin" element={<Admin />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
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
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
