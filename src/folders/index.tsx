import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { usePostHog } from "posthog-js/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// --- Icons & Assets ---
import { 
  Folder, 
  FolderOpen, 
  Plus, 
  Search, 
  Loader2, 
  MoreVertical,
  Calendar,
  FileText
} from "lucide-react";
import Lottie from "lottie-react";
// Assuming you have this from previous code

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
import folderAnimation from './../notes/folder.json';

export default function Folders() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const posthog = usePostHog();
  
  // Store actions (assuming you have a setter for the selected folder)
  const { companyId, setSelectedFolder } = useUserStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // --- 1. DATA FETCHING ---
  const { data: foldersData, isLoading } = useQuery({
    queryKey: ["folders", companyId],
    queryFn: async () => {
      const res = await axiosInstance.get(`${API_BASE_URL}/company/${companyId}/notes/folder`);
      return res.data.folders; // Assuming response structure based on your controller
    },
    enabled: !!companyId,
  });

  // --- 2. CREATE FOLDER MUTATION ---
  const createFolderMutation = useMutation({
    mutationFn: async (name: string) => {
      return axiosInstance.post(`${API_BASE_URL}/company/${companyId}/notes/folder/create`, { name });
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

  // --- 3. FILTERING ---
  const filteredFolders = foldersData?.filter((f: any) => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- 4. SELECTION HANDLER ---
  const handleSelectFolder = (folder: any) => {
    // 1. Set global store state
    if (setSelectedFolder) {
      setSelectedFolder(folder);
    }
    
    // 2. Track event
    posthog.capture("folder_selected", { folder_id: folder.id });

    // 3. Navigate to Notes page filtered by this folder
    // You can pass query param or rely on the store state you just set
    navigate(`/notes?folder_id=${folder.id}`);
  };

  return (
    <Layout title={t("Folders")} noGap>
      <div className="min-h-screen bg-transparent px-6 py-8 w-full max-w-7xl mx-auto">
        
        {/* --- HEADER SECTION --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
              <span className="p-2  rounded-xl">
                <FolderOpen className="w-6 h-6" />
              </span>
              <span> {t("Library")}</span>
             
            </h1>
            <p className="text-muted-foreground">
              {t("Organize your learning materials into collections.")}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder={t("Search folders...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm"
              />
            </div>

            {/* Create Button */}
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
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
             {[1, 2, 3, 4].map((i) => (
               <Skeleton key={i} className="h-32 w-full rounded-2xl" />
             ))}
          </div>
        ) : filteredFolders?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-muted/30 rounded-3xl border border-dashed">
             <div className="w-24 h-24 mb-4 opacity-50 grayscale">
                <Lottie animationData={folderAnimation} loop={false} />
             </div>
             <h3 className="text-lg font-semibold text-muted-foreground">{t("No folders found")}</h3>
             {searchQuery ? (
               <p className="text-sm text-muted-foreground/60">{t("Try a different search term")}</p>
             ) : (
               <Button variant="link" onClick={() => setIsCreateOpen(true)}>{t("Create your first folder")}</Button>
             )}
          </div>
        ) : (
          <motion.div 
            layout 
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            <AnimatePresence>
              {filteredFolders.map((folder: any, index: number) => (
                <FolderCard 
                  key={folder.id} 
                  folder={folder} 
                  index={index}
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
                placeholder={t("e.g., Biology 101, Marketing Ideas...")}
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>{t("Cancel")}</Button>
            <Button 
              onClick={handleCreateFolder} 
              disabled={createFolderMutation.isPending || !newFolderName.trim()}
              className="min-w-[100px]"
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
const FolderCard = ({ folder, index, onClick }: any) => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 cursor-pointer hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-black/50  transition-all duration-300 overflow-hidden"
    >
      {/* Decorative Gradient Blob on Hover */}
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl  transition-colors">
          <Folder className="w-6 h-6 text-zinc-400  transition-colors" fill="currentColor" fillOpacity={0.2} />
        </div>
        
        {/* Optional: Dropdown for Edit/Delete could go here */}
        <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors p-1">
                    <MoreVertical size={16} />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Rename</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600" onClick={(e) => e.stopPropagation()}>Delete</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="relative z-10">
        <h3 className="font-bold text-zinc-800 dark:text-zinc-100 text-lg truncate mb-1  transition-colors">
          {folder.name}
        </h3>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
            <div className="flex items-center gap-1.5">
                <FileText size={12} />
                <span>{folder.count || 0} {t("notes")}</span>
            </div>
            <div className="flex items-center gap-1.5">
                <Calendar size={12} />
                <span>{new Date(folder.created_at).toLocaleDateString()}</span>
            </div>
        </div>
      </div>
    </motion.div>
  );
};