import { useMemo } from "react";
import { useUserStore } from "@/store/userStore";
import { AppSidebar } from "./app-sidebar"; 
import Header from "./header";
import { SidebarInset, SidebarProvider } from "./ui/sidebar";
import { cn } from "@/lib/utils";

// Define outside component to prevent re-renders or wrap in React.memo
const ArchitecturalBackground = () => (
  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
     {/* ... your background code ... */}
  </div>
);

const Layout = ({ children, title, containerRef, noGap }) => {
  const { photo, fullName, email } = useUserStore();

  return (
    <SidebarProvider
      // Adding defaultOpen helps prevent initial flash if using local storage
      defaultOpen={true} 
      className="flex h-screen w-full bg-background overflow-hidden"
    >
      <AppSidebar photo={photo} fullName={fullName} email={email} />
      
      <SidebarInset className="flex flex-1 flex-col relative w-full h-full overflow-hidden">
        <Header showAlertBadge={true} />
        
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