import { useState, useEffect } from 'react';
import { mimirIpc } from '@/core/ipc/bridge';

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    if (mimirIpc.isAndroid()) return true;
    const ua = navigator.userAgent || '';
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return true;
    return window.innerWidth < 768;
  });

  useEffect(() => {
    if (mimirIpc.isAndroid()) {
      setIsMobile(true);
      return;
    }

    const handleResize = () => {
      const ua = navigator.userAgent || '';
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      setIsMobile(isMobileDevice || window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}
