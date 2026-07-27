import { useEffect } from 'react';

/**
 * Detecta quando um novo Service Worker está disponível e força
 * o reload da página para carregar o novo bundle imediatamente.
 *
 * Com skipWaiting: true no workbox, o novo SW toma controle assim
 * que instalado. Este componente ouve o evento 'controllerchange'
 * que é disparado quando isso acontece, e recarrega a página.
 */
export function PWAUpdateHandler() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let refreshing = false;

    const handleControllerChange = () => {
      // Evita loops infinitos de reload
      if (refreshing) return;
      refreshing = true;
      // O novo SW tomou controle — recarrega para usar o novo bundle
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  // Não renderiza nada — só lógica
  return null;
}
