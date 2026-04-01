import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSettingsStore = create(
  persist(
    (set) => ({
      // Default language
      language:  'en' , 
      
      // Setter function
      setLanguage: (lngCode) => set({ language: lngCode }),
    }),
    {
      name: 'language-storage', // The key name in localStorage
    }
  )
);