import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, MoreVertical } from 'lucide-react';

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      setIsStandalone(true);
      return;
    }

    // Check device type
    const ua = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroidDevice = /android/i.test(ua);
    
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // Para iOS ou Android, sempre mostrar após um pequeno atraso caso não tenha pego o evento
    const hasSeenPrompt = sessionStorage.getItem('has_seen_install_prompt');
    if (!hasSeenPrompt) {
      setTimeout(() => setShowPrompt(true), 3000);
    }

    const handler = (e: Event) => {
      // Guardar o evento para o nosso botão caso o usuário perca o aviso nativo
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowPrompt(false);
      }
    } else {
      // Se clicou em instalar mas não tem o prompt (ex: navegador não suporta via botão)
      // O texto abaixo já orientará o usuário
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('has_seen_install_prompt', 'true');
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white/95 backdrop-blur-md border border-sidebar-border shadow-2xl rounded-2xl p-4 z-50"
      >
        <button 
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4 pr-6">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Download className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">Instalar Aplicativo</h3>
            
            {isIOS ? (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Para instalar no seu iPhone/iPad, toque em <b>Compartilhar</b> <Share className="inline w-3 h-3 mx-1" /> na barra do navegador e selecione <b>Adicionar à Tela de Início</b>.
              </p>
            ) : deferredPrompt ? (
              <>
                <p className="text-xs text-muted-foreground mt-1 mb-3">
                  Instale o Gestão de Contratos no seu aparelho para usar o Modo Offline.
                </p>
                <button
                  onClick={handleInstallClick}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium px-4 py-2 rounded-lg transition-colors w-full"
                >
                  Instalar Agora
                </button>
              </>
            ) : (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Para instalar, acesse as <b>opções/menu principal</b> do seu navegador e escolha <b>Adicionar à Tela Inicial</b> ou <b>Instalar App</b>.
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
