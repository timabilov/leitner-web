import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Globe, Mic, ChevronDown, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- 1. The Custom Gradient Sparkle SVG ---
export const SparkleHot = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 17 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4.9084 10.4408C5.12969 10.5895 5.39479 10.6692 5.66661 10.669C5.93843 10.6688 6.20337 10.5885 6.42436 10.4395C6.64527 10.284 6.81317 10.0713 6.90749 9.82725L7.39911 8.404C7.51704 8.06868 7.71653 7.76393 7.9817 7.51405C8.24686 7.26417 8.57036 7.07606 8.92641 6.96473L10.465 6.49387C10.7231 6.40673 10.9455 6.24545 11.1009 6.03283C11.2562 5.82021 11.3367 5.56699 11.3309 5.30896C11.3251 5.05093 11.2334 4.80114 11.0686 4.59489C10.9038 4.38863 10.6743 4.23635 10.4126 4.15956L8.89807 3.69804C8.54165 3.58719 8.21768 3.39945 7.95202 3.14979C7.68635 2.90013 7.48634 2.59547 7.36794 2.26011L6.86782 0.814171C6.77705 0.575395 6.60994 0.368958 6.38947 0.223252C6.169 0.0775459 5.906 -0.000272414 5.63663 0.000499399C5.36341 -0.000595284 5.09673 0.0791723 4.87427 0.22853C4.65182 0.377888 4.48485 0.589285 4.39694 0.832846L3.89256 2.28678C3.77412 2.6122 3.57904 2.90818 3.32191 3.15258C3.06478 3.39697 2.75227 3.58344 2.40777 3.69804L0.871975 4.16623C0.615405 4.2516 0.393512 4.41019 0.237216 4.61991C0.0809205 4.82964 -0.00199089 5.08004 3.63063e-05 5.33623C0.0020635 5.59242 0.0889282 5.84163 0.248525 6.04914C0.408122 6.25665 0.632501 6.41211 0.890393 6.49387L2.40211 6.95673C2.75901 7.06899 3.08324 7.25799 3.34908 7.50874C3.61492 7.75949 3.81507 8.06509 3.93365 8.40133L4.43236 9.84193C4.52162 10.082 4.6888 10.2914 4.90982 10.4395M12.0929 15.8031C12.2849 15.9316 12.5147 16.0006 12.7503 16.0005C12.9882 15.9982 13.2195 15.9264 13.4121 15.795C13.6048 15.6636 13.7493 15.479 13.8257 15.2668L14.177 14.2504C14.2521 14.0397 14.3796 13.8463 14.5454 13.6889C14.7112 13.5315 14.9166 13.4127 15.1404 13.3434L16.2342 13.0072C16.4604 12.9342 16.6563 12.7957 16.7938 12.6115C16.9314 12.4273 17.0035 12.2068 16.9999 11.9817C16.9963 11.7566 16.9171 11.5383 16.7737 11.3581C16.6303 11.1778 16.4301 11.045 16.2016 10.9784L15.1192 10.6463C14.8954 10.5757 14.692 10.4573 14.5248 10.3004C14.3577 10.1435 14.2314 9.95237 14.1558 9.74188L13.7987 8.70945C13.7219 8.49743 13.5762 8.31354 13.3822 8.18385C13.1882 8.05415 12.9557 7.98523 12.7178 7.98686C12.4798 7.98848 12.2485 8.06056 12.0565 8.19289C11.8645 8.32522 11.7216 8.51108 11.6481 8.72413L11.2981 9.74055C11.2259 9.94951 11.1035 10.14 10.9403 10.2971C10.7771 10.4542 10.5776 10.5737 10.3574 10.6463L9.25794 10.9837C9.09152 11.0382 8.94088 11.1285 8.81798 11.2473C8.69508 11.3662 8.60331 11.5104 8.54995 11.6685C8.49659 11.8266 8.48311 11.9942 8.51059 12.1581C8.53806 12.3219 8.60573 12.4775 8.70822 12.6124C8.84849 12.7992 9.04684 12.9392 9.27494 13.0126L10.3559 13.342C10.5805 13.4133 10.7844 13.5327 10.9516 13.6908C11.1188 13.8489 11.2447 14.0414 11.3194 14.2531L11.6778 15.2855C11.7554 15.4942 11.9 15.6751 12.0915 15.8031"
      fill="url(#paint0_linear_44_1599)"
    />
    <defs>
      <linearGradient
        id="paint0_linear_44_1599"
        x1="-8.50141"
        y1="7.99975"
        x2="21.2511"
        y2="7.99975"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#813ADC" />
        <stop offset="1" stopColor="#FF5151" />
      </linearGradient>
    </defs>
  </svg>
);

// --- 2. Animated Grid Background Component ---
const AnimatedGrid = () => {
  // CONFIGURATION
  const squareSize = 80; // Bigger squares
  const gap = 4;         // Gap between squares to make corners visible
  const radius = 12;     // Rounded corners size
  const strokeColor = "#f4f4f5"; // zinc-100
  const activeColor = "#e4e4e7"; // zinc-200
  
  // Calculate the actual size of the rectangle shape inside the pattern
  const rectSize = squareSize - gap; 
  // Offset to center the rect within the grid cell
  const offset = gap / 2;

  // Generate random squares to light up
  const flickeringSquares = useMemo(() => {
    const cols = 30; // Fewer columns needed since squares are bigger
    const rows = 20;
    const squares = [];
    
    for (let i = 0; i < 20; i++) {
      squares.push({
        id: i,
        // Calculate grid position
        col: Math.floor(Math.random() * cols),
        row: Math.floor(Math.random() * rows),
        delay: Math.random() * 5,
        duration: 2 + Math.random() * 3
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
            {/* The Static Grid Square */}
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
        
        {/* Draw the base grid */}
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />

        {/* Draw the Flickering Squares */}
        <svg x="0" y="0" className="overflow-visible">
          {flickeringSquares.map((sq) => (
            <motion.rect
              key={sq.id}
              x={sq.col * squareSize + offset}
              y={sq.row * squareSize + offset}
              width={rectSize}
              height={rectSize}
              rx={radius} // Match the radius of the grid
              fill={activeColor}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0] }}
              transition={{
                duration: sq.duration,
                repeat: Infinity,
                delay: sq.delay,
                ease: "easeInOut"
              }}
            />
          ))}
        </svg>
      </svg>
      
      {/* Gradient fade at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
    </div>
  );
};

// --- 3. Main Login Page ---
const Login = () => {
  const messages = [
    "Record, edit and learn smart",
    "Create quizzes from your notes",
    "Flashcards for better memory"
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [messages.length]);

  return (
    <div className="relative min-h-screen w-full  text-slate-900 selection:bg-purple-100 font-sans overflow-hidden">
      
      {/* BACKGROUND: Animated Grid */}
      <AnimatedGrid />

      {/* Floating Particles */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[10%] top-[20%] h-0.5 w-0.5 rounded-full bg-slate-400 opacity-40"></div>
        <div className="absolute right-[15%] top-[30%] h-0.5 w-0.5 rounded-full bg-slate-400 opacity-30"></div>
      </div>

      {/* Header */}
      <header className="flex w-full items-center justify-between p-6 md:p-8 relative z-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
           <Mic className="h-6 w-6" strokeWidth={2.5} />
        </div>

        <button className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors bg-white/50 backdrop-blur-sm border border-transparent hover:border-zinc-200">
          <Globe className="h-4 w-4" />
          <span>English</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-20 pt-10 text-center relative z-10">
        
        {/* Animated Headline */}
        <div className="relative mb-8 w-full max-w-4xl min-h-[140px] flex items-center justify-center">
          
          <SparkleIcon className="absolute -right-4 top-0 h-6 w-6 text-purple-400 md:right-12 md:h-8 md:w-8 animate-pulse" />
          <SparkleIcon className="absolute bottom-0 right-20 h-5 w-5 text-pink-300 md:h-6 md:w-6" />
          <SparkleIcon className="absolute left-4 top-1/2 h-5 w-5 text-indigo-300 md:left-12 md:h-6 md:w-6" />

          <AnimatePresence mode="wait">
            <motion.h1
              key={index}
              initial={{ y: 20, opacity: 0, filter: 'blur(10px)' }}
              animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
              exit={{ y: -20, opacity: 0, filter: 'blur(10px)' }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-4xl font-black tracking-tight text-slate-900 md:text-6xl leading-[1.1] max-w-3xl mx-auto"
            >
              {messages[index]}
              <span className="inline-block ml-3 align-middle">
                <SparkleHot className="w-8 h-8 md:w-12 md:h-12" />
              </span>
            </motion.h1>
          </AnimatePresence>
        </div>

        {/* Social Proof */}
        <div className="mb-12 flex flex-col items-center gap-2">
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <div className="flex flex-col items-center leading-tight">
            <span className="text-lg font-bold text-slate-900">170,000+</span>
            <span className="text-sm text-slate-600">People loved</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="w-full max-w-sm space-y-4">
          <button className="relative flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-base font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-2">
            <GoogleLogo className="h-5 w-5" />
            Continue with Google
          </button>

          <button className="relative flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-base font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-200 focus:ring-offset-2">
            <AppleLogo className="h-6 w-6 text-black" />
            Continue with Apple
          </button>
        </div>

        {/* Footer */}
        <p className="mt-8 max-w-xs text-center text-xs text-slate-500">
          By signing in, you agree to our{" "}
          <Link to="/terms" className="underline decoration-slate-300 underline-offset-2 hover:text-slate-800">
            Term of Use
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="underline decoration-slate-300 underline-offset-2 hover:text-slate-800">
            Privacy Policy
          </Link>
        </p>

      </main>
    </div>
  );
};

export default Login;

// --- Helper SVGs ---

function SparkleIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
    </svg>
  );
}

function GoogleLogo({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AppleLogo({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74s2.57-.99 4.31-.74c.51.02 1.96.2 2.91 1.59-.09.06-1.74 1.02-1.74 3.06 0 2.45 2.16 3.29 2.27 3.34-.02.04-.35 1.18-.78 2.09-.69 1.48-1.43 2.96-2.05 2.89zM15.02 5.23c.77-1.02 1.3-2.42 1.15-3.83-1.12.05-2.49.77-3.29 1.74-.71.85-1.34 2.22-1.17 3.55 1.25.1 2.53-.44 3.31-1.46z" />
    </svg>
  );
}