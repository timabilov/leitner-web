import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { zustandStorage } from './storage'; // Adjust the import path as needed
import i18n from "i18next";
// import { ISO_TO_LANGUAGE } from '@/assets/languages';
// import * as Sentry from '@sentry/react-native';

interface UserStore {
  userId: string;
  companyId: string;
  fullName: string;
  accessToken: string;
  refreshToken: string;
  email: string;
  photo?: string;
  pushToken?: string;
  notificationsDenied?: boolean;
  pushTokenRegistered?: boolean;
  subscriptionStatus: 'free' | 'pro' | 'pro_plus' | 'trial';
  selectedFolder?: {name: string, id: number, items: any};
  folders?: {name: string, id: number, items: any}[];
  effectiveSubscription: 'pro_plus';
  companyTrialStarted?: number; // ms
  companyTrialDays?: number;
  companyName?: string;
  subscriptionLastCheckedDate?: number;
  fullAdminAccess?: boolean; // Optional parameter for full admin access
  countryCode?: string;
  totalNotesCount?: number | 0;
  isLoggedIn: () => boolean,
  setEmail: (email: string) => void;
  setFullName: (name: string) => void;
  setAccessToken: (token: string) => void;
  setRefreshToken: (token: string) => void;
  setPushToken: (token: string) => void;
  setNotificationsDenied: (denied: boolean) => void;
  setPushTokenRegistered: (isRegistered: boolean) => void;
  setSubscriptionStatus: (status: 'free' | 'pro' | 'pro_plus' | 'trial') => void;
  setSelectedFolder: (folder: {name: string, id: number, items: any}) => void;
  setEffectiveSubscription: (subscription: 'pro_plus') => void;
  setCompanyTrialStarted: (timestamp: number) => void;
  setCompanyTrialDays: (days: number) => void;
  setCompanyName: (name: string) => void;
  setSubscriptionLastCheckedDate: (timestamp: number) => void;
  setUserData: (
    userId: string,
    fullName: string,
    email: string,
    companyId: string,
    subscriptionStatus: 'free' | 'pro' | 'pro_plus' | 'trial',
    companyName?: string,
    companyTrialStarted?: number,
    companyTrialDays?: number,
    photo?: string,
    fullAdminAccess?: boolean, // Optional parameter for full admin access
  ) => void;
  clearStore: () => void;
  setCountryCode: (code: string) => void;
  setFolders: (folders:  {name: string, id: number, items: any}[]) => void;
  setAllNotesCount: (count: number) => void;
}

export const useUserStore = create<UserStore>()(
  devtools(persist(
    (set, get) => ({
      userId: '',
      countryCode: '',
      companyId: '',
      fullName: '',
      accessToken: '',
      refreshToken: '',
      email: '',
      pushToken: undefined,
      notificationsDenied: undefined,
      pushTokenRegistered: undefined,
      folders: [],
      totalNotesCount: 0,
      subscriptionStatus: 'free',
      effectiveSubscription: 'pro_plus',
      companyTrialStarted: undefined,
      companyTrialDays: undefined,
      companyName: undefined,
      subscriptionLastCheckedDate: undefined,
      isLoggedIn: () => get().userId !== undefined && get().userId !== '',
      setCountryCode: (countryCode) => set({countryCode}),
      setEmail: (email) => set({ email }),
      setPushToken: (token) => set({ pushToken: token }),
      setNotificationsDenied: (denied) => set({ notificationsDenied: denied }),
      setPushTokenRegistered: (isRegistered) => set({ pushTokenRegistered: isRegistered }),
      setFullName: (name) => set({ fullName: name }),
      setAccessToken: (token) => set({ accessToken: token }),
      setRefreshToken: (token) => set({ refreshToken: token }),
      setSubscriptionStatus: (status) => set({ subscriptionStatus: status }),
      setSelectedFolder: (selectedFolder?) => set({ selectedFolder }),
      setFolders: (folders) => set({folders}),
      setAllNotesCount: (count) => set({ totalNotesCount: count }),
      setEffectiveSubscription: (subscription) => set({ effectiveSubscription: subscription }),
      setCompanyTrialStarted: (timestamp) => set({ companyTrialStarted: timestamp }),
      setCompanyTrialDays: (days) => set({ companyTrialDays: days }),
      setCompanyName: (name) => set({ companyName: name }),
      setSubscriptionLastCheckedDate: (timestamp) => set({ subscriptionLastCheckedDate: timestamp }),
      setUserData: (
        userId: string, fullName: string, email: string, companyId: string,
        subscriptionStatus: 'free' | 'pro' | 'pro_plus' | 'trial',
        companyName?: string,
        companyTrialStarted?: number,
        companyTrialDays?: number,
        photo?: string,
        fullAdminAccess?: boolean, // Optional parameter for full admin access

      ) =>
        set({
          userId: userId,
          companyId: companyId,
          fullName: fullName,
          email: email,
          subscriptionStatus: subscriptionStatus,
          companyName: companyName,
          companyTrialStarted: companyTrialStarted,
          companyTrialDays: companyTrialDays,
          photo: photo,
          fullAdminAccess: fullAdminAccess,
        }),
      clearStore: () =>
        set({
          userId: '',
          companyId: '',
          fullName: '',
          accessToken: '',
          refreshToken: '',
          email: '',
          subscriptionStatus: 'free',
          effectiveSubscription: 'pro_plus',
          companyTrialStarted: undefined,
          companyTrialDays: undefined,
          companyName: undefined,
          subscriptionLastCheckedDate: undefined,
          countryCode: '',
          pushTokenRegistered: undefined,
        }),
    }),
    {
      name: 'user-store', // Unique name for the storage key
      storage: createJSONStorage(() => zustandStorage), // Custom storage adapter
      onRehydrateStorage: (state) => {
        let storeLanguage = (i18n.language || 'en');
        if ( state.countryCode && typeof state.countryCode  === 'string' /*&& ISO_TO_LANGUAGE && state.countryCode in ISO_TO_LANGUAGE*/)
          //storeLanguage =  ISO_TO_LANGUAGE[state.countryCode].lng_code;
        if (!i18n.isInitialized) {
          //  Sentry.captureException({
          //   error: 'i18n is not initialized yet' }, {
          //   extra: {
          //     message: 'Error on onRehydrateStorage',
          //     userId: state.userId,
          //     language: storeLanguage
          //   },
          // });
          console.warn('i18n not initialized yet, deferring language change');
        return;
      }else {
        try {
          if (state.countryCode  && state.countryCode !== i18n.language ) {
            i18n.changeLanguage(storeLanguage)    
        }
        }catch(error) {
          console.log('error while changeLanguage on rehydration storage', error)
          // Sentry.captureException({
          //   error: 'error while changeLanguage on rehydration storage' }, {
          //   extra: {
          //     message: 'Error on onRehydrateStorage',
          //     userId: state.userId,
          //     language:  storeLanguage
          //   },
          // });
        }
      }   
      }
    },
    {
      name: 'useUserStore Devtools',
    }
  )
));