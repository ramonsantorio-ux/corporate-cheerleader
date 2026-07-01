import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Palette, Download, Moon, Sun } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useTheme } from '@/components/ThemeProvider';

export default function Configuracoes() {
  const { theme, setTheme } = useTheme();
  const [notifVencimento, setNotifVencimento] = useState(true);
  const [notifGlosas, setNotifGlosas] = useState(true);
  const [notifSSMA, setNotifSSMA] = useState(true);

  function toggleTheme() {
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
    toast.success(`Tema alterado para ${newTheme === 'dark' ? 'escuro' : 'claro'}`);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie as preferências do sistema</p>
      </motion.div>

      <Tabs defaultValue="aparencia" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="aparencia" className="text-xs sm:text-sm"><Palette className="w-4 h-4 mr-1 hidden sm:inline" />Aparência</TabsTrigger>
          <TabsTrigger value="notificacoes" className="text-xs sm:text-sm"><Bell className="w-4 h-4 mr-1 hidden sm:inline" />Notificações</TabsTrigger>
        </TabsList>

        {/* Aparência */}
        <TabsContent value="aparencia">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-6 space-y-6">
            <div>
              <h3 className="font-semibold mb-1">Tema</h3>
              <p className="text-sm text-muted-foreground mb-4">Alterne entre modo claro e escuro</p>
              <div className="flex items-center gap-4">
                <Sun className="w-5 h-5 text-warning" />
                <Switch checked={theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)} onCheckedChange={toggleTheme} />
                <Moon className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground ml-2">{(theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) ? 'Modo escuro' : 'Modo claro'}</span>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Notificações */}
        <TabsContent value="notificacoes">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-6 space-y-5">
            <div>
              <h3 className="font-semibold mb-4">Preferências de Notificação</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Vencimento de Contratos</Label>
                    <p className="text-xs text-muted-foreground">Alertar quando um contrato estiver próximo do fim da vigência</p>
                  </div>
                  <Switch checked={notifVencimento} onCheckedChange={v => { setNotifVencimento(v); toast.success('Preferência salva'); }} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Novas Multas ou Glosas</Label>
                    <p className="text-xs text-muted-foreground">Receber alerta quando uma nova ocorrência financeira for lançada</p>
                  </div>
                  <Switch checked={notifGlosas} onCheckedChange={v => { setNotifGlosas(v); toast.success('Preferência salva'); }} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Alertas de SSMA</Label>
                    <p className="text-xs text-muted-foreground">Notificações de auditorias ou novos incidentes de segurança</p>
                  </div>
                  <Switch checked={notifSSMA} onCheckedChange={v => { setNotifSSMA(v); toast.success('Preferência salva'); }} />
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl p-5">
        <h2 className="font-semibold mb-1">Instalar no Celular</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Acesse o Gestão de Contratos diretamente do seu smartphone. Abra o menu do navegador e selecione "Adicionar à tela inicial".
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-lg p-3">
          <Download className="w-4 h-4 flex-shrink-0" />
          <span>iOS: Safari → Compartilhar → Tela de Início | Android: Chrome → Menu → Instalar app</span>
        </div>
      </motion.div>
    </div>
  );
}
