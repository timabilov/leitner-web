import React, { useEffect, useMemo } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export const FatSparkle = ({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    style={style}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2C13.5 2 15 7.5 19 9.5C23 11.5 23 12.5 19 14.5C15 16.5 13.5 22 12 22C10.5 22 9 16.5 5 14.5C1 12.5 1 11.5 5 9.5C9 7.5 10.5 2 12 2Z"
      fill="url(#fat_sparkle_gradient)"
    />
    <defs>
      <linearGradient
        id="fat_sparkle_gradient"
        x1="2"
        y1="2"
        x2="22"
        y2="22"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stopColor="#A855F7" />
        <stop offset="100%" stopColor="#EC4899" />
      </linearGradient>
    </defs>
  </svg>
);


export const RisingBubbles = React.memo(() => {
  const mouseX = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const relativeX = e.clientX - window.innerWidth / 2;
      mouseX.set(relativeX * 0.5);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX]);

  const bubbles = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => ({
      id: i + Math.random(),
      size: Math.floor(Math.random() * 1) + 9,
      left: Math.floor(Math.random() * 100),
      duration: Math.floor(Math.random() * 15) + 15,
      delay: Math.floor(Math.random() * 5),
    }));
  }, []);

  return (
    <div className="absolute inset-0 z-1 overflow-hidden pointer-events-none">
      {bubbles.map((bubble, index) => (
        <motion.div
          key={bubble.id + " _" + index}
          className="absolute rounded-full bg-transparent"
          style={{
            left: `${bubble.left}%`,
            width: bubble.size,
            height: bubble.size,
            bottom: -100,
            opacity: 0.6,
            x: springX,
          }}
          animate={{
            y: [0, -window.innerHeight - 200],
            rotate: 720,
            opacity: [0.6, 0.6, 0],
          }}
          transition={{
            y: {
              duration: bubble.duration,
              repeat: Infinity,
              ease: "linear",
              delay: bubble.delay,
            },
            rotate: {
              duration: bubble.duration,
              repeat: Infinity,
              ease: "linear",
              delay: bubble.delay,
            },
            opacity: {
              duration: bubble.duration,
              repeat: Infinity,
              ease: "linear",
              delay: bubble.delay,
            },
          }}
        >
          <FatSparkle className="w-full h-full" />
        </motion.div>
      ))}
    </div>
  );
});