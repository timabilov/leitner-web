import { useEffect, useState } from "react";
import { cn } from "@/lib/utils"; // Assuming you have this utility from shadcn/ui
import { Badge } from "@/components/ui/badge";
import { SortableItem } from "./sortable"; // Assuming this is your DND item wrapper
import {
  FolderOpenDot,
  Youtube,
  BellOff,
  BellRing,
  AudioLines,
} from "lucide-react";
import { toast } from "sonner";
import { ISO_TO_LANGUAGE } from "@/services/config"; // Assuming this is your config file
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@/store/userStore";

// --- HELPER FUNCTIONS ---

export const getTypeIcon = (type:string, size?: number) => {
  const iconsSizeClass = size ? `h-${size} w-${size}` : "h-5 w-5";
  switch (type) {
    case "multi":
      return <FolderOpenDot className={"text-muted-foreground " + iconsSizeClass}  />;
    case "youtube":
      return <Youtube className={"text-muted-foreground " + iconsSizeClass}/>;
    case "audio":
      return <AudioLines className={"text-muted-foreground " + iconsSizeClass} />;
    default:
      // A fallback icon
      return <FolderOpenDot className={"text-muted-foreground " + iconsSizeClass} />;
  }
};

export const getNoteLanguageIso = (lang) => {
  // Assuming ISO_TO_LANGUAGE is a map like { en: { flag: '🇺🇸', ... } }
  const languageInfo = Object.values(ISO_TO_LANGUAGE).find(
    (info) => info.lng_code === lang
  );
  return languageInfo ? languageInfo.flag : "🏳️";
};


// --- THE MAIN FIX for Tailwind CSS JIT Compiler ---
// We map the `view` prop to full, unbroken class strings that Tailwind can detect.

const gridContainerClasses = {
  grid: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4",
  list: "grid-cols-1",
};

const gridItemClasses = {
  grid: "flex-col min-h-[140px]", // Vertical card layout
  list: "flex-row items-center",  // Horizontal list item layout
};


// --- THE COMPONENT ---

export default function SortableGrid({ data, view }) {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();
  const { folders = [] } = useUserStore();
  console.log("folders", folders)
  useEffect(() => {
    // Ensure data is an array before setting it
    setItems(Array.isArray(data) ? data : []);
  }, [data]);

  const handleValueChange = (newItems) => {
    console.log("Grid items reordered:", newItems);
    setItems(newItems);
    toast.success("Items reordered successfully!");
  };

  const getItemValue = (item) => item.id;

  return (
    <div
      className={cn(
        "w-full p-4 grid gap-4",
        // We look up the correct class from our map
        gridContainerClasses[view]
      )}
    >
      {/* 
        The <Sortable> wrapper would go here if you are using a library like `dnd-kit`
        For example:
        <Sortable value={items} onValueChange={handleValueChange} getItemValue={getItemValue}>
      */}
      {items.map((item) => (
        <SortableItem key={item.id} value={item.id}>
          <div
            className={cn(
              "group bg-background border-border hover:bg-accent/50 relative cursor-pointer rounded-lg border p-3 transition-colors flex",
              // We look up the correct item layout class from our map
              gridItemClasses[view]
            )}
            onClick={() => navigate(`/notes/${item.id}`)}
          >

            {/* --- LIST VIEW RENDER --- */}
            {view === 'list' && (
              <>
                <div className="bg-muted flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg mr-4">
                  {getTypeIcon(item.note_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-row items-center">
                    <h4 className="truncate text-sm font-medium">
                      {item.name || "Untitled Note"}
                    </h4>
                    <span className="text-muted-foreground text-xs/2">{` Folder: (${item.folder_id ? folders?.find(folder => folder.id === item.folder_id)?.name : "All notes"})`}</span>
                  </div>

                  <p className="text-muted-foreground text-xs mt-1">
                    {new Date(item.created_at)?.toLocaleDateString("en-US")}
                  </p>
                </div>
                <div className="flex items-center ml-4 flex-shrink-0">
                  <span className="text-lg">{getNoteLanguageIso(item.language)}</span>
                  <Badge className={cn("ml-4 h-8 w-8 p-0 flex items-center justify-center", item?.quiz_alerts_enabled && "border-pink-300 bg-pink-100 dark:border-pink-300/10 dark:bg-pink-400/10")}>
                    {item.quiz_alerts_enabled ? <BellRing className="h-4 w-4 stroke-pink-700 dark:stroke-pink-500" /> : <BellOff className="h-4 w-4" />}
                  </Badge>
                </div>
              </>
            )}

            {/* --- GRID VIEW RENDER --- */}
            {view === 'grid' && (
              <>
                <div className="flex flex-row justify-between items-start">
                  <div className="truncate">
                    <h4 className="truncate text-sm font-medium pr-2">
                      {item.name || "Untitled Note"}
                    </h4>
                   <span className="text-muted-foreground text-xs/2">{item.folder_id ? folders?.find(folder => folder.id === item.folder_id)?.name : "All notes"}</span>

                  </div>
                  <Badge className={cn("h-8 w-8 p-0 flex flex-shrink-0 items-center justify-center", item?.quiz_alerts_enabled && "border-pink-300 bg-pink-100 dark:border-pink-300/10 dark:bg-pink-400/10")}>
                    {item.quiz_alerts_enabled ? <BellRing className="h-4 w-4 stroke-pink-700 dark:stroke-pink-500" /> : <BellOff className="h-4 w-4" />}
                  </Badge>
                </div>
                
                {/* This div acts as a flexible spacer */}
                <div className="flex-1" /> 

                <div className="mt-2 flex items-center justify-between">
                  <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
                    {getTypeIcon(item.note_type)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getNoteLanguageIso(item.language)}</span>
                    <span className="text-muted-foreground text-xs">
                      {new Date(item.created_at)?.toLocaleDateString("en-US")}
                    </span>
                  </div>
                </div>
              </>
            )}

          </div>
        </SortableItem>
      ))}
      {/* 
        </Sortable> 
      */}
    </div>
  );
}