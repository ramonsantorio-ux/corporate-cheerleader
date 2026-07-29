import { useEffect } from 'react';

/**
 * Trata atualizações do PWA de forma segura.
 */
export function PWAUpdateHandler() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg && reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    }).catch(() => {});
  }, []);

  return null;
}

