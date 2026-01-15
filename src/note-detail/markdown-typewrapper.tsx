import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";

interface MarkdownTypewriterProps {
  content: string;
  isStreaming: boolean;
}

export const MarkdownTypewriter = ({ content, isStreaming }: MarkdownTypewriterProps) => {
  // Memoize content to prevent unnecessary markdown parsing if string hasn't changed
  const memoizedContent = useMemo(() => content, [content]);

  return (
    <div className="prose dark:prose-invert max-w-none text-sm break-words">
      {/* 
         If you want a "smooth character" animation, it's complex to combine with Markdown.
         The standard "LLM Streaming" look is just rendering the text as it comes + a cursor.
      */}
      <ReactMarkdown
        components={{
            // Custom styles for markdown elements if needed
            p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
            a: ({node, ...props}) => <a className="text-blue-500 hover:underline" target="_blank" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
            ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2" {...props} />,
            code: ({node, ...props}) => <code className="bg-zinc-800/50 rounded px-1 py-0.5 text-xs font-mono" {...props} />,
        }}
      >
        {memoizedContent}
      </ReactMarkdown>

      {/* The Blinking Cursor Animation */}
      {isStreaming && (
        <span className="inline-block w-1.5 h-4 bg-zinc-900 dark:bg-zinc-100 align-middle ml-1 animate-pulse" />
      )}
    </div>
  );
};

export default MarkdownTypewriter;