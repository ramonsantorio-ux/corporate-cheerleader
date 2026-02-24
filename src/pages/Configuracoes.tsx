import { motion } from 'framer-motion';
import { Bell, Shield, Users, Palette, Download } from 'lucide-react';

export default function Configuracoes() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie as preferências do sistema</p>
      </motion.div>

      <div className="space-y-3">
        {[
          { icon: Bell, title: 'Notificações', desc: 'Configure alertas por e-mail e push' },
          { icon: Shield, title: 'Privacidade', desc: 'Controle a visibilidade dos feedbacks' },
          { icon: Users, title: 'Equipe', desc: 'Gerencie membros e permissões' },
          { icon: Palette, title: 'Aparência', desc: 'Personalize cores e temas' },
          { icon: Download, title: 'Exportar Dados', desc: 'Exporte feedbacks em CSV ou PDF' },
        ].map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:shadow-md transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <item.icon className="w-5 h-5 text-accent-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold">{item.title}</h3>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-xl p-5"
      >
        <h2 className="font-semibold mb-1">Instalar no Celular</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Acesse o FeedbackHub diretamente do seu smartphone. Abra o menu do navegador e selecione "Adicionar à tela inicial".
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-lg p-3">
          <Download className="w-4 h-4 flex-shrink-0" />
          <span>iOS: Safari → Compartilhar → Tela de Início | Android: Chrome → Menu → Instalar app</span>
        </div>
      </motion.div>
    </div>
  );
}
