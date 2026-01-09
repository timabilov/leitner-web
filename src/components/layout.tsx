import { useMemo } from "react";
import { useUserStore } from "@/store/userStore";
import { AppSidebar } from "./app-sidebar"; 
import Header from "./header";
import { SidebarInset, SidebarProvider } from "./ui/sidebar";
import { cn } from "@/lib/utils";

// Define outside component to prevent re-renders or wrap in React.memo
const ArchitecturalBackground = () => (
  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
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

const Layout = ({ children, title, containerRef, noGap, processingNotes, onProcessingClick }) => {
  const { photo, fullName, email } = useUserStore();

  return (
    <SidebarProvider
      // Adding defaultOpen helps prevent initial flash if using local storage
      defaultOpen={true} 
      className="flex h-screen w-full bg-background overflow-hidden"
    >
      <AppSidebar photo={photo} fullName={fullName} email={email} />
      
      <SidebarInset className="flex flex-1 flex-col relative w-full h-full overflow-hidden">
        <Header processingNotes={processingNotes} onProcessingClick={onProcessingClick} />
        
        <main 
          ref={containerRef}
          className={cn(
            "flex-1 flex flex-col relative overflow-y-auto isolate w-full",
            noGap ? "p-0" : "p-4 sm:p-6 md:p-8 lg:p-10"
          )}
        >
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