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
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/userStore";
import { useTranslation } from "react-i18next"; // Import the hook
import { usePostHog } from 'posthog-js/react';



const Select = ({ data }: any) => {
  const posthog = usePostHog();
  const { t } = useTranslation(); // Initialize the hook
  const setSelectedFolder = useUserStore((store) => store.setSelectedFolder);
  const selectedFolder = useUserStore((store) => store.selectedFolder);
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={(state) => {
      posthog.capture("folder_select_clicked")
      setOpen(state)
    }}>
      <PopoverTrigger>
        <Button
          variant="outline"
          role="combobox"
          aria-label={t("Select folder...")}
          aria-expanded={open}
          className="flex-1 justify-between md:max-w-[200px] lg:max-w-[300px]"
        >
          {selectedFolder?.id ? selectedFolder.name : t("All folders")}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 z-50 pointer-events-auto">
        <Command>
          <CommandInput placeholder={t("Search folder...")} />
          <CommandList>
            <CommandEmpty>{t("No folders found.")}</CommandEmpty>
            <CommandGroup heading={t("Examples")}>
              {data?.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => {
                    posthog.capture("folder_selected", { name: item })
                    setSelectedFolder(item);
                    setOpen(false);
                  }}
                >
                  {item.name}
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedFolder?.id === item.id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  setSelectedFolder(undefined);
                  setOpen(false);
                }}
              >
                {t("All folders")}
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default Select;