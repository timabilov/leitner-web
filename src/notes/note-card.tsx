import { cn } from "@/lib/utils"; // Assuming you have this utility from shadcn/ui
import { Badge } from "@/components/ui/badge";
import { SortableItem } from "./sortable"; // Assuming this is your DND item wrapper
import {
  FolderOpenDot,
  Youtube,
  BellOff,
  BellRing,
  AudioLines,
  Image,
  TriangleAlert,
  File,
  School2Icon,
  Text,
} from "lucide-react";
import { ISO_TO_LANGUAGE } from "@/services/config"; // Assuming this is your config file
import { GradientProgress } from "@/components/gradient-progress";
import { useUserStore } from "@/store/userStore";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useNavigate } from "react-router";
import { Skeleton } from "@/components/ui/skeleton";

const gridItemClasses = {
  grid: "flex-col min-h-[140px]", // Vertical card layout
  list: "flex-row items-center", // Horizontal list item layout
};

export const getTypeIcon = (type: string, size?: number) => {
  const iconsSizeClass = size ? `h-${size} w-${size}` : "h-5 w-5";
  switch (type) {
    case "multi":
      return (
        <FolderOpenDot className={"text-muted-foreground " + iconsSizeClass} />
      );
    case "youtube":
      return <Youtube className={"text-muted-foreground " + iconsSizeClass} />;
    case "audio":
      return (
        <AudioLines className={"text-muted-foreground " + iconsSizeClass} />
      );
    case "image":
      return <Image className={"text-muted-foreground " + iconsSizeClass} />;
    case "pdf":
      return <File className={"text-muted-foreground " + iconsSizeClass} />;
    case 'test':
        return <School2Icon className={"text-muted-foreground " + iconsSizeClass} />;
    case "text":
      return <Text className={"text-muted-foreground " + iconsSizeClass} />;
    default:
      // A fallback icon
      return (
        <FolderOpenDot className={"text-muted-foreground " + iconsSizeClass} />
      );
  }
};

export const getNoteLanguageIso = (lang) => {
  // Assuming ISO_TO_LANGUAGE is a map like { en: { flag: '🇺🇸', ... } }
  const languageInfo = Object.values(ISO_TO_LANGUAGE).find(
    (info) => info.lng_code === lang
  );
  return languageInfo ? languageInfo.flag : "🏳️";
};

const NoteCard = ({ item, view }) => {
  const { folders } = useUserStore();
  const navigate = useNavigate();
  const progress = item?.note_progress || 0;
  let isItemProcessing =
    item?.status !== "failed" &&
    item?.status !== "transcribed" &&
    item?.status !== "draft";
  let isDraft = item.status === "draft";

  return (
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
        {view === "list" && (
          isItemProcessing  ? (
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ) :
          <>
            <div className="bg-muted flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg mr-4">
              {getTypeIcon(item.note_type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-row items-center">
                {item?.processing_error_message && (
                  <TriangleAlert className="text-red-500 w-4 h-4 mr-1" />
                )}
                <h4 className="truncate text-sm font-medium">
                  {item.name || "Untitled Note"}
                </h4>
                <span className="text-muted-foreground ml-2 text-xs/2">{` Folder: (${
                  item.folder_id
                    ? folders?.find((folder) => folder.id === item.folder_id)
                        ?.name
                    : "All notes"
                })`}</span>
              </div>
              <div className="flex flex-row items-center mt-1">
                <p className="text-muted-foreground text-xs">
                  {new Date(item.created_at)?.toLocaleDateString("en-US")}
                </p>
                {progress > 0.0 && progress < 1.0 && !isItemProcessing && (
                  <Tooltip>
                    <TooltipTrigger>
                      <GradientProgress
                        className="w-30 ml-2"
                        value={Math.round(progress * 100)}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <span>Quiz progress</span>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
            <div className="flex items-center ml-4 flex-shrink-0">
              <span className="text-lg">
                {getNoteLanguageIso(item.language)}
              </span>
              <Badge
                className={cn(
                  "ml-4 h-8 w-8 p-0 flex items-center justify-center",
                  item?.quiz_alerts_enabled &&
                    "border-pink-300 bg-pink-100 dark:border-pink-300/10 dark:bg-pink-400/10"
                )}
              >
                {item?.quiz_alerts_enabled ? (
                  <BellRing className="h-4 w-4 stroke-pink-700 dark:stroke-pink-500" />
                ) : (
                  <BellOff className="h-4 w-4" />
                )}
              </Badge>
            </div>
          </>
        )}

        {/* --- GRID VIEW RENDER --- */}
        {view === "grid"  && (
          isItemProcessing  ? (
            <div className="flex flex-col  space-x-4 justify-between min-h-[100px]">
              <div>
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px] mt-4" />
              </div>
              <div className="space-y-2 flex flex-row justify-between items-end">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
            </div>
          ) : 
          <>
            <div className="flex flex-row justify-between items-start">
              <div className="truncate">
                <div className="flex flex-row items-center">
                  {item?.processing_error_message && (
                    <TriangleAlert className="text-red-500 w-4 h-4 mr-1" />
                  )}
                  <h4 className="truncate text-sm font-medium pr-2">
                    {item.name || "Untitled Note"}
                  </h4>
                </div>
                <span className="text-muted-foreground text-xs/2">
                  {item.folder_id
                    ? folders?.find((folder) => folder.id === item.folder_id)
                        ?.name
                    : "All notes"}
                </span>
              </div>
              <Badge
                className={cn(
                  "h-8 w-8 p-0 flex flex-shrink-0 items-center justify-center",
                  item?.quiz_alerts_enabled &&
                    "border-pink-300 bg-pink-100 dark:border-pink-300/10 dark:bg-pink-400/10"
                )}
              >
                {item?.quiz_alerts_enabled ? (
                  <BellRing className="h-4 w-4 stroke-pink-700 dark:stroke-pink-500" />
                ) : (
                  <BellOff className="h-4 w-4" />
                )}
              </Badge>
            </div>
            <div className="flex-1" />
            <div className="mt-2 flex items-center justify-between">
              <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
                {getTypeIcon(item?.note_type)}
              </div>
              {progress > 0.0 && progress < 1.0 && !isItemProcessing && (
                <Tooltip>
                  <TooltipTrigger>
                    <GradientProgress
                      className="w-30 ml-2"
                      value={Math.round(progress * 100)}
                    />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <span>Quiz progress</span>
                  </TooltipContent>
                </Tooltip>
              )}
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {getNoteLanguageIso(item?.language)}
                </span>
                <span className="text-muted-foreground text-xs">
                  {new Date(item?.created_at)?.toLocaleDateString("en-US")}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </SortableItem>
  );
};

export default NoteCard;
