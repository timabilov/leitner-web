import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, FileQuestion, MoreVertical } from 'lucide-react'; // Icons
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

// --- A simple helper function to create a URL-friendly ID ---
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
        return;
      }

      const text = selection.toString().trim();
      if (!text) return;

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
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

    return () => {
      document.removeEventListener('mouseup', handleSelectionChange);
      document.removeEventListener('keyup', handleSelectionChange);
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
      )}
    </div>
  );
};

export default MarkdownView;