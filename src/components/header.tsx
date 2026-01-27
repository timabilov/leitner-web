import { ArrowDown } from "lucide-react";
import { LanguageSwitcher } from "./language-switcher";
import CreateFolder from "./create-folder";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Spinner } from "./ui/spinner";

import { useFolders } from "@/hooks/use-folders";
import FolderSelect from "./select-folder";
import CountdownTimer from "./countdown-timer";

const Header = ({ processingNotes, onProcessingClick }: any) => {
  const { data } = useFolders();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md transition-all">
      <style>
        {`
           @keyframes slow-bounce-arrow {
            0%, 100% { transform: translateY(1px); }
            50% { transform: translateY(-1px); }
          }
          .animate-slow-bounce-arrow {
            animation: slow-bounce-arrow 2s ease infinite;
          }`
        }
      </style>

      {/* 1. Added 'relative' to parent so absolute children position relative to this box */}
      <div className="relative flex h-14 items-center justify-between px-4">

        {/* LEFT: Sidebar Toggle */}
        {/* Added z-10 to ensure buttons stay clickable if screen is small and timer overlaps */}
        <div className="flex items-center gap-2 z-10">
          <SidebarTrigger className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100" />
        </div>

        {/* CENTER: Countdown Timer */}
        {/* 2. Used absolute positioning to dead-center the timer */}

        {/* RIGHT: Actions + Processing Status */}
        {/* Added z-10 here as well */}
        <div className="flex items-center gap-2 sm:gap-4 z-10">
          
          {/* I moved Processing Notes here so it sits neatly on the right side 
              instead of floating vaguely in the middle-left */}
          {processingNotes ? (
            <div onClick={onProcessingClick} className="flex justify-center items-center hover:underline cursor-pointer">
              <Spinner className="" />
              {/* Added hidden sm:block to prevent text clutter on tiny screens */}
              <p className="hidden sm:block ml-2 text-muted-foreground text-sm font-medium tracking-tight whitespace-nowrap">
                {`transcribing ${processingNotes} notes`}
              </p>
              <ArrowDown className="animate-slow-bounce-arrow w-4 h-4 text-muted-foreground ml-2" />
            </div>
          ) : null}

          <div className="flex items-center gap-1.5 sm:gap-2">
            <CreateFolder />
            <div className="">
              <FolderSelect data={data?.folders || []} />
            </div>
            <LanguageSwitcher />
          </div>
        </div>

      </div>
    </header>
  );
};

export default Header;