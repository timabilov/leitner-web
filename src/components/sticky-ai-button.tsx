import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AIIcon from '@/note-detail/ai-icon';
import { useTranslation } from 'react-i18next'; // Import the hook

/**
 * An animated sticky button that expands on hover into an alert block.
 * @param {object} props
 * @param {() => void} props.onClick - The function to call when the button is clicked.
 */
export function StickyAiButton({ onClick }) {
  const { t } = useTranslation(); // Initialize the hook
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="fixed bottom-6 right-6 z-50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        className="
          relative flex items-center h-14
          bg-foreground text-background
          shadow-lg cursor-pointer
          overflow-hidden
        "
        animate={{
          width: isHovered ? 'auto' : 56,
          borderRadius:  '12px',
        }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        onClick={onClick}
      >
        <AnimatePresence>
          {isHovered && (
            <motion.div
              className="flex items-center pl-6 pr-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.1, duration: 0.2 } }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
            >
              <div className="whitespace-nowrap">
                <p className="font-bold text-sm">{t("Generate Quiz & Flashcards")}</p>
                <p className="text-xs text-neutral-400">{t("AI-powered study tools from your notes")}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="absolute top-0 right-0 h-14 w-14 flex items-center justify-center">
          <AIIcon className="h-29 w-29" />
        </div>
      </motion.div>
    </div>
  );
}