import React from 'react';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';

const languages = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

export const LanguageSwitcher = ({ currentLang, onLanguageChange, isDark = false }) => {
  const currentLanguage = languages.find(lang => lang.code === currentLang);
  const textColor = isDark ? '#f5ede4' : 'inherit';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-2"
          style={{ color: textColor }}
        >
          <span className="text-lg">{currentLanguage?.flag}</span>
          <span className="text-xs tracking-[0.1em] uppercase">{currentLanguage?.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end"
        style={{ 
          backgroundColor: '#000000',
          borderColor: 'rgba(212, 169, 104, 0.3)',
          borderWidth: '1px'
        }}
      >
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => onLanguageChange(lang.code)}
            className="cursor-pointer gap-3 py-3 px-4"
            style={{ 
              color: '#f5ede4',
            }}
          >
            <span className="text-lg">{lang.flag}</span>
            <span className="text-xs tracking-[0.1em] uppercase">{lang.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};