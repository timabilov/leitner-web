import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import './markdown-view.css';
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
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !containerRef.current?.contains(selection.anchorNode)) {
        return;
      }

      const text = selection.toString().trim();
      if (!text || text.length < 3) return;

      const range = selection.getRangeAt(0);
      const rangeRect = range.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();

      // Center popup above the selection, clamped to container edges
      const x = Math.max(140, Math.min(
        containerRect.width - 140,
        rangeRect.left + rangeRect.width / 2 - containerRect.left
      ));
      // Position above selection (52px for popup height + gap), min 8px from top
      const isCoarse = window.matchMedia && window.matchMedia('(pointer:coarse)').matches;
      const y = isCoarse
        ? rangeRect.bottom - containerRect.top + 14
        : Math.max(8, rangeRect.top - containerRect.top - 52);

      setSelectionMenu({ x, y, show: true, text });
      lastOpenTime.current = Date.now();
    };

    const handleScroll = () => {
      if (Date.now() - lastOpenTime.current < 1000) return;
      setSelectionMenu(prev => prev.show ? { ...prev, show: false } : prev);
    };

    const handleMouseDown = () => {
       setSelectionMenu(prev => prev.show ? { ...prev, show: false } : prev);
    };

    document.addEventListener('mouseup', handleSelectionChange);
    document.addEventListener('keyup', handleSelectionChange);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mouseup', handleSelectionChange);
      document.removeEventListener('keyup', handleSelectionChange);
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

      {/* --- FLOATING SELECTION POPUP (dc.html style) --- */}
      {selectionMenu.show && (
        <div
          style={{
            position: 'absolute',
            zIndex: 50,
            left: selectionMenu.x,
            top: selectionMenu.y,
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            background: 'var(--v2-ink)',
            color: 'var(--v2-bg)',
            borderRadius: 13,
            boxShadow: '0 10px 30px -8px rgba(0,0,0,.45)',
            padding: 5,
            gap: 2,
            animation: 'v2-popIn .15s ease both',
          }}
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          <button
            onPointerDown={(e) => { e.preventDefault(); handleAction('explain'); }}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'inherit',
              fontSize: 13,
              fontWeight: 600,
              padding: '7px 12px',
              borderRadius: 9,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M21 12a8 8 0 0 1-8 8H4.5l2-2.6A8 8 0 1 1 21 12z" /></svg>
            {t("Ask")}
          </button>
          <span style={{ width: 1, height: 16, background: 'rgba(255,255,255,.2)' }} />
          <button
            onPointerDown={(e) => { e.preventDefault(); handleAction('quiz'); }}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'inherit',
              fontSize: 13,
              fontWeight: 600,
              padding: '7px 12px',
              borderRadius: 9,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.4-3 4.4" /><circle cx="12" cy="12" r="9.2" /></svg>
            {t("Make quiz")}
          </button>
        </div>
      )}
    </div>
  );
};

export default MarkdownView;
