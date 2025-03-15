import React from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { Languages } from 'lucide-react';

export const LanguageSelector: React.FC = () => {
  const { currentLang, setLanguage } = useTranslation();

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center space-x-2">
        <Languages className="h-5 w-5 text-gray-400" />
        <select
          value={currentLang}
          onChange={(e) => setLanguage(e.target.value as 'tr' | 'en' | 'az')}
          className="bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-700 cursor-pointer"
        >
          <option value="tr">Türkçe</option>
          <option value="en">English</option>
          <option value="az">Azərbaycan</option>
        </select>
      </div>
    </div>
  );
};