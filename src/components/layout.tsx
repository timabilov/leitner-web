import { useRef } from "react";
import { useUserStore } from "@/store/userStore";
import { AppSidebar } from "./app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "./ui/sidebar";
import { cn } from "@/lib/utils";
import { Outlet, useLocation } from "react-router";
import { PromoBanner } from "./promo-banner";

// Kept as export for login page and other consumers
export const ArchitecturalBackground = () => (
  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
    <div
      className="absolute inset-0"
      style={{
        backgroundImage:
          "linear-gradient(var(--v2-grid) 1px, transparent 1px), linear-gradient(90deg, var(--v2-grid) 1px, transparent 1px)",
        backgroundSize: "36px 36px",
      }}
    />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--v2-bg)_90%)]" />
  </div>
);

const Layout = () => {
  const { photo, fullName, email } = useUserStore();
  const location = useLocation();
  const containerRef = useRef<HTMLElement>(null);

  const regex = /\/notes\/(\d+)$/;
  const isNoteDetailPage = location.pathname.match(regex);
  const noGap =
    location.pathname.includes("/notes/") ||
    location.pathname.includes("/price-page") ||
    location.search.includes("?sale=true");

  return (
    <SidebarProvider
      defaultOpen={false}
      className="flex h-dvh w-full overflow-hidden relative"
      style={{ background: "var(--v2-bg)", color: "var(--v2-ink)" }}
    >
      <AppSidebar photo={photo || ""} fullName={fullName || ""} email={email || ""} />

      <SidebarInset className="flex flex-1 flex-col relative w-full h-full overflow-hidden">
        {/* Sale banner — hidden on pricing page (has its own inline promo) */}
        {!location.pathname.includes("/price-page") && <PromoBanner />}

        <main
          ref={containerRef}
          className="flex-1 flex flex-col relative overflow-y-auto isolate w-full v2-grid-bg"
          style={{ backgroundColor: "var(--v2-bg)" }}
        >
          <div className="relative z-10 w-full max-w-8xl mx-auto flex flex-1 flex-col">
            <div
              className={cn(
                isNoteDetailPage
                  ? ""
                  : noGap
                    ? ""
                    : "p-4 sm:p-6 md:p-10",
                noGap && "p-0"
              )}
            >
              {!isNoteDetailPage && (
                <SidebarTrigger className="z-[201] mb-2 text-[var(--v2-mut)] hover:text-[var(--v2-ink)] hover:bg-[var(--v2-panel2)] transition-colors rounded-xl md:hidden" />
              )}
              <Outlet />
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;
