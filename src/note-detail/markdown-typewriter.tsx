import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

interface MarkdownTypewriterProps {
  content: string;
  isStreaming?: boolean;
}

export const MarkdownTypewriter = ({ content, isStreaming }: MarkdownTypewriterProps) => {
  // If not streaming, show content immediately (no animation on reload)
  const [displayedContent, setDisplayedContent] = useState(isStreaming ? "" : content);

  useEffect(() => {
    // If not streaming, show full content instantly
    if (!isStreaming) {
      setDisplayedContent(content);
      return;
    }

    // If we've finished displaying everything, stop.
    if (displayedContent.length === content.length) return;

    // Handle immediate updates (e.g. if content was reset or pasted)
    if (content.length < displayedContent.length) {
      setDisplayedContent(content);
      return;
    }

    // Define the Chunk Size (3 characters)
    const CHUNK_SIZE = 3;

    // Calculate lag to adjust speed dynamically
    const distance = content.length - displayedContent.length;

    // If we are falling very far behind (>50 chars), speed up (10ms).
    // Otherwise, use a standard reading pace (25ms) since we are showing 3 chars at a time.
    const delay = distance > 50 ? 10 : 25;

    const timeout = setTimeout(() => {
      setDisplayedContent(content.slice(0, displayedContent.length + CHUNK_SIZE));
    }, delay);

    return () => clearTimeout(timeout);
  }, [content, displayedContent, isStreaming]);

  return (
    <span className="[&_p]:inline [&_p]:m-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          // Inline code
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            return isInline ? (
              <code
                className="bg-muted-foreground/20 px-1 py-0.5 rounded font-mono"
                {...props}
              >
                {children}
              </code>
            ) : (
              <code
                className={`${className} block bg-muted-foreground/20 p-2 rounded font-mono overflow-x-auto my-1`}
                {...props}
              >
                {children}
              </code>
            );
          },
          // Code blocks
          pre: ({ children }) => (
            <pre className="bg-muted-foreground/20 p-2 rounded my-1 overflow-x-auto">
              {children}
            </pre>
          ),
          // Lists - minimal spacing
          ul: ({ children }) => (
            <ul className="list-disc list-inside my-0.5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside my-0.5">{children}</ol>
          ),
          li: ({ children }) => <li className="my-0">{children}</li>,
          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary/80"
            >
              {children}
            </a>
          ),
          // Paragraphs - no wrapper, just children
          p: ({ children }) => <>{children}</>,
          // Bold
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          // Italic
          em: ({ children }) => <em className="italic">{children}</em>,
          // Headings - keep inline
          h1: ({ children }) => <strong className="text-lg font-bold">{children}</strong>,
          h2: ({ children }) => <strong className="text-base font-bold">{children}</strong>,
          h3: ({ children }) => <strong className="font-bold">{children}</strong>,
        }}
      >
        {displayedContent}
      </ReactMarkdown>
      {/* Cursor: Only show if we are actually streaming AND haven't finished typing the current block */}
      {isStreaming && displayedContent.length < content.length && (
        <span className="inline-block w-1.5 h-4 ml-0.5 align-middle bg-primary/70 animate-pulse" />
      )}
    </span>
  );
};

export default MarkdownTypewriter;
