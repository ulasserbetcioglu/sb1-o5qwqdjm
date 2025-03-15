import React from 'react';
import { Bug } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { useTranslation } from '../hooks/useTranslation';

export const Footer: React.FC = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t mt-auto">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2">
            <Bug className="h-6 w-6 text-blue-600 flex-shrink-0" />
            <span className="text-lg font-semibold text-gray-900">İlaçlama Takip</span>
          </div>
          
          <div className="flex flex-col items-center space-y-4 md:space-y-0 md:flex-row md:items-center">
            <nav className="flex flex-wrap justify-center gap-4 md:gap-6 px-4">
              <a href="/about" className="text-gray-600 hover:text-gray-900 whitespace-nowrap">
                {t('about')}
              </a>
              <a href="/contact" className="text-gray-600 hover:text-gray-900 whitespace-nowrap">
                {t('contact')}
              </a>
              <a href="/privacy" className="text-gray-600 hover:text-gray-900 whitespace-nowrap">
                {t('privacy')}
              </a>
              <a href="/terms" className="text-gray-600 hover:text-gray-900 whitespace-nowrap">
                {t('terms')}
              </a>
              <div className="flex items-center gap-4">
                <a 
                  href="/login" 
                  className="text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
                >
                  {t('login')}
                </a>
                <span className="text-gray-300">|</span>
                <a 
                  href="/" 
                  className="text-blue-600 hover:text-blue-700 font-medium whitespace-nowrap"
                >
                  {t('register')}
                </a>
              </div>
            </nav>
            
            <div className="flex items-center space-x-4 md:ml-8">
              <LanguageSelector />
              <div className="text-gray-500 text-sm text-center">
                © {currentYear} İlaçlama Takip. {t('allRightsReserved')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};