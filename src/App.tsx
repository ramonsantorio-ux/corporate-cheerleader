import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AppLayout from "./components/layout/AppLayout";
import Index from "./pages/Index";
import Feedbacks from "./pages/Feedbacks";
import FeedbackDetail from "./pages/FeedbackDetail";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import Desempenho from "./pages/Desempenho";
import Avaliacoes from "./pages/Avaliacoes";
import Competencias from "./pages/Competencias";
import PDIPage from "./pages/PDI";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import FuncionarioProfile from "./pages/FuncionarioProfile";
import Reunioes from "./pages/Reunioes";
import Eventos from "./pages/Eventos";
import Ausencias from "./pages/Ausencias";
import Colaboradores from "./pages/Colaboradores";


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
