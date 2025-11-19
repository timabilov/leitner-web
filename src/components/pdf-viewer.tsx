'use client';

import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next'; // Import the hook

/**
 * A component for displaying a PDF from a blob URL in an iframe,
 * preventing both security blocks and infinite reload loops.
 * @param {object} props
 * @param {string} props.url - The blob: URL of the PDF file.
 * @param {string} props.className - Tailwind classes for styling the iframe.
 * @param {string} [props.title] - The title for the iframe.
 */
export const PDFViewer = ({ url, className, title }) => {
  const { t } = useTranslation(); // Initialize the hook
  const iframeRef = useRef(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !url) return;

    const hasLoaded = iframe.getAttribute('data-loaded-url') === url;

    if (!hasLoaded) {
      iframe.onload = () => {
        iframe.setAttribute('data-loaded-url', url);
        if (iframe.contentWindow) {
          iframe.contentWindow.location.href = url;
        }
      };
      iframe.src = 'about:blank';
    }
    
  }, [url]);

  return (
    <iframe
      ref={iframeRef}
      className={className}
      title={title}
      frameBorder="0"
    >
      <p>
        {t("Your browser does not support embedded PDFs. Please use the download button.")}
      </p>
    </iframe>
  );
};