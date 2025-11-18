import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AIIcon from '@/note-detail/ai-icon';

/**
 * An animated sticky button that expands on hover into an alert block.
 * @param {object} props
 * @param {() => void} props.onClick - The function to call when the button is clicked.
 */
export function StickyAiButton({ onClick }) {
 const [isHovered, setIsHovered] = useState(false);

  return (
    // --- 1. THE INVISIBLE HOVER/POSITIONING WRAPPER ---
    // This div's only jobs are to be fixed to the screen and detect hover.
    // It is slightly larger than the button to create a reliable hover area.
    <div
      className="fixed bottom-6 right-6 z-50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* --- 2. THE VISUAL, ANIMATED ELEMENT --- */}
      {/* This div handles all visual animation (width, shape, background). */}
      {/* It uses an explicit `animate` prop, which is more reliable than `layout` for this use case. */}
      <motion.div
        className="
          relative flex items-center h-14
          bg-foreground text-background
          shadow-lg cursor-pointer
          overflow-hidden
        "
        // Explicitly animate the width and border-radius
        animate={{
          width: isHovered ? 'auto' : 56, // Animate width between auto and fixed size
          borderRadius:  '12px', // Animate shape from circle to rectangle
        }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        onClick={onClick}
      >
        {/* The content that appears on hover */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              className="flex items-center pl-6 pr-20" // Padding to make space for the icon
              // Animation for the text to fade in smoothly
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.1, duration: 0.2 } }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
            >
              <div className="whitespace-nowrap">
                <p className="font-bold text-sm">Generate Quiz & Flashcards</p>
                <p className="text-xs text-neutral-400">AI-powered study tools from your notes</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* The icon, positioned absolutely to stay on the right */}
        <div className="absolute top-0 right-0 h-14 w-14 flex items-center justify-center">
          <AIIcon className="h-29 w-29" />
        </div>
      </motion.div>
    </div>
  );
}