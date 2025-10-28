import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { useUserStore } from "@/store/userStore";
import { redirect } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import React, { useCallback, useState } from "react";
import debounce from "lodash.debounce";
import { IconCirclePlusFilled } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import SortableGrid from "./sortable-example";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CreateFolder from "./create-folder";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Grid3X3, List, Heart, Star, ShoppingCart, Filter } from "lucide-react";
import { Separator } from "@/components/ui/separator"
import Select from "./select";

const Header = ({foldersList, setSelectedFolder, selectedFolder, photo, shortName}) => {
  const [searchQuery, setSearchQuery] = useState("");


      const searchNotesQuery = useQuery({
            queryKey: ["searchNotes", searchQuery],
            queryFn: () => searchNotes(searchQuery),
            enabled: true,
            onError: (error) => {
            console.error("Search error:", error);
            },
        });

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearchQuery(value);
    }, 300),
    []
  );



    return (
        <header className="bg-background/90 p-2 sticky top-0 z-10 flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
          <div className="flex w-full items-center gap-1 justify-between">
            <div className="relative w-full flex">
              {/* <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              /> */}
            </div>
            <div className="relative flex w-full justify-end items-center gap-2">
              <Select
                data={foldersList}
                selectedItem={selectedFolder}
                setSelectedItem={setSelectedFolder}
              />
            <CreateFolder />
             <Avatar className="h-9 w-9">
                <AvatarImage src={photo} />
                <AvatarFallback className=" bg-orange-500 text-white">{shortName}</AvatarFallback>
              </Avatar>

            </div>
            {/* <div classNam
            e="relative max-w-md flex-1 h-2"></div> */}
          </div>
        </header>
    )
}


export default Header;