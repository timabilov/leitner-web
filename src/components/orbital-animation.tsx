// components/OrbitalAnimation.tsx

import React, { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

// Sub-component for a single orbiting icon
const OrbitingIcon = ({
  icon,
  radius,
  duration,
  initialAngle,
}: {
  icon: React.ReactNode;
  radius: number;
  duration: number;
  initialAngle: number;
}) => {
  // A motion value that will animate from 0 to 360 degrees
  const angle = useMotionValue(0);

  // useEffect to start and stop the infinite animation
  useEffect(() => {
    const animation = animate(angle, 360, {
      duration,
      repeat: Infinity,
      ease: 'linear',
    });
    // Cleanup function to stop the animation when the component unmounts
    return () => animation.stop();
  }, [angle, duration]);

  // Transform the angle into x and y coordinates for a circular path
  // We add the initialAngle to offset each icon from the others
  const x = useTransform(angle, (a) => radius * Math.cos(((a + initialAngle) * Math.PI) / 180));
  const y = useTransform(angle, (a) => radius * Math.sin(((a + initialAngle) * Math.PI) / 180));

  return (
    <motion.div
      style={{
        // We use style here because x and y are dynamic motion values
        x,
        y,
      }}
      className="absolute top-1/2 left-1/2" // Center the origin of the orbit
    >
      {icon}
    </motion.div>
  );
};

// Main component to orchestrate the animation
export function OrbitalAnimation({
  mainIcon,
  orbitingIcons,
  radius = 120, // Default radius in pixels
  duration = 10, // Default duration for one full orbit in seconds
}: {
  mainIcon: React.ReactNode;
  orbitingIcons: React.ReactNode[];
  radius?: number;
  duration?: number;
}) {
  const numIcons = orbitingIcons.length;
  // Calculate the angle separation for each icon to space them evenly
  const angleSeparation = 360 / numIcons;

  return (
    <div className="relative flex items-center justify-center w-full h-full">
      {/* 1. The Main, Centered Icon */}
      <div className="z-10">{mainIcon}</div>

      {/* 2. The Orbiting Icons */}
      {orbitingIcons.map((icon, index) => (
        <OrbitingIcon
          key={index}
          icon={icon}
          radius={radius}
          duration={duration}
          initialAngle={index * angleSeparation}
        />
      ))}
    </div>
  );
}