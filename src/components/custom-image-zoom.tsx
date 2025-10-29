// components/ui/custom-image-zoom.tsx

"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type ImageZoomProps = {
  children: React.ReactElement<HTMLImageElement>;
};

export const CustomImageZoom = ({ children }: ImageZoomProps) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [sourceBounds, setSourceBounds] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  const handleZoomIn = () => {
    if (triggerRef.current) {
      const bounds = triggerRef.current.getBoundingClientRect();
      setSourceBounds(bounds);
      setIsZoomed(true);
    }
  };

  const handleZoomOut = () => {
    setIsZoomed(false);
    // Allow the closing animation to finish before clearing the bounds
    setTimeout(() => {
      setSourceBounds(null);
    }, 300); // This duration should match the CSS transition duration
  };

  const { src, alt } = children.props;

  return (
    <>
      <div ref={triggerRef} onClick={handleZoomIn} className="cursor-zoom-in">
        {children}
      </div>

      {sourceBounds && createPortal(
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={handleZoomOut}
        >
          {/* Backdrop */}
          <div
            className={cn(
              "fixed inset-0 bg-black/0 transition-colors duration-300 ease-in-out",
              isZoomed && "bg-black/80"
            )}
          />

          {/* Animated Image */}
          <img
            src={src}
            alt={alt}
            style={{
              top: sourceBounds.top,
              left: sourceBounds.left,
              width: sourceBounds.width,
              height: sourceBounds.height,
            }}
            className={cn(
              "fixed object-contain transition-all duration-300 ease-in-out cursor-zoom-out",
              isZoomed && "top-1/2 left-1/2 w-[90vw] h-[90vh] -translate-x-1/2 -translate-y-1/2"
            )}
          />
        </div>,
        document.body
      )}
    </>
  );
};