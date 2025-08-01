export interface LanguageOption {
  code: string;
  name: string;
  englishName: string;
  flag?: string;
  assemblyAICode?: string; // For Assembly AI transcription mapping
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    englishName: 'English',
    flag: '🇺🇸',
    assemblyAICode: 'en_us'
  },
  {
    code: 'ar',
    name: 'العربية',
    englishName: 'Arabic',
    flag: '🇸🇦',
    assemblyAICode: 'ar'
  },
  {
    code: 'es',
    name: 'Español',
    englishName: 'Spanish',
    flag: '🇪🇸',
    assemblyAICode: 'es'
  },
  {
    code: 'fr',
    name: 'Français',
    englishName: 'French',
    flag: '🇫🇷',
    assemblyAICode: 'fr'
  },
  {
    code: 'de',
    name: 'Deutsch',
    englishName: 'German',
    flag: '🇩🇪',
    assemblyAICode: 'de'
  },
  {
    code: 'it',
    name: 'Italiano',
    englishName: 'Italian',
    flag: '🇮🇹',
    assemblyAICode: 'it'
  },
  {
    code: 'pt',
    name: 'Português',
    englishName: 'Portuguese',
    flag: '🇵🇹',
    assemblyAICode: 'pt'
  },
  {
    code: 'hi',
    name: 'हिन्दी',
    englishName: 'Hindi',
    flag: '🇮🇳',
    assemblyAICode: 'hi'
  },
  {
    code: 'ja',
    name: '日本語',
    englishName: 'Japanese',
    flag: '🇯🇵',
    assemblyAICode: 'ja'
  },
  {
    code: 'ko',
    name: '한국어',
    englishName: 'Korean',
    flag: '🇰🇷',
    assemblyAICode: 'ko'
  },
  {
    code: 'zh',
    name: '中文',
    englishName: 'Chinese',
    flag: '🇨🇳',
    assemblyAICode: 'zh'
  },
  {
    code: 'ru',
    name: 'Русский',
    englishName: 'Russian',
    flag: '🇷🇺',
    assemblyAICode: null // Assembly AI doesn't support Russian currently
  },
  {
    code: 'tr',
    name: 'Türkçe',
    englishName: 'Turkish',
    flag: '🇹🇷',
    assemblyAICode: null // Assembly AI doesn't support Turkish currently
  },
];

// Helper functions
export const getLanguageByCode = (code: string): LanguageOption | undefined => {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
};

export const getLanguageDisplayName = (code: string): string => {
  const language = getLanguageByCode(code);
  return language ? `${language.flag} ${language.name}` : code;
};

export const getAssemblyAILanguageCode = (courseLanguage: string): string | null => {
  const language = getLanguageByCode(courseLanguage);
  return language?.assemblyAICode || null;
};

// Default language
export const DEFAULT_LANGUAGE = 'en';
