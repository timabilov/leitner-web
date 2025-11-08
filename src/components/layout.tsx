import { useRef } from "react";
import { useUserStore } from "@/store/userStore";
import { AppSidebar } from "./app-sidebar"; // Your sidebar component
import Header from "./header";
import { SidebarInset, SidebarProvider } from "./ui/sidebar";

/**
 * The main layout component with a STICKY sidebar and SCROLLABLE content.
 * @param {object} props
 * @param {React.ReactNode} props.children - The content for the scrollable area.
 * @param {string} props.title - The title for the page header.
 * @param {React.RefObject<HTMLElement>} props.containerRef - A ref for the main scrollable element.
 */
const Layout = ({ children, title, containerRef }) => {
  const { photo, fullName } = useUserStore();
  const shortName =
    fullName && fullName.split(" ").length > 1
      ? `${fullName.split(" ")[0][0]}${fullName.split(" ")[1][0]}`?.toLowerCase()
      : "";

  return (
    // The SidebarProvider needs to be the root flex container that takes the full height of the screen.
    <SidebarProvider
      className="flex h-screen bg-background"
      style={{ "--sidebar-width": "calc(var(--spacing) * 64)" }}
    >
      {/* 1. The Sidebar: It is a direct child of the flex container. */}
      {/*    It will have its own fixed width and will NOT scroll. */}
      <AppSidebar variant="sidebar" />
      
      {/* 2. The Content Area: This container will take the remaining space. */}
      <SidebarInset className="flex flex-1 flex-col overflow-hidden">
        
        {/* The Header is part of the content area and will also NOT scroll. */}
        <Header photo={photo} shortName={shortName} title={title} />
        
        {/* 
          --- THIS IS THE SCROLLABLE CONTAINER ---
          - `flex-1`: Makes it fill the remaining vertical space.
          - `overflow-y-auto`: CRITICAL. This makes ONLY this part scrollable.
          - `ref={containerRef}`: Attaches the ref for your in-page scrolling functions.
        */}
        <main 
         ref={containerRef}
          id="main-container"
          className="flex-1 flex flex-col relative overflow-hidden p-4 md:p-6"
        >
          {/* All your page content (like NoteDetail) goes here and will scroll inside this main tag. */}
          {children}
        </main>

      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;
