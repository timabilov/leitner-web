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

const Select = ({ data }: any) => {
  const setSelectedFolder = useUserStore((store) => store.setSelectedFolder);
  const selectedFolder = useUserStore((store) => store.selectedFolder);
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen} >
      <PopoverTrigger>
        <Button
          variant="outline"
          role="combobox"
          aria-label="Select folder..."
          aria-expanded={true}
          className="flex-1 justify-between md:max-w-[200px] lg:max-w-[300px]"
        >
          {selectedFolder?.id ? selectedFolder.name : "All folders"}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 z-50 pointer-events-auto">
        <Command>
          <CommandInput placeholder="Search folder..." />
          <CommandList>
            <CommandEmpty>No folders found.</CommandEmpty>
            <CommandGroup heading="Examples">
              {data?.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => {
                    setSelectedFolder(item);
                    setOpen(false);
                  }}
                >
                  {item.name}
                  <Check
                    className={cn(
                      "ml-auto",
                      selectedFolder?.id === item.id ? "opacity-100" : "opacity-0"
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
                All folders
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default Select;
