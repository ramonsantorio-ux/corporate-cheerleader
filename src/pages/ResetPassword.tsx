import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { KeyRound, Eye, EyeOff } from 'lucide-react';
import { FastInput } from '@/components/ui/fast-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
        setChecking(false);
      }
      if (event === 'SIGNED_IN' && session) {
        const hash = window.location.hash;
        if (hash.includes('type=recovery')) {
          setReady(true);
          setChecking(false);
        }
      }
    });

    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setReady(true);
      setChecking(false);
    }

    const params = new URLSearchParams(window.location.search);
    if (params.get('type') === 'recovery') {
      setReady(true);
      setChecking(false);
    }

    const timeout = setTimeout(() => {
      setChecking(false);
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toast.error('Preencha todos os campos');
      return;
    }
    if (password.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Senha alterada com sucesso!');
      navigate('/login');
    }
    setLoading(false);
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-muted-foreground text-sm">Verificando link de recuperação...</div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground text-sm">
            Link de recuperação inválido ou expirado.
          </p>
          <Button variant="outline" onClick={() => navigate('/login')}>
            Voltar para Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="glass-card rounded-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mx-auto">
              <KeyRound className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">Nova Senha</h1>
            <p className="text-sm text-muted-foreground">Defina sua nova senha</p>
          </div>

          <form onSubmit={handleReset} className="space-y-4">
            <div className="space-y-2">
              <Label>Nova senha</Label>
              <div className="relative">
                <FastInput
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onValueChange={setPassword}
                  autoComplete="new-password"
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
            <div className="space-y-2">
              <Label>Confirmar nova senha</Label>
              <FastInput
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onValueChange={setConfirmPassword}
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Aguarde...' : 'Salvar nova senha'}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
