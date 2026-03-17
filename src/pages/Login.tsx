import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { LogIn, Eye, EyeOff, UserPlus } from 'lucide-react';
import { FastInput } from '@/components/ui/fast-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import busatoLogo from '@/assets/busato-logo-full.png';

export default function Login() {
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isFirstSetup, setIsFirstSetup] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Carregando...</div>
      </div>
    );
  }
  if (user) return <Navigate to="/" replace />;

  async function handleForgotPassword() {
    if (!email) {
      toast.error('Digite seu e-mail para recuperar a senha');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
    }
    setLoading(false);
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message === 'Invalid login credentials'
        ? 'E-mail ou senha incorretos'
        : error.message);
    }
    setLoading(false);
  }

  async function handleFirstSetup(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password || !fullName) {
      toast.error('Preencha todos os campos');
      return;
    }
    if (password.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres');
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from('user_roles').insert({ user_id: data.user.id, role: 'admin' });
      toast.success('Conta administrador criada! Entrando...');
      await supabase.auth.signInWithPassword({ email, password });
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="glass-card rounded-2xl p-8 space-y-6">
          <div className="text-center space-y-3">
            <img src={busatoLogo} alt="Busato" className="h-14 mx-auto object-contain" />
            <p className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">Gestão de Contrato</p>
            <p className="text-sm text-muted-foreground">
              {isFirstSetup ? 'Configure a conta administrador' : 'Faça login para acessar o sistema'}
            </p>
          </div>

          <form onSubmit={isFirstSetup ? handleFirstSetup : handleLogin} className="space-y-4">
            {isFirstSetup && (
              <div className="space-y-2">
                <Label>Nome completo</Label>
                <FastInput
                  type="text"
                  placeholder="Seu nome"
                  value={fullName}
                  onValueChange={setFullName}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>E-mail</Label>
              <FastInput
                type="email"
                placeholder="seu@email.com"
                value={email}
                onValueChange={setEmail}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <div className="relative">
                <FastInput
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onValueChange={setPassword}
                  autoComplete={isFirstSetup ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Aguarde...' : isFirstSetup ? (
                <><UserPlus className="w-4 h-4 mr-2" /> Criar Conta Admin</>
              ) : (
                <><LogIn className="w-4 h-4 mr-2" /> Entrar</>
              )}
            </Button>
          </form>

          {!isFirstSetup && (
            <div className="text-center">
              <button
                onClick={handleForgotPassword}
                className="text-xs text-primary hover:underline"
                disabled={loading}
              >
                Esqueci minha senha
              </button>
            </div>
          )}

          <div className="text-center">
            <button
              onClick={() => setIsFirstSetup(!isFirstSetup)}
              className="text-xs text-primary hover:underline"
            >
              {isFirstSetup ? 'Já tenho conta, fazer login' : 'Primeiro acesso? Criar conta admin'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
