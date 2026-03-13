import { useEffect } from 'react';
import { useOfferStore } from '@/store/offer-store';
import { API_BASE_URL } from '@/services/config';
import { axiosInstance } from '@/services/auth';

export const useInitPromo = () => {

  useEffect(() => {
    const fetchPromo = async () => {
      // ✅ DO THIS: Read state directly (Imperative / Non-reactive)
      // This gets the current value but DOES NOT subscribe to changes.
      const { lastFetched, setPromoFromApi } = useOfferStore.getState();

      const FIVE_MINUTES = 5 * 60 * 1000;
      if (Date.now() - lastFetched < FIVE_MINUTES) {
        return; 
      }

      try {
        const response = await axiosInstance.get(`${API_BASE_URL}/auth/promo/active`);
        
        // This updates the store. 
        // Components that *display* the promo (Sidebar) will re-render.
        // But App.tsx (which doesn't listen to the store anymore) will NOT re-render.
        setPromoFromApi(response.data);
      } catch (error) {
        console.error("Failed to sync promo");
      }
    };

    fetchPromo();
  }, []); 
};