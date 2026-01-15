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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, ChevronsUpDown, Folder, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/userStore";
import { useTranslation } from "react-i18next";
import { usePostHog } from 'posthog-js/react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";



const FolderSelect = ({ data }: any) => {
  const posthog = usePostHog();
  const { t } = useTranslation();
  const setSelectedFolder = useUserStore((store) => store.setSelectedFolder);
  const selectedFolder = useUserStore((store) => store.selectedFolder);
  const { companyId, userId, email } = useUserStore();
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [folderInputValue, setFolderInputValue] = useState("");
  const queryClient = useQueryClient();

  const createFolder = useMutation({
    mutationFn: () =>
      axiosInstance.post(
        `${API_BASE_URL}/company/${companyId}/notes/folder/create`,
        { name: folderInputValue }
      ),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['folders'] });
      setFolderInputValue("");
      setDialogOpen(false);
    },
    onError: (error) => {
      console.error(error);
      alert(t("Failed to create folder, please try again."));
    },
  });

  return (
    <>
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
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4" />
              <span>{selectedFolder?.id ? selectedFolder.name : t("All folders")}</span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 z-50 pointer-events-auto">
          <Command>
            <CommandInput placeholder={t("Search folder...")} />
            <CommandList>
              <CommandEmpty>{t("No folders found.")}</CommandEmpty>
                  <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setSelectedFolder(undefined as any);
                    setOpen(false);
                  }}
                >
                  {t("All folders")}
                </CommandItem>
              </CommandGroup>

              <CommandGroup heading={t("Examples")}>
                {data?.map((item: any) => (
                  <CommandItem
                    key={item.id}
                    onSelect={() => {
                      posthog.capture("folder_selected", { name: item })
                      setSelectedFolder(item);
                      setOpen(false);
                    }}
                  >
                    {item.name}
                    <span className="text-muted-foreground">
                      {`(${item.count})`}
                    </span>
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
          
              <CommandSeparator />
              <CommandGroup  className="sticky bottom-0 z-10 bg-popover border-t border-zinc-200 dark:border-zinc-800 p-1">
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setDialogOpen(true);
                  }}
                  className="text-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t("Create new folder")}
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Save folder")}</DialogTitle>
            <DialogDescription>
              {t("This will create a new folder where you can store your notes.")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="grid gap-3">
              <Label htmlFor="folder-name">{t("Name")}</Label>
              <Input
                id="folder-name"
                value={folderInputValue}
                onChange={(e) => setFolderInputValue(e.target.value)}
                autoFocus
                placeholder={t("Enter folder name")}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && folderInputValue.trim()) {
                    posthog.capture("create_folder_clicked", { userId, email, name: folderInputValue });
                    createFolder.mutate();
                  }
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose>
              <Button variant="outline" onClick={() => {
                setFolderInputValue("");
                setDialogOpen(false);
              }}>
                {t("Cancel")}
              </Button>
            </DialogClose>

            <Button
              disabled={!folderInputValue.trim() || createFolder.isPending}
              onClick={() => {
                posthog.capture("create_folder_clicked", { userId, email, name: folderInputValue });
                createFolder.mutate();
              }}
            >
              {createFolder.isPending ? t("Saving...") : t("Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FolderSelect;