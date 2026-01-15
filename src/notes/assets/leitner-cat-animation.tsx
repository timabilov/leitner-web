"use client";

import { motion } from "framer-motion";

export const LeitnerCatAnimation = () => {
  return (
    <div className="flex items-center justify-center bg-black p-10 rounded-xl">
      <svg
        width="300"
        height="300"
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="penGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4facfe" />
            <stop offset="100%" stopColor="#f093fb" />
          </linearGradient>
        </defs>

        {/* --- 1. THE PEN (Behind the head) --- */}
        <g transform="rotate(45, 250, 250)">
           {/* Pen Body */}
           <rect x="230" y="50" width="40" height="180" rx="20" fill="url(#penGradient)" />
           {/* Pen Tip */}
           <path d="M 230 50 L 250 10 L 270 50 Z" fill="url(#penGradient)" />
        </g>

        {/* --- 2. SPARKLES --- */}
        <g fill="url(#penGradient)">
           <path d="M 320 50 L 330 20 L 340 50 L 370 60 L 340 70 L 330 100 L 320 70 L 290 60 Z" /> {/* Big Star */}
           <path d="M 280 40 L 285 30 L 290 40 L 300 45 L 290 50 L 285 60 L 280 50 L 270 45 Z" /> {/* Small Star Top */}
           <path d="M 350 90 L 355 80 L 360 90 L 370 95 L 360 100 L 355 110 L 350 100 L 340 95 Z" /> {/* Small Star Bot */}
        </g>

        {/* --- 3. CAT HEAD --- */}
        <path 
          d="M 150 120 
             Q 120 100 120 180 
             Q 80 250 100 350 
             Q 150 480 350 450 
             Q 450 420 420 320 
             Q 450 200 400 130 
             Q 380 180 320 180 
             Q 250 160 150 120 Z" 
          fill="white" 
        />

        {/* --- 4. FACE --- */}
        
        {/* Nose */}
        <path 
          d="M 235 300 
             Q 250 290 265 300 
             Q 250 325 235 300 Z" 
          fill="black" 
        />

        {/* Mouth */}
        <path 
          d="M 250 320 Q 220 360 200 320" 
          stroke="black" strokeWidth="10" strokeLinecap="round" fill="none"
        />
        <path 
          d="M 250 320 Q 280 360 300 320" 
          stroke="black" strokeWidth="10" strokeLinecap="round" fill="none"
        />

        {/* Right Eye (Always Open) */}
        <circle cx="330" cy="280" r="25" fill="black" />

        {/* --- 5. ANIMATED LEFT EYE --- */}
        
        {/* State A: Open Eye (Initially Visible) */}
        <motion.circle 
          cx="170" cy="280" r="25" fill="black"
          animate={{ opacity: [1, 1, 0, 0, 1] }}
          transition={{ 
            duration: 4, 
            times: [0, 0.8, 0.85, 0.95, 1], // Stays open 80% of time, blinks quickly
            repeat: Infinity 
          }}
        />

        {/* State B: Wink/Closed Eye (Initially Hidden) */}
        <motion.path 
          d="M 140 280 Q 170 250 200 280" 
          stroke="black" strokeWidth="10" strokeLinecap="round" fill="none"
          animate={{ opacity: [0, 0, 1, 1, 0] }}
          transition={{ 
            duration: 4, 
            times: [0, 0.8, 0.85, 0.95, 1], 
            repeat: Infinity 
          }}
        />

      </svg>
    </div>
  );
};