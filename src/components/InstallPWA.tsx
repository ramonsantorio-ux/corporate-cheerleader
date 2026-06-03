import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share } from 'lucide-react';

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      setIsStandalone(true);
      return;
    }

    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      // For iOS, show the manual prompt after a short delay
      const hasSeenPrompt = localStorage.getItem('has_seen_ios_install_prompt');
      if (!hasSeenPrompt) {
        setTimeout(() => setShowPrompt(true), 3000);
      }
    }

    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    if (isIOS) {
      localStorage.setItem('has_seen_ios_install_prompt', 'true');
    }
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white/90 backdrop-blur-md border border-sidebar-border shadow-2xl rounded-2xl p-4 z-50"
      >
        <button 
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4 pr-6">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Download className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">Instalar Aplicativo</h3>
            
            {isIOS ? (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Para instalar no seu iPhone/iPad, toque no botão <b>Compartilhar</b> <Share className="inline w-3 h-3 mx-1" /> abaixo e selecione <b>Adicionar à Tela de Início</b>.
              </p>
            ) : (
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
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
