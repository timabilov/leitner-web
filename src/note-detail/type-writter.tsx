import { useEffect, useState } from "react";

export const Typewriter = ({ content, isStreaming }: { content: string; isStreaming?: boolean }) => {
  const [displayedContent, setDisplayedContent] = useState("");

  useEffect(() => {
    // 1. If we've finished displaying everything, stop.
    if (displayedContent.length === content.length) return;

    // 2. Handle immediate updates (e.g. if content was reset or pasted)
    if (content.length < displayedContent.length) {
      setDisplayedContent(content);
      return;
    }

    // 3. Define the Chunk Size (3 characters)
    const CHUNK_SIZE = 3;

    // 4. Calculate lag to adjust speed dynamically
    const distance = content.length - displayedContent.length;

    // If we are falling very far behind (>50 chars), speed up (10ms).
    // Otherwise, use a standard reading pace (25ms) since we are showing 3 chars at a time.
    const delay = distance > 50 ? 10 : 25;

    const timeout = setTimeout(() => {
      // Slice allows indices larger than length, so we don't need Math.min
      setDisplayedContent(content.slice(0, displayedContent.length + CHUNK_SIZE));
    }, delay);

    return () => clearTimeout(timeout);
  }, [content, displayedContent]);

  return (
    <span>
      {displayedContent}
      {/* Cursor: Only show if we are actually streaming AND haven't finished typing the current block */}
      {isStreaming && displayedContent.length < content.length && (
        <span className="inline-block w-1.5 h-4 ml-0.5 align-middle bg-primary/70 animate-pulse" />
      )}
    </span>
  );
};


export default Typewriter;