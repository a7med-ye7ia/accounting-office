import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";

const SidebarContext = createContext(null);

function getDevice() {
  if (typeof window === "undefined") return "desktop";
  if (window.innerWidth < 768) return "mobile";
  if (window.innerWidth < 1024) return "tablet";
  return "desktop";
}

export function SidebarProvider({ children }) {
  const location = useLocation();
  const [device, setDevice] = useState(() => getDevice());
  const [isOpen, setIsOpen] = useState(() => getDevice() === "desktop");

  useEffect(() => {
    const handleResize = () => {
      const next = getDevice();
      setDevice(next);
      if (next === "mobile" || next === "tablet") {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isDrawer = device === "mobile" || device === "tablet";

  useEffect(() => {
    if (isDrawer) setIsOpen(false);
  }, [location.pathname, isDrawer]);

  const toggle = useCallback(() => setIsOpen((v) => !v), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = {
    isOpen,
    isMobile: device === "mobile",
    isTablet: device === "tablet",
    isDesktop: device === "desktop",
    device,
    toggle,
    open,
    close,
  };

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used inside SidebarProvider");
  return ctx;
}
