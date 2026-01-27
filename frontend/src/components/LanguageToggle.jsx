import { useState } from 'react';
import { translations } from '../utils/translations';

export const useLanguage = () => {
  const [lang, setLang] = useState('en');

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'km' : 'en');
  };

  const t = (key) => {
    return translations[lang][key] || key;
  };

  return { lang, toggleLang, t };
};