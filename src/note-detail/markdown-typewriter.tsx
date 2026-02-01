import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { usePostHog } from "posthog-js/react"; // 1. Import PostHog

interface MarkdownTypewriterProps {
  content: string;
  isStreaming?: boolean;
  noteId?: string; // Optional: Pass noteId if you want to link analytics to a specific note
}

export const MarkdownTypewriter = ({ content = "", isStreaming, noteId }: MarkdownTypewriterProps) => {
  const posthog = usePostHog(); // 2. Init Hook

  // Sentry Protection: Defensive check to prevent .length crashes if API returns null
  if (typeof content !== "string") return null;

  // If not streaming, show content immediately (no animation on reload)
  const [displayedContent, setDisplayedContent] = useState(isStreaming ? "" : content);

  useEffect(() => {
    if (!isStreaming) {
      setDisplayedContent(content);
      return;
    }

    if (displayedContent.length === content.length) return;

    if (content.length < displayedContent.length) {
      setDisplayedContent(content);
      return;
    }

    const CHUNK_SIZE = 3;
    const distance = content.length - displayedContent.length;
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
          pre: ({ children }) => (
            <pre className="bg-muted-foreground/20 p-2 rounded my-1 overflow-x-auto">
              {children}
            </pre>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside my-0.5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside my-0.5">{children}</ol>
          ),
          li: ({ children }) => <li className="my-0">{children}</li>,
          
          // 3. PostHog Tracking: Track Link Clicks
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline hover:text-primary/80 cursor-pointer"
              onClick={() => {
                if (posthog) {
                  posthog.capture("chat_ai_link_clicked", { 
                    url: href,
                    note_id: noteId
                  });
                }
              }}
            >
              {children}
            </a>
          ),
          
          p: ({ children }) => <>{children}</>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          h1: ({ children }) => <strong className="text-lg font-bold">{children}</strong>,
          h2: ({ children }) => <strong className="text-base font-bold">{children}</strong>,
          h3: ({ children }) => <strong className="font-bold">{children}</strong>,
        }}
      >
        {displayedContent}
      </ReactMarkdown>
      
      {isStreaming && displayedContent.length < content.length && (
        <span className="inline-block w-1.5 h-4 ml-0.5 align-middle bg-primary/70 animate-pulse" />
      )}
    </span>
  );
};

export default MarkdownTypewriter;