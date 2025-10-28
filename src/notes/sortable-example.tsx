import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Sortable, SortableItem, SortableItemHandle } from "./sortable";
import {
  FileTextIcon,
  GripVertical,
  ImageIcon,
  MusicIcon,
  StarIcon,
  VideoIcon,
  FolderOpenDot,
  Youtube,
  BellOff,
  BellRing,
AudioLines,
Eye
} from "lucide-react";
import { toast } from "sonner";
import { CircleFlag } from "react-circle-flags";
import { countries } from "country-data-list";
import { ISO_TO_LANGUAGE } from "@/services/config";

interface GridItem {
  id: string;
  title: string;
  description: string;
  type: "image" | "document" | "audio" | "video" | "featured";
  size: string;
  priority: "high" | "medium" | "low";
}

const defaultGridItems: GridItem[] = [
  {
    id: "1",
    title: "Hero Image",
    description: "Main banner image",
    type: "image",
    size: "2.4 MB",
    priority: "high"
  },
  {
    id: "2",
    title: "Product Specs",
    description: "Technical documentation",
    type: "document",
    size: "1.2 MB",
    priority: "medium"
  },
  {
    id: "3",
    title: "Demo Video",
    description: "Product demonstration",
    type: "video",
    size: "15.7 MB",
    priority: "high"
  },
  {
    id: "4",
    title: "Audio Guide",
    description: "Voice instructions",
    type: "audio",
    size: "8.3 MB",
    priority: "low"
  },
  {
    id: "5",
    title: "Gallery Photo 1",
    description: "Product view 1",
    type: "image",
    size: "3.1 MB",
    priority: "medium"
  },
  {
    id: "6",
    title: "Gallery Photo 2",
    description: "Product view 2",
    type: "image",
    size: "2.8 MB",
    priority: "medium"
  },
  {
    id: "7",
    title: "User Manual",
    description: "Installation guide",
    type: "document",
    size: "4.2 MB",
    priority: "high"
  },
  {
    id: "8",
    title: "Background Music",
    description: "Ambient soundtrack",
    type: "audio",
    size: "12.1 MB",
    priority: "low"
  },
  {
    id: "9",
    title: "Feature Highlight",
    description: "Key product features",
    type: "featured",
    size: "N/A",
    priority: "high"
  }
];

const getTypeIcon = (type: GridItem["type"]) => {
  switch (type) {
    case "multi":
      return <FolderOpenDot className="text-muted-foreground h-5 w-5"/>;
    case "youtube":
      return <Youtube className="h-4 w-4" />;
    case "audio":
      return <AudioLines className="h-4 w-4" />;

  }
};



const getItemSize = (type: GridItem["type"]) => {
   "col-span-2 row-span-2"
};

export default function SortableGrid({data, view, setView}) {
  const [items, setItems] = useState<GridItem[]>([]);


  useEffect(() => {
    setItems(data || []);
  }, [data]);



  const handleValueChange = (newItems: GridItem[]) => {
    console.log("🔴 GRID VALUE CHANGED:", newItems);
    setItems(newItems);

    // Show toast with new order
    toast.success("Grid items reordered successfully!", {
      description: `New order: ${newItems.map((item, index) => `${index + 1}. ${item.title}`).join(", ")}`,
      duration: 4000
    });
  };

  const getItemValue = (item: GridItem) => item.id;
  const getNoteLanguageIso = (lang:string) => {
    const code = Object.keys(ISO_TO_LANGUAGE).find(iso_lang => ISO_TO_LANGUAGE[iso_lang].lng_code === lang);
    return code ? ISO_TO_LANGUAGE[code].flag : "🇺🇸";
  }


  return (
    <div className={`max-w-${view === "grid" ? "8": "4"}xl space-y-6 p-4 grid gap-x-10 grid-cols-${view === "grid" ? 4: 1}`}>
      {/* <Sortable
        value={items}
        onValueChange={handleValueChange}
        getItemValue={getItemValue}
        strategy="grid"
        className="grid auto-rows-fr grid-cols-3 gap-3"> */}
        {items.map((item) => (
          <SortableItem key={item.id} value={item.id}>
            <div
              className={cn(
                "group bg-background border-border hover:bg-accent/50 relative cursor-pointer rounded-lg border p-3 transition-colors",
                getItemSize(item.note_type),
                "flex min-h-[100px] flex-col"
              )}
              onClick={() => console.log("🔴 GRID ITEM CLICKED:", item.id)}>
     
              <div className="min-w-0 flex flex-row justify-between items-center">
                <div className="flex items-center">
                    <h4 className="overflow-hidden text-ellipsis text-sm font-medium">
                       {' '} {item.name}
                    </h4>
                </div>

                <Badge className={`h-8 ${item?.quiz_alerts_enabled ? " border-pink-300 bg-pink-100 dark:border-pink-300/10 dark:bg-pink-400/10" : ""} `}>
                    {item.quiz_alerts_enabled ? <BellRing className="stroke-pink-700 dark:stroke-pink-500" /> : <BellOff className="h-4 w-4"  /> }
                </Badge>
              </div>

              <div className="mt-2 flex items-center justify-between">
                 <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
                        {getTypeIcon(item.note_type)}
                    </div>
                    <div className="flex items-center">
                        {getNoteLanguageIso(item.language)}
                    {item.type !== "featured" && (
                    <span className="text-muted-foreground text-xs ">{' '}{(new Date(item.created_at))?.toLocaleDateString('en-US')}</span>
                    )}

                    </div>
              </div>
            </div>
          </SortableItem>
        ))}
      {/* </Sortable> */}
    </div>
  );
}