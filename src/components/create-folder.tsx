import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import { useUserStore } from "@/store/userStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next"; // Import the hook
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { usePostHog} from 'posthog-js/react';

const CreateFolder = () => {
  const { t } = useTranslation(); // Initialize the hook
  const posthog = usePostHog();
  const [folderInputValue, setFolderInputValue] = useState("");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const companyId = useUserStore((store) => store.companyId);
  const queryClient = useQueryClient();
  const { userId, email} = useUserStore();


  useEffect(() => {
    posthog.capture("folder_dialog_toggled",  { userId, email, state: isOpen});
  }, [isOpen])



  const createFolder = useMutation({
    mutationFn: () =>
      axiosInstance.post(
        `${API_BASE_URL}/company/${companyId}/notes/folder/create`,
        { name: folderInputValue }
      ),
    onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["folders"] });
      setFolderInputValue("");
      setIsOpen(false);
    },
    onError: (error) => {
      console.error(error);
      alert(t("Failed to create folder, please try again."));
    },
  });

  const handleClose = () => {
    setFolderInputValue("");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger>
        <Tooltip>
          <TooltipTrigger>
            <Button size="default" variant={"ghost"} className="cursor-pointer" onClick={() => setIsOpen(true)}>
              {/* {t("Create Folder")} */}
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {t("Create Folder")}
          </TooltipContent>
        </Tooltip>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Save folder")}</DialogTitle>
          <DialogDescription>
            {t("This will create a new folder where you can store your notes.")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-3">
            <Label htmlFor="name">{t("Name")}</Label>
            <Input
              id="name"
              value={folderInputValue}
              onChange={(e) => setFolderInputValue(e.target.value)}
              autoFocus
              placeholder={t("Enter folder name")}
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose>
            <Button variant="outline" onClick={handleClose}>
              {t("Cancel")}
            </Button>
          </DialogClose>

          <Button
            disabled={!folderInputValue.trim() || createFolder.isPending}
            onClick={() => {
              posthog.capture("create_folder_clicked", { userId, email, name: folderInputValue })
              createFolder.mutate()
            }}
          >
            {createFolder.isPending ? t("Saving...") : t("Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFolder;