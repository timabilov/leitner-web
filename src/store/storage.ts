// import { StateStorage } from 'zustand/middleware'

// For React Native, use MMKV; for web, use localStorage
let storage: any;

  // Web storage using localStorage
  storage = {
    set: (name: string, value: string) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(name, value);
      }
    },
    getString: (name: string) => {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(name);
      }
      return null;
    },
    delete: (name: string) => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(name);
      }
    },
  };


export { storage };

export const zustandStorage = {
  setItem: (name, value) => {
    return storage.set(name, value)
  },
  getItem: (name) => {
    const value = storage.getString(name)
    return value ?? null
  },
  removeItem: (name) => {
    return storage.delete(name)
  },
}