import { useEffect, useState } from 'react';
import { useOfferStore } from '@/store/offer-store';

export const useOfferCountdown = () => {
  const { offerDeadline, initializeOffer } = useOfferStore();
  const [targetDate, setTargetDate] = useState<Date | null>(null);

  useEffect(() => {
    // 1. Initialize the offer if it doesn't exist (e.g., 72 hours / 3 days)
    initializeOffer(72);
  }, [initializeOffer]);

  useEffect(() => {
    // 2. Hydrate the date from the store to local state
    // This prevents server/client mismatch if you use SSR/Next.js
    if (offerDeadline) {
      setTargetDate(new Date(offerDeadline));
    }
  }, [offerDeadline]);

  return { targetDate };
};