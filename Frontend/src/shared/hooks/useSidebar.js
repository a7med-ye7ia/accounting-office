import { useState, useEffect, useCallback } from 'react';

export function useSidebar() {
  const getDevice = () => {
    if (typeof window === 'undefined') return 'desktop';
    if (window.innerWidth < 768) return 'mobile';
    if (window.innerWidth < 1024) return 'tablet';
    return 'desktop';
  };

  const [device, setDevice] = useState(() => getDevice());
  const [isOpen, setIsOpen] = useState(() => getDevice() === 'desktop');

  useEffect(() => {
    const handleResize = () => {
      const newDevice = getDevice();
      setDevice(newDevice);
      // Auto-close on tablet, keep desktop open by default
      if (newDevice === 'mobile') {
        setIsOpen(false);
      } else if (newDevice === 'tablet') {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggle = useCallback(() => setIsOpen(v => !v), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return {
    isOpen,
    isMobile: device === 'mobile',
    isTablet: device === 'tablet',
    isDesktop: device === 'desktop',
    device,
    toggle,
    open,
    close,
  };
}

export default useSidebar;
