import React, { createContext, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Set initial language to Arabic (ar)
    if (!localStorage.getItem('i18nextLng')) {
      i18n.changeLanguage('ar');
    }
  }, [i18n]);

  useEffect(() => {
    // Update HTML attributes when language changes
    const lang = i18n.language;
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    const fontFamily = lang === 'ar' ? 'font-arabic' : 'font-sans';

    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    document.documentElement.className = fontFamily;

    localStorage.setItem('i18nextLng', lang);
  }, [i18n.language]);

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  const currentLanguage = i18n.language;

  return (
    <LanguageContext.Provider value={{ changeLanguage, currentLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}
