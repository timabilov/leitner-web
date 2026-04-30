
import React, { useMemo } from "react";
import { motion } from "framer-motion";

export const AnimatedGrid = React.memo(() => {
  const squareSize = 80;
  const gap = 4;
  const radius = 12;
  const strokeColor = "#f4f4f5";
  const activeColor = "#e4e4e7";
  const rectSize = squareSize - gap;
  const offset = gap / 2;

  const flickeringSquares = useMemo(() => {
    const cols = 30;
    const rows = 20;
    const squares = [];
    for (let i = 0; i < 20; i++) {
      squares.push({
        id: i,
        col: Math.floor(Math.random() * cols),
        row: Math.floor(Math.random() * rows),
        delay: Math.random() * 5,
        duration: 2 + Math.random() * 3,
      });
    }
    return squares;
  }, []);

  return (
    <div className="absolute inset-0 -z-20 overflow-hidden ">
      <svg className="absolute inset-0 h-full w-full [mask-image:radial-gradient(100%_100%_at_top_center,white,transparent)]">
        <defs>
          <pattern
            id="grid-pattern"
            width={squareSize}
            height={squareSize}
            x="0"
            y="0"
            patternUnits="userSpaceOnUse"
          >
            <rect
              x={offset}
              y={offset}
              width={rectSize}
              height={rectSize}
              rx={radius}
              fill="none"
              stroke={strokeColor}
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        <svg x="0" y="0" className="overflow-visible">
          {flickeringSquares.map((sq) => (
            <motion.rect
              key={sq.id}
              x={sq.col * squareSize + offset}
              y={sq.row * squareSize + offset}
              width={rectSize}
              height={rectSize}
              rx={radius}
              fill={activeColor}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0] }}
              transition={{
                duration: sq.duration,
                repeat: Infinity,
                delay: sq.delay,
                ease: "easeInOut",
              }}
            />
          ))}
        </svg>
      </svg>
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
    </div>
  );
});