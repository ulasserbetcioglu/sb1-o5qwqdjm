import { useCallback } from 'react';
import { translations, Language } from '../translations';

// Get browser language or stored language preference
const getDefaultLanguage = (): Language => {
  const stored = localStorage.getItem('language') as Language;
  if (stored && ['tr', 'en', 'az'].includes(stored)) {
    return stored;
  }
  
  const browserLang = navigator.language.split('-')[0];
  if (browserLang === 'tr') return 'tr';
  if (browserLang === 'az') return 'az';
  return 'en';
};

export const useTranslation = () => {
  const currentLang = getDefaultLanguage();

  const t = useCallback((key: string) => {
    const keys = key.split('.');
    let value: any = translations[currentLang];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key;
      }
    }
    
    return value || key;
  }, [currentLang]);

  const setLanguage = useCallback((lang: Language) => {
    localStorage.setItem('language', lang);
    window.location.reload();
  }, []);

  return { t, currentLang, setLanguage };
};