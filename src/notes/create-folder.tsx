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
import { useState } from "react";
import { Plus } from "lucide-react";

const CreateFolder = () => {
  const [folderInputValue, setFolderInputValue] = useState("");
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const email = useUserStore((store) => store.email);
  const userName = useUserStore((store) => store.userName);
  const userId = useUserStore((store) => store.userId);
  const companyId = useUserStore((store) => store.companyId);
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
      setIsOpen(false); // Close dialog on success
    },
    onError: (error) => {
      console.error(error);
      alert("Error", "Failed to create folder, please try again.");
    },
  });

  // Handle dialog close (including X button)
  const handleClose = () => {
    setFolderInputValue("");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="default" className="cursor-pointer"  onClick={() => setIsOpen(true)}>
          Create Folder
          <Plus className="ml-2 h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save folder</DialogTitle>
          <DialogDescription>
            This will create a new folder where you can store your notes.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-3">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={folderInputValue}
              onChange={(e) => setFolderInputValue(e.target.value)}
              autoFocus
              placeholder="Enter folder name"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </DialogClose>

          <Button
            disabled={!folderInputValue.trim() || createFolder.isPending}
            onClick={() => createFolder.mutate()}
          >
            {createFolder.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFolder;