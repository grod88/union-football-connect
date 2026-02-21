import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { translations, type Locale, type TranslationKeys } from './translations';

interface LanguageContextType {
  locale: Locale;
  t: TranslationKeys;
  toggleLocale: () => void;
  setLocale: (locale: Locale) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem('ufl-locale');
    return (saved === 'en' ? 'en' : 'pt-BR') as Locale;
  });

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('ufl-locale', newLocale);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'pt-BR' ? 'en' : 'pt-BR');
  }, [locale, setLocale]);

  return (
    <LanguageContext.Provider value={{ locale, t: translations[locale], toggleLocale, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be inside LanguageProvider');
  return ctx;
};
