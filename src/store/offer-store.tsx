import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface OfferState {
  offerDeadline: string | null; // Store as ISO string for serialization
  hasOfferExpired: boolean;
  initializeOffer: (durationInHours?: number) => void;
  resetOffer: () => void;
}

export const useOfferStore = create<OfferState>()(
  persist(
    (set, get) => ({
      offerDeadline: null,
      hasOfferExpired: false,

      initializeOffer: (durationInHours = 24) => {
        const { offerDeadline } = get();
        
        // If a deadline already exists and is in the future, do nothing
        if (offerDeadline) {
          const now = new Date();
          const target = new Date(offerDeadline);
          if (target > now) return;
        }

        // Otherwise, set a new deadline (e.g., 24 hours from now)
        const newDeadline = new Date();
        newDeadline.setHours(newDeadline.getHours() + durationInHours);
        
        set({ 
          offerDeadline: newDeadline.toISOString(),
          hasOfferExpired: false 
        });
      },

      resetOffer: () => set({ offerDeadline: null, hasOfferExpired: false }),
    }),
    {
      name: 'leitner-offer-storage', // Key in localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);