import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = React.memo(({ 
  value, 
  onChange, 
  placeholder = 'Müşteri ara...' 
}) => {
  return (
    <div className="relative">
      <Search className="h-5 w-5 absolute left-3 top-3 text-gray-400" aria-hidden="true" />
      <input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 w-full rounded-lg border-gray-300 focus:border-purple-500 focus:ring-purple-500"
        aria-label="Müşteri arama"
      />
    </div>
  );
});

SearchBar.displayName = 'SearchBar';