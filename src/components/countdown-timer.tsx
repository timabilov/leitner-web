import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// --- TYPES ---
interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface CountdownTimerProps {
  targetDate: Date;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

// --- CONSTANTS ---
// Changed labels to initials
const TIME_UNITS = [
  { label: "d", value: "days" },
  { label: "h", value: "hours" },
  { label: "m", value: "minutes" },
  { label: "s", value: "seconds" },
] as const;

// --- SUB-COMPONENT: Single Digit Block ---
const TimeUnit = ({
  value,
  label,
  size = "md",
}: {
  value: number;
  label: string;
  size: "xs" | "sm" | "md" | "lg";
}) => {
  // Format to always show 2 digits (e.g. 05)
  const formattedValue = value < 10 ? `0${value}` : value.toString();

  // Size configurations for the BOX
  const boxSizeClasses = {
    xs: "w-7 h-7 text-xs rounded-sm",
    sm: "w-10 h-10 text-lg rounded-md",
    md: "w-14 h-14 text-2xl rounded-lg",
    lg: "w-20 h-24 text-4xl rounded-xl",
  };

  // Size configurations for the LABEL (Initial)
  const labelSizeClasses = {
    xs: "text-[10px] mb-1",
    sm: "text-xs mb-1.5",
    md: "text-sm mb-2",
    lg: "text-base mb-3",
  };

  return (
    <div className="flex items-end gap-1">
      {/* Number Box */}
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden",
          "bg-card border border-border/50 shadow-sm", 
          "text-foreground font-bold tabular-nums",
          boxSizeClasses[size]
        )}
      >
        <AnimatePresence mode="popLayout">
          <motion.span
            key={formattedValue}
            initial={{ y: "100%", opacity: 0, filter: "blur(5px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: "-100%", opacity: 0, filter: "blur(5px)" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {formattedValue}
          </motion.span>
        </AnimatePresence>

        {/* Subtle shine effect */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
      </div>

      {/* Label (Initial) */}
      <span
        className={cn(
          "font-medium text-muted-foreground",
          labelSizeClasses[size]
        )}
      >
        {label}
      </span>
    </div>
  );
};

// --- SUB-COMPONENT: Separator (:) ---
const Separator = ({ size = "md" }: { size: "xs" | "sm" | "md" | "lg" }) => {
  // Height should match the box height to center the colon vertically relative to the number
  const heightClasses = {
    xs: "h-7 text-xs",
    sm: "h-10 text-lg",
    md: "h-14 text-2xl",
    lg: "h-24 text-3xl",
  };

  return (
    <div
      className={cn(
        "flex flex-col justify-center items-center text-muted-foreground/30 font-bold select-none",
        heightClasses[size]
      )}
    >
      <span className="-mt-0.5">:</span>
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function CountdownTimer({
  targetDate,
  size = "md",
  className,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [hasFinished, setHasFinished] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setHasFinished(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (hasFinished) {
    return (
      <div className={cn("text-xl font-bold text-muted-foreground", className)}>
        00d 00h 00m 00s
      </div>
    );
  }

  return (
    <div className={cn("flex items-start gap-1.5", className)}>
      {TIME_UNITS.map((unit, index) => {
        const isLast = index === TIME_UNITS.length - 1;

        return (
          <div key={unit.value} className="flex items-start gap-1.5">
            <TimeUnit
              value={timeLeft[unit.value as keyof TimeLeft]}
              label={unit.value}
              size={size}
            />
            {/* Show separator between units, but not after seconds */}
            {/* {!isLast && <Separator size={size} />} */}
          </div>
        );
      })}
    </div>
  );
}