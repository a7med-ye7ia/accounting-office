import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const SidebarContext = createContext(null);

export function SidebarProvider({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [isTablet, setIsTablet] = useState(false);

  // Detect screen size changes
  useEffect(() => {
    const handleResize = () => {
      const isTabletScreen = window.innerWidth < 1024 && window.innerWidth >= 768;
      setIsTablet(isTabletScreen);
      // Default tablet to closed
      if (isTabletScreen && desktopOpen) {
        setDesktopOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const toggleMobile = useCallback(() => setMobileOpen(v => !v), []);

  const openDesktop = useCallback(() => setDesktopOpen(true), []);
  const closeDesktop = useCallback(() => setDesktopOpen(false), []);
  const toggleDesktop = useCallback(() => setDesktopOpen(v => !v), []);

  return (
    <SidebarContext.Provider
      value={{
        mobileOpen,
        openMobile,
        closeMobile,
        toggleMobile,
        desktopOpen,
        openDesktop,
        closeDesktop,
        toggleDesktop,
        isTablet,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used inside SidebarProvider');
  return ctx;
}
