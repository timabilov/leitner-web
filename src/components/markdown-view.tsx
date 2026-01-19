import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import './markdown-view.css';
import { Button } from './ui/button';
import AIIcon from '@/note-detail/assets/ai-icon';
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
  
  // Ref to track when the menu was last opened to prevent immediate closing by inertia scroll
  const lastOpenTime = useRef<number>(0);

  // --- 1. SELECTION HANDLER ---
  useEffect(() => {
    const handleSelectionChange = (e: Event) => {
      const selection = window.getSelection();
      // Basic checks: ensure selection exists and is inside this container
      if (!selection || selection.isCollapsed || !containerRef.current?.contains(selection.anchorNode)) {
        // Only hide if we aren't currently "ignoring" scrolls (though mouseup usually implies intention)
        // We handle hiding logic mostly in handleScroll/mousedown
        return; 
      }

      const text = selection.toString().trim();
      if (!text) return;
      let x = 0;
      let y = 0;

      if (e instanceof MouseEvent) {
        x = e.clientX;
        y = e.clientY - 50;
      } else {
        // Fallback for keyboard selection
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        console.log("rect.top", rect.top);
        x = rect.right; 
        y = rect.top;
      }

      // Show the menu and record the timestamp
      setSelectionMenu({ x , y , show: true, text });
      lastOpenTime.current = Date.now();
    };

    const handleScroll = () => {
      // 1. If menu is not shown, do nothing.
      // 2. CRITICAL FIX: If the menu was opened less than 500ms ago, ignore the scroll.
      //    This prevents trackpad inertia or browser auto-scroll from closing the menu immediately after mouseup.
      if (Date.now() - lastOpenTime.current < 1000) return;

      setSelectionMenu(prev => prev.show ? { ...prev, show: false } : prev);
    };

    // Close menu when clicking elsewhere to start a new selection
    const handleMouseDown = () => {
       setSelectionMenu(prev => prev.show ? { ...prev, show: false } : prev);
    };

    document.addEventListener('mouseup', handleSelectionChange as EventListener);
    document.addEventListener('keyup', handleSelectionChange as EventListener);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('scroll', handleScroll, true); 

    return () => {
      document.removeEventListener('mouseup', handleSelectionChange as EventListener);
      document.removeEventListener('keyup', handleSelectionChange as EventListener);
      document.removeEventListener('mousedown', handleMouseDown);
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
            transform: 'translate(10px, 10px)' 
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleAction('explain')}
            className="h-8 px-3 rounded-md cursor-pointer text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-200 flex items-center gap-2 font-medium"
          >
            {t("Ask")} 
            <AIIcon className="w-4 h-4" />
          </Button>

          <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700" />

          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => handleAction('quiz')}
            className="h-8 cursor-pointer px-3 rounded-md text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-200 flex items-center gap-2 font-medium"
          >
            Generate quiz
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