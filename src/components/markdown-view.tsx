import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// import remarkBreaks from 'remark-breaks'; // <-- 1. Import the plugin
import React from 'react'
import './markdown-view.css';


// --- A simple helper function to create a URL-friendly ID ---
export const slugify = (text) => {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w\-]+/g, '')  // Remove all non-word chars
    .replace(/\-\-+/g, '-');    // Replace multiple - with single -
};


const MarkdownView = ({ children, setTopics }) => {
  const preprocessMarkdown = (text) => {
  if (!text) return '';
  // This regex finds any newline that is NOT followed by another newline
  // and replaces it with a double newline to create a paragraph break.
  return text.replace(/(\r\n|\n)(?!\r\n|\n)/g, '\n\n');
};


const customRenderers = {
  p: ({ node, ...props }) => {
    // Check for the heading-like pattern first (p > strong only)
    if (
      node.children.length === 1 &&
      node.children[0].tagName === 'strong' &&
      (node.children[0].children[0]?.value || '').endsWith(':')
    ) {
      // It's a heading, render it as h2 and stop.
      return <h2 className='text-2xl font-bold text-balance' {...props} />;
    }

    // Now, handle the multi-line indent logic for normal paragraphs.
    // The `props.children` array will contain text nodes and <strong> nodes etc.
    // We need to process them to find the newlines.
    
    const childrenWithBreaks = [];
    
    // We iterate through all children of the paragraph (text, strong tags, etc.)
    React.Children.forEach(props.children, (child) => {
      // Check if the child is a simple string containing newlines
      if (typeof child === 'string') {
        // Split the string by newline characters
        const lines = child.split('\n');
        lines.forEach((line, index) => {
          if (line) { // Only render non-empty lines
            childrenWithBreaks.push(
              <span key={`${line}-${index}`} style={{ display: 'block' }}>
                {line}
              </span>
            );
          }
        });
      } else {
        // If the child is not a string (e.g., it's a <strong> element),
        // we just push it as-is. You could add more complex logic here
        // if you expect newlines inside bold text, but this handles the common case.
        childrenWithBreaks.push(child);
      }
    });

    // We render a single <p> tag as a container, and inside it,
    // we render our array of custom <span> elements.
    return <p className='leading-7 '>{childrenWithBreaks}</p>;
  },
  // --- NEW: Add a custom renderer for the <strong> tag ---
  strong: ({ node, ...props }) => {
  // We will simply add a custom class name to every strong tag.
  // This allows us to target it specifically in our CSS.
  const textValue = node.children[0]?.value || '';
  if (setTopics)
      setTopics(textValue)
    // 2. Create a URL-friendly ID from the text.
    const elementId = slugify(textValue);
    return <strong id={elementId}  className="markdown-strong text-xl font-bold text-balance" {...props} />;
  }
};


  return (
    // The className here applies all our scoped styles
    <div className="markdown-content space-y-6">
      <Markdown remarkPlugins={[remarkGfm]}  components={customRenderers}>
        {children}
      </Markdown>
    </div>
  );
};

export default MarkdownView;