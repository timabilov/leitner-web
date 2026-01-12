// src/hooks/useFolders.ts
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import { useUserStore } from "@/store/userStore";

export const useFolders = () => {
  const { companyId } = useUserStore(); // Still use Zustand for User/Auth state

  return useQuery({
    queryKey: ["folders", companyId],
    queryFn: async () => {
      const res = await axiosInstance.get(`${API_BASE_URL}/company/${companyId}/notes/folder`);
      return res.data; // Expected: { total_notes_count: 10, folders: [...] }
    },
    enabled: !!companyId,
    // Keep data fresh for 1 minute (optional, prevents spamming API on component mounts)
    staleTime: 1000 * 60 * 1, 
  });
};