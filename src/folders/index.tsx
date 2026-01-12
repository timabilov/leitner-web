import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { usePostHog } from "posthog-js/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// --- Icons ---
import {
  Folder,
  FolderOpen,
  Plus,
  Search,
  Loader2,
  MoreVertical,
  Calendar,
  FileText,
  CheckCircle2, // Added for selection indicator
} from "lucide-react";
import Lottie from "lottie-react";

// --- Store & Services ---
import { useUserStore } from "@/store/userStore";
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";

// --- Components ---
import Layout from "@/components/layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import folderAnimation from "./../notes/folder.json";
import { useFolders } from "@/hooks/use-folders";

export default function Folders() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const posthog = usePostHog();
 const { data } = useFolders(); // Uses cached data if available

  // 1. Get selectedFolder from store to compare IDs
  const { companyId, setSelectedFolder, selectedFolder, totalNotesCount} = useUserStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");


  // --- CREATE MUTATION ---
  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      return axiosInstance.post(
        `${API_BASE_URL}/company/${companyId}/notes/folder/create`,
        { name }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      setIsCreateOpen(false);
      setNewFolderName("");
      toast.success(t("Folder created successfully"));
      posthog.capture("folder_created");
    },
    onError: () => {
      toast.error(t("Failed to create folder"));
    },
  });

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    createFolderMutation.mutate(newFolderName);
  };

  // --- FILTERING ---
  const filteredFolders = useMemo(() => {
    if (data?.folders?.length)
      return data?.folders?.filter((f: any) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return []
  }, [data?.folders, searchQuery]);

  // --- SELECTION HANDLER ---
  const handleSelectFolder = (folder: any) => {
    // If folder is null, it means "All Folders"
    setSelectedFolder(folder);

    if (folder) {
      posthog.capture("folder_selected", { folder_id: folder.id });
      // Optional: Navigate if you want this to open a new page
      // navigate(`/notes?folder_id=${folder.id}`);
    } else {
      posthog.capture("folder_selected_all");
      // navigate(`/notes`);
    }
  };

  return (
    <Layout title={t("Folders")} noGap>
      <div className="min-h-screen bg-transparent px-6 py-8 w-full max-w-7xl mx-auto">
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
              <span className="p-2 rounded-xl">
                <FolderOpen className="text-zinc-800 dark:text-zinc-100" />
              </span>
              <span>{t("Library")}</span>
            </h1>
            <p className="text-muted-foreground">
              {t("Organize your learning materials into collections.")}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("Search folders...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm"
              />
            </div>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 shadow-lg shadow-zinc-500/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("New Folder")}
            </Button>
          </div>
        </div>

        {/* --- FOLDER GRID --- */}
        {/*isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
        ) :*/ filteredFolders.length === 0 && !searchQuery ? (
          // Empty state only if no search query and no folders
          <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-3xl border border-dashed">
            <div className="w-24 h-24 mb-4 opacity-50 grayscale">
              <Lottie animationData={folderAnimation} loop={false} />
            </div>
            <h3 className="text-lg font-semibold text-muted-foreground">
              {t("No folders found")}
            </h3>
            <Button variant="link" onClick={() => setIsCreateOpen(true)}>
              {t("Create your first folder")}
            </Button>
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            <AnimatePresence>
              {/* 1. The "All Folders" Card */}
              {
                !searchQuery && (
                  <FolderCard
                    folder={{
                      id: "ALL_FOLDERS", // Pseudo ID for key
                      name: t("All Notes"),
                      count: totalNotesCount, // Use the count from API
                      created_at: null,
                    }}
                    index={0}
                    // Check if selectedFolder is null (which means All)
                    isSelected={!selectedFolder}
                    onClick={() => handleSelectFolder(null)}
                    isSpecial={true}
                  />
                )
              }

              {/* 2. The Actual Folders */}
              {filteredFolders.map((folder: any, index: number) => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  index={index + 1}
                  // Check ID match
                  isSelected={selectedFolder?.id === folder.id}
                  onClick={() => handleSelectFolder(folder)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* --- CREATE DIALOG --- */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Create New Folder")}</DialogTitle>
            <DialogDescription>
              {t("Give your collection a name to organize your notes.")}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                <Folder className="w-6 h-6 text-amber-500" />
              </div>
              <Input
                autoFocus
                placeholder={t("e.g., Biology 101...")}
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>
              {t("Cancel")}
            </Button>
            <Button
              onClick={handleCreateFolder}
              disabled={createFolderMutation.isPending || !newFolderName.trim()}
            >
              {createFolderMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                t("Create")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

// --- SUB-COMPONENT: FOLDER CARD ---
const FolderCard = ({ folder, index, onClick, isSelected, isSpecial }: any) => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className={cn(
        "group relative rounded-2xl p-5 cursor-pointer transition-all duration-300 overflow-hidden border",
        // Default State
        "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800   hover:-translate-y-1",
        // Selected State (Active)
        isSelected &&
          "border-[#fe5e5f]/30 ring-1 ring-[#fe5e5f]  dark:bg-[#fe5e5f]/10   dark:shadow-none"
      )}
    >
      {/* Selection Checkmark Badge (only when selected) */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-4 right-4 text-[#fe5e5f] z-20"
        >
          <CheckCircle2 className="w-5 h-5 fill-[#fe5e5f] text-white dark:text-zinc-900" />
        </motion.div>
      )}

      {/* Decorative Blob */}
      <div
        className={cn(
          "absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl transition-opacity duration-500 pointer-events-none",
          // isSelected
          //   ? "bg-amber-500/20 opacity-100"
          //   : "bg-amber-500/10 opacity-0 group-hover:opacity-100"
        )}
      />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div
          className={cn(
            "p-3 rounded-xl transition-colors",
            // Change Icon bg color if selected
            // isSelected
            //   ? "bg-amber-100 dark:bg-amber-900/30"
            //   : "bg-zinc-50 dark:bg-zinc-800"
          )}
        >
  
            <Folder
              className={cn(
                "w-6 h-6 transition-colors",
                isSelected
                  ? "text-[#fe5e5f]"
                  : "text-zinc-400"
              )}
              fill="currentColor"
              fillOpacity={isSelected ? 1 : 0.2}
            />
        </div>

        {/* Only show menu for actual folders, not the 'All Notes' card */}
        {!isSpecial && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <MoreVertical size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                {t("Rename")}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={(e) => e.stopPropagation()}
              >
                {t("Delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="relative z-10">
        <h3
          className={cn(
            "font-bold text-lg truncate mb-1 transition-colors",
            isSelected
              ? "text-amber-700 dark:text-amber-400"
              : "text-zinc-800 dark:text-zinc-100"
          )}
        >
          {folder.name}
        </h3>

        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
          <div className="flex items-center gap-1.5">
            <FileText size={12} />
            <span>
              {folder.count || 0} {t("notes")}
            </span>
          </div>
          {folder.created_at && (
            <div className="flex items-center gap-1.5">
              <Calendar size={12} />
              <span>{new Date(folder.created_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
