import { useMemo, useState } from "react";
import { useUserStore } from "@/store/userStore";
import { AppSidebar } from "./app-sidebar"; // Your sidebar component
import Header from "./header";
import { SidebarInset, SidebarProvider } from "./ui/sidebar";
import { AnimatedGrid, RisingBubbles } from "@/login";
import { cn } from "@/lib/utils";

const ArchitecturalBackground = () => (
  <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none select-none isolate">
    {/* 1. The Primary Net (Large Grid) */}
    <div 
      className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07]" 
      style={{ 
        backgroundImage: `
          linear-gradient(to right, #000 1px, transparent 1px), 
          linear-gradient(to bottom, #000 1px, transparent 1px)
        `,
        backgroundSize: '64px 64px' 
      }} 
    />

    {/* 2. The Micro-Grid (Finer Detail) */}
    <div 
      className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]" 
      style={{ 
        backgroundImage: `
          linear-gradient(to right, #000 1px, transparent 1px), 
          linear-gradient(to bottom, #000 1px, transparent 1px)
        `,
        backgroundSize: '16px 16px' 
      }} 
    />

    {/* 3. The Organic Grain (Secret sauce for Shadcn Studio vibe) */}
    <svg className="absolute inset-0 w-full h-full opacity-[0.15] contrast-125 pointer-events-none">
      <filter id="noiseFilter">
        <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#noiseFilter)" />
    </svg>

    {/* 4. The Edge Vignette (Softens the corners) */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--background)_90%)]" />
  </div>
);


/**
 * The main layout component with a STICKY sidebar and SCROLLABLE content.
 * @param {object} props
 * @param {React.ReactNode} props.children - The content for the scrollable area.
 * @param {string} props.title - The title for the page header.
 * @param {React.RefObject<HTMLElement>} props.containerRef - A ref for the main scrollable element.
 */

const Layout = ({ children, title, containerRef, search, searchValue, isSearching, noGap }) => {
  const { photo, fullName, email } = useUserStore();
  
  // Cleaned up shortname logic
  const shortName = useMemo(() => {
    if (!fullName) return "";
    const parts = fullName.split(" ");
    return parts.length > 1 
      ? (parts[0][0] + parts[1][0]).toLowerCase() 
      : parts[0][0].toLowerCase();
  }, [fullName]);

  return (
    <SidebarProvider
      className="flex h-screen w-full bg-background overflow-hidden"
    >
      <AppSidebar photo={photo} fullName={fullName} email={email} />
      
      <SidebarInset className="flex flex-1 flex-col relative w-full overflow-hidden">
        <Header 
          showAlertBadge={true} 
          // Passing props down...
        />
        
        <main 
          ref={containerRef}
          className={cn(
            "flex-1 flex flex-col relative overflow-y-auto isolate",
            // Responsive padding
            noGap ? "p-0" : "p-4 sm:p-6 md:p-8 lg:p-10"
          )}
        >
          {/* BACKGROUND: Fixed behind content */}
          <ArchitecturalBackground />

          <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-1 flex-col">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};


export default Layout;
