import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface OfferState {
  hasPromo: boolean;
  offerDeadline: string | null; // ISO string
  discountPercent: number;
  promoName: string | null;
  lastFetched: number;
  // Actions
  setPromoFromApi: (data: PromoApiResponse) => void;
  clearOffer: () => void;
}

// Define the shape of your API response for type safety
interface PromoApiResponse {
  has_promo: boolean;
  claim_until?: string; // ISO date string from Go backend
  discount_percent?: number;
  name?: string;
}

export const useOfferStore = create<OfferState>()(
  persist(
    (set) => ({
      hasPromo: false,
      offerDeadline: null,
      discountPercent: 0,
      promoName: null,
      lastFetched: 0, // Default 0
      setPromoFromApi: (data: PromoApiResponse) => {
        if (!data.has_promo) {
          set({ hasPromo: false, offerDeadline: null, discountPercent: 0, promoName: null,  lastFetched: Date.now(),  });
          return;
        }

        set({
          hasPromo: true,
          offerDeadline: data.claim_until || null,
          discountPercent: data.discount_percent || 0,
          promoName: data.name || null,
          lastFetched: Date.now(), 
        });
      },

      clearOffer: () => set({
        hasPromo: false,
        offerDeadline: null,
        discountPercent: 0,
        promoName: null
      }),
    }),
    {
      name: 'leitner-promo-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);