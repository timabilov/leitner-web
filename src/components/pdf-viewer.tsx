'use client';

import React, { useEffect, useRef } from 'react';

/**
 * [FINAL, ROBUST VERSION]
 * A component for displaying a PDF from a blob URL in an iframe,
 * preventing both security blocks and infinite reload loops.
 * @param {object} props
 * @param {string} props.url - The blob: URL of the PDF file.
 * @param {string} props.className - Tailwind classes for styling the iframe.
 * @param {string} [props.title] - The title for the iframe.
 */
export const PDFViewer = ({ url, className, title }) => {
  const iframeRef = useRef(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !url) return;

    // --- THIS IS THE KEY FIX ---
    // We check if the iframe has already been loaded with our content.
    // We use a custom attribute to track the state, as `iframe.src` can be unreliable.
    const hasLoaded = iframe.getAttribute('data-loaded-url') === url;

    if (!hasLoaded) {
      // If it hasn't been loaded yet, we define the onload handler.
      // This function will run ONLY ONCE when the initial blank iframe is ready.
      iframe.onload = () => {
        // As soon as it loads, we set the custom attribute to prevent this from ever running again for this URL.
        iframe.setAttribute('data-loaded-url', url);
        
        // Now, programmatically navigate the iframe to our blob URL.
        // This is the direct command that bypasses many browser security policies.
        if (iframe.contentWindow) {
          iframe.contentWindow.location.href = url;
        }
      };

      // Set the initial src to a blank page. This is what triggers the `onload` event.
      // We do this to ensure we have a clean frame to navigate.
      iframe.src = 'about:blank';
    }
    
  }, [url]); // The effect re-runs if the URL prop changes, allowing you to load a new PDF.

  return (
    <iframe
      ref={iframeRef}
      className={className}
      title={title}
      frameBorder="0"
    >
      {/* Fallback for browsers that don't support iframes or PDFs */}
      <p>Your browser does not support embedded PDFs. 
         Please use the download button.
      </p>
    </iframe>
  );
};