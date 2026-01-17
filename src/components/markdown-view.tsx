import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
<<<<<<< Updated upstream
import React, { useState, useEffect, useRef, useMemo } from 'react';
=======
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, FileQuestion, MoreVertical } from 'lucide-react'; // Icons
>>>>>>> Stashed changes
import './markdown-view.css';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Button } from './ui/button';
import AIIcon from '@/note-detail/assets/ai-icon';
import { CatIcon } from 'lucide-react';
import CatLogo from '@/note-detail/assets/cat-logo';
import AIPenIcon from '@/note-detail/assets/ai-pen-icon';
import CatPenIcon from '@/notes/assets/cat-pen-icon';
import QuizPenIcon from '@/note-detail/assets/quiz-pen-icon';
import { useTranslation } from 'react-i18next';

<<<<<<< Updated upstream
// --- Helper function ---
=======
// --- A simple helper function to create a URL-friendly ID ---
>>>>>>> Stashed changes
export const slugify = (text: string) => {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

<<<<<<< Updated upstream
=======
// Types for the selection state
>>>>>>> Stashed changes
interface SelectionState {
  x: number;
  y: number;
  show: boolean;
  text: string;
}

const MarkdownView = ({ 
  children, 
  onExplain, 
  onQuiz 
}: { 
  children: string, 
  onExplain?: (text: string) => void, 
  onQuiz?: (text: string) => void 
}) => {
<<<<<<< Updated upstream
   const { t } = useTranslation();

  const [selectionMenu, setSelectionMenu] = useState<SelectionState>({ x: 0, y: 0, show: false, text: '' });
  const containerRef = useRef<HTMLDivElement>(null);

  // --- 1. SELECTION HANDLER ---
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !containerRef.current?.contains(selection.anchorNode)) {
        setSelectionMenu(prev => prev.show ? { ...prev, show: false } : prev);
=======
  
  // --- 1. Selection State ---
  const [selectionMenu, setSelectionMenu] = useState<SelectionState>({ x: 0, y: 0, show: false, text: '' });
  const containerRef = useRef<HTMLDivElement>(null);

  // --- 2. Handle Text Selection ---
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      
      // If no selection or selection is inside our container but empty
      if (!selection || selection.isCollapsed || !containerRef.current?.contains(selection.anchorNode)) {
        setSelectionMenu(prev => ({ ...prev, show: false }));
>>>>>>> Stashed changes
        return;
      }

      const text = selection.toString().trim();
      if (!text) return;

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
<<<<<<< Updated upstream
      const x = rect.right; 
      const y = rect.top;

      setSelectionMenu({ x, y, show: true, text });
    };

    const handleScroll = () => {
      setSelectionMenu(prev => prev.show ? { ...prev, show: false } : prev);
    };

    document.addEventListener('mouseup', handleSelectionChange);
    document.addEventListener('keyup', handleSelectionChange);
    document.addEventListener('scroll', handleScroll, true); 
=======
      // Calculate position relative to viewport, adjusted for scrolling
      // We position it centered above the selection
      const x = rect.left + (rect.width / 2);
      const y = rect.top - 10; // 10px above the text

      setSelectionMenu({
        x,
        y,
        show: true,
        text
      });
    };

    // Listen to mouseup (when user finishes selecting) and keyup (shift+arrow selection)
    document.addEventListener('mouseup', handleSelectionChange);
    document.addEventListener('keyup', handleSelectionChange);
    // Hide menu on scroll to prevent misalignment
    document.addEventListener('scroll', () => setSelectionMenu(prev => ({ ...prev, show: false })), true);
>>>>>>> Stashed changes

    return () => {
      document.removeEventListener('mouseup', handleSelectionChange);
      document.removeEventListener('keyup', handleSelectionChange);
<<<<<<< Updated upstream
      document.removeEventListener('scroll', handleScroll, true); 
    };
  }, []);

  const handleAction = (action: 'explain' | 'quiz') => {
    if (action === 'explain' && onExplain) onExplain(selectionMenu.text);
    if (action === 'quiz' && onQuiz) onQuiz(selectionMenu.text);
    setSelectionMenu(prev => ({ ...prev, show: false }));
  };

  // --- 2. MEMOIZE RENDERERS ---
  const customRenderers = useMemo(() => ({
=======
      document.removeEventListener('scroll', () => {});
    };
  }, []);

  // --- 3. Action Handlers ---
  const handleAction = (action: 'explain' | 'quiz') => {
    if (action === 'explain' && onExplain) onExplain(selectionMenu.text);
    if (action === 'quiz' && onQuiz) onQuiz(selectionMenu.text);
    
    // Optional: Clear selection after action
    window.getSelection()?.removeAllRanges();
    setSelectionMenu(prev => ({ ...prev, show: false }));
  };

  const customRenderers = {
>>>>>>> Stashed changes
    p: ({ node, ...props }: any) => {
      if (
        node.children.length === 1 &&
        node.children[0].tagName === 'strong' &&
        (node.children[0].children[0]?.value || '').endsWith(':')
      ) {
        return <h2 className='text-2xl font-bold text-balance mb-4 mt-6' {...props} />;
      }

      const childrenWithBreaks: React.ReactNode[] = [];
      React.Children.forEach(props.children, (child) => {
        if (typeof child === 'string') {
          const lines = child.split('\n');
          lines.forEach((line, index) => {
            if (line) {
              childrenWithBreaks.push(
                <span key={`${line}-${index}`} style={{ display: 'block' }}>
                  {line}
                </span>
              );
            }
          });
        } else {
          childrenWithBreaks.push(child);
        }
      });
      return <p className='leading-7 mb-4'>{childrenWithBreaks}</p>;
    },
    strong: ({ node, ...props }: any) => {
      const textValue = node.children[0]?.value || '';
      const elementId = slugify(textValue);
      return <strong id={elementId} className="markdown-strong text-xl font-bold text-balance" {...props} />;
    }
<<<<<<< Updated upstream
  }), []); 

  // --- 3. MEMOIZE CONTENT ---
  const markdownContent = useMemo(() => (
    <Markdown remarkPlugins={[remarkGfm]} components={customRenderers}>
        {children}
    </Markdown>
  ), [children, customRenderers]);

  return (
    <div ref={containerRef} className="markdown-content space-y-6 relative selection:bg-amber-100 selection:text-amber-900 dark:selection:bg-amber-900/30 dark:selection:text-amber-100">
      {markdownContent}

      {/* --- FLOATING TOOLBOX --- */}
      {selectionMenu.show && (
       <div 
  className="fixed z-50 flex items-center gap-1 p-1 rounded-lg border border-border/50 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm shadow-xl transition-all animate-in fade-in zoom-in-95 duration-200"
  style={{ 
    left: selectionMenu.x, 
    top: selectionMenu.y,
    // Adjusted translate to center it better above selection, modify X as needed for your specific alignment
    transform: 'translate(0, -100%) translateY(-8px) translateX(-100%)' 
  }}
  onMouseDown={(e) => e.preventDefault()}
>
  {/* Explain Button */}
  <Button 
    variant="ghost" 
    size="sm"
    onClick={() => handleAction('explain')}
    className="h-8 px-3 rounded-md cursor-pointer text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-200 flex items-center gap-2 font-medium"
  >
    {t("Ask")} 
    <AIIcon className="w-4 h-4" />
  </Button>

  {/* Vertical Separator */}
  <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700" />

  {/* Quiz Button */}
  <Button 
    variant="ghost" 
    size="sm"
    onClick={() => handleAction('quiz')}
    className="h-8 cursor-pointer px-3 rounded-md text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-200 flex items-center gap-2 font-medium"
  >
    Generate quiz
    {/* Ensure icon has a size class */}
    <span className="text-rose-500">
      <QuizPenIcon className="w-4 h-4" /> 
    </span>
  </Button>
</div>
=======
  };

  return (
    <div ref={containerRef} className="markdown-content space-y-6 relative">
      <Markdown remarkPlugins={[remarkGfm]} components={customRenderers}>
        {children}
      </Markdown>

      {/* --- FLOATING TOOLBOX --- */}
      {selectionMenu.show && (
        <div 
          className="fixed z-50 flex items-center gap-1 p-1 bg-zinc-900 text-white rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-200"
          style={{ 
            left: selectionMenu.x, 
            top: selectionMenu.y,
            transform: 'translate(-50%, -100%) translateY(-8px)' // Center horizontally, move up
          }}
          // Prevent the menu from closing immediately when clicked
          onMouseDown={(e) => e.preventDefault()} 
        >
          <button 
            onClick={() => handleAction('explain')}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-700 rounded-md text-xs font-medium transition-colors"
          >
            <Sparkles size={14} className="text-amber-400" />
            Explain
          </button>
          
          <div className="w-px h-4 bg-zinc-700 mx-0.5" />
          
          <button 
            onClick={() => handleAction('quiz')}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-700 rounded-md text-xs font-medium transition-colors"
          >
            <FileQuestion size={14} className="text-blue-400" />
            Quiz
          </button>

          <div className="w-px h-4 bg-zinc-700 mx-0.5" />

          {/* 3 dots menu placeholder */}
          <button className="p-1.5 hover:bg-zinc-700 rounded-md transition-colors">
            <MoreVertical size={14} />
          </button>
          
          {/* Little arrow at the bottom */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 rotate-45" />
        </div>
>>>>>>> Stashed changes
      )}
    </div>
  );
};

export default MarkdownView;