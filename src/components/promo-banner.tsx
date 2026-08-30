import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useOfferCountdown } from "@/hooks/use-offer-countdown";
import { Flame, ArrowRight, X } from "lucide-react";

function CountdownPill({
  value,
  label,
  highlight,
}: {
  value: number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <span className="flex flex-col items-center min-w-[36px] rounded-[9px] px-1.5 py-0.5 bg-[var(--v2-panel2)]">
      <strong
        className="text-[13px] leading-tight"
        style={{
          fontVariantNumeric: "tabular-nums",
          color: highlight ? "var(--v2-accent)" : "var(--v2-ink)",
        }}
      >
        {String(value).padStart(2, "0")}
      </strong>
      <span className="text-[8.5px] font-bold tracking-[0.14em] text-[var(--v2-mut)]">
        {label}
      </span>
    </span>
  );
}

export const PromoBanner = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { targetDate, hasPromo, discountPercent } = useOfferCountdown();

  const [dismissed, setDismissed] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!targetDate || !hasPromo) return;

    const calculateTime = () => {
      const now = Date.now();
      const distance = targetDate.getTime() - now;
      if (distance < 0) return null;
      return {
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        ),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      };
    };

    const initial = calculateTime();
    if (initial) setTimeLeft(initial);

    const timer = setInterval(() => {
      const updated = calculateTime();
      if (!updated) {
        clearInterval(timer);
      } else {
        setTimeLeft(updated);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, hasPromo]);

  const shouldShow = useMemo(() => {
    return hasPromo && targetDate && !dismissed;
  }, [hasPromo, targetDate, dismissed]);

  const discountText = discountPercent
    ? `${discountPercent}% off Annual plans`
    : t("Special student pricing is active");

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="flex-shrink-0 z-35 border-b"
          style={{
            background:
              "color-mix(in srgb, var(--v2-accent) 6%, var(--v2-panel))",
            borderColor:
              "color-mix(in srgb, var(--v2-accent) 30%, transparent)",
          }}
        >
          <div className="flex items-center gap-3 px-4 py-2.5 sm:gap-3.5">
            {/* SALE badge */}
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-extrabold tracking-[0.08em] bg-[var(--v2-accent)] text-white">
              <Flame className="w-[13px] h-[13px]" />
              {t("SALE")}
            </span>

            {/* Text */}
            <span className="text-[13.5px] font-semibold text-[var(--v2-ink)]">
              {discountText}
            </span>

            {/* Separator - desktop only */}
            <span
              className="hidden sm:block w-px h-[18px]"
              style={{ background: "var(--v2-line)" }}
            />

            <div className="flex-1" />

            {/* Countdown - desktop only */}
            <div className="hidden sm:flex items-center gap-1.5">
              <CountdownPill
                value={timeLeft.days}
                label={t("DAYS")}
              />
              <CountdownPill
                value={timeLeft.hours}
                label={t("HRS")}
              />
              <CountdownPill
                value={timeLeft.minutes}
                label={t("MIN")}
              />
              <CountdownPill
                value={timeLeft.seconds}
                label={t("SEC")}
                highlight
              />
            </div>

            {/* CTA button */}
            <button
              onClick={() => navigate("/price-page")}
              className="h-8 px-3.5 rounded-full border-none text-white text-[12.5px] font-bold cursor-pointer inline-flex items-center gap-1.5 transition-opacity hover:opacity-90 active:scale-[0.98]"
              style={{ background: "var(--v2-accent)" }}
            >
              {t("Claim")} {discountPercent || 50}% {t("off")}
              <ArrowRight className="w-[13px] h-[13px]" />
            </button>

            {/* Dismiss */}
            <button
              onClick={() => setDismissed(true)}
              title={t("Dismiss")}
              className="w-7 h-7 rounded-[9px] border-none bg-transparent text-[var(--v2-mut)] cursor-pointer grid place-items-center hover:bg-[var(--v2-panel2)] hover:text-[var(--v2-ink)] transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
