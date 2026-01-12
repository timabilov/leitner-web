import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Folder, Loader2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/userStore";
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import { useMemo } from "react";

export function FoldersPanel() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setSelectedFolder, folders, selectedFolder } = useUserStore();



  // Get recent folders (limit to 5)
  const recentFolders = useMemo(() => {
    return folders?.slice(0, 5) || []}
    , []);

  const handleFolderClick = (folder: any) => {
    // Set selected folder in context
    setSelectedFolder(folder);
    // Navigate to notes page with folder_id parameter
    navigate(`/notes?folder_id=${folder.id}`);
  };

  return (
    <div className="group-data-[collapsible=icon]:hidden">
      <div className="rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 p-3 min-h-[180px] max-h-[320px] flex flex-col">
        {/* Panel Header */}
        <div className="flex items-center justify-between mb-2 flex-shrink-0">
          <h3 className="text-md font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">
            {t("Folders")}
          </h3>
          <button
            onClick={() => navigate("/folders")}
            className="text-[10px] font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            {t("View all")}{' '} {`(${folders?.length})`}
          </button>
        </div>

        {/* Folders Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {recentFolders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Folder className="w-6 h-6 text-zinc-300 dark:text-zinc-700 mb-1.5" />
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                {t("No folders yet")}
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {recentFolders.map((folder: any) => (
                <button
                  key={folder.id}
                  onClick={() => handleFolderClick(folder)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-all duration-200",
                    "hover:bg-zinc-100 dark:hover:bg-zinc-800/50",
                    "text-left group cursor-pointer"
                  )}
                >
                  <div className="flex-shrink-0 p-1 bg-zinc-100 dark:bg-zinc-800 rounded group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700 transition-colors">
                    <Folder className={"w-3 h-3  dark:text-zinc-400" + (selectedFolder?.id === folder.id ? " text-[#fe5e5f] " : " text-zinc-500")} />
                  </div>
                  <div className="flex-1 min-w-0 flex items-center gap-1">
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">
                      {folder.name}
                    </span>
                    {folder.count !== undefined && (
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 flex-shrink-0">
                        ({folder.count})
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-3 h-3 text-zinc-400 dark:text-zinc-600 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
              <button
                  onClick={() => navigate('/folders')}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-all duration-200",
                    "hover:bg-zinc-100 dark:hover:bg-zinc-800/50",
                    "text-left group cursor-pointer"
                  )}
                >
           
                  <div className="flex-1 min-w-0 flex items-center gap-1">
                    <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 w-full text-center">
                     ...
                    </span>
                
                  </div>
                </button>
                
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
