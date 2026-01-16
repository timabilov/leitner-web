import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import React, { useState, useEffect, useRef, useMemo } from 'react';
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

// --- Helper function ---
export const slugify = (text: string) => {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

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
   const { t } = useTranslation();

  const [selectionMenu, setSelectionMenu] = useState<SelectionState>({ x: 0, y: 0, show: false, text: '' });
  const containerRef = useRef<HTMLDivElement>(null);

  // --- 1. SELECTION HANDLER ---
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !containerRef.current?.contains(selection.anchorNode)) {
        setSelectionMenu(prev => prev.show ? { ...prev, show: false } : prev);
        return;
      }

      const text = selection.toString().trim();
      if (!text) return;

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
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

    return () => {
      document.removeEventListener('mouseup', handleSelectionChange);
      document.removeEventListener('keyup', handleSelectionChange);
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
      )}
    </div>
  );
};

export default MarkdownView;