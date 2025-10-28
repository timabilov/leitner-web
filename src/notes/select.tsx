import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils"


const Select = ({data, selectedItem, setSelectedItem}:any) => {
      const [open, setOpen] = useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-label="Select folder..."
                                aria-expanded={true}
                                className="flex-1 justify-between md:max-w-[200px] lg:max-w-[300px]">
                                {selectedItem?.id ? selectedItem.name : "All folders"}
                            <ChevronsUpDown className="opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                            <Command>
                            <CommandInput placeholder="Search folder..." />
                            <CommandList>
                                <CommandEmpty>No folders found.</CommandEmpty>
                                <CommandGroup heading="Examples">
                                {data?.map((item) => (
                                    <CommandItem
                                    key={item.id}
                                    onSelect={() => {
                                        setSelectedItem(item);
                                        setOpen(false);
                                    }}>
                                    {item.name}
                                    <Check
                                        className={cn(
                                        "ml-auto",
                                        selectedItem?.id === item.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    </CommandItem>
                                ))}
                                </CommandGroup>
                                        <CommandSeparator />
                                        <CommandGroup>
                                        <CommandItem  onSelect={() => {
                                        setSelectedItem(null);
                                        setOpen(false);
                                    }} >All folders</CommandItem>
                                        </CommandGroup>
                                    </CommandList>
                                    </Command>
                                </PopoverContent>
                                </Popover>

    )
}


export default Select;