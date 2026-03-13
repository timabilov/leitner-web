import { useEffect, useState } from "react";
import { useOfferStore } from "./offer-store";

export const useOfferCountdown = () => {
  const { offerDeadline, hasPromo, discountPercent } = useOfferStore();

  const [targetDate, setTargetDate] = useState<Date | null>(null);

  useEffect(() => {
    if (hasPromo && offerDeadline) {
      const date = new Date(offerDeadline);
      if (!isNaN(date.getTime())) {
        setTargetDate(date);
      } else {
        console.warn("Invalid offer deadline:", offerDeadline);
        setTargetDate(null);
      }
    } else {
      setTargetDate(null);
    }
  }, [offerDeadline, hasPromo]);

  return { targetDate, hasPromo, discountPercent };
};