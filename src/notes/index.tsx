import { useUserStore } from "@/store/userStore";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2Icon, Search, SearchX } from "lucide-react";
import { AIPromptInput } from "./ai-prompt-textarea";
import debounce from "lodash.debounce";
import { useTranslation } from "react-i18next";
import * as Sentry from "@sentry/react";
import { usePostHog } from "posthog-js/react";
import { AnimatePresence, motion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { NoteCard } from "./note-card";
import CatPenIcon from "./assets/cat-pen-icon";

const isNoteInLoadingState = (note: any) => {
  return (
    note.status !== "failed" &&
    note.status !== "transcribed" &&
    note.status !== "draft"
  );
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const Notes = () => {
  const posthog = usePostHog();
  const notesListRef = useRef<HTMLDivElement>(null);
  const {
    companyId,
    fullName,
    email,
    userId,
    selectedFolder,
    setProcessingNotesCount,
  } = useUserStore();

  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [files, setFiles] = useState<any[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    posthog.capture("dashboard_viewed");
  }, [posthog]);

  const notesQuery = useQuery({
    queryKey: ["notes", selectedFolder?.id],
    refetchOnWindowFocus: false,
    queryFn: async () => {
      return axiosInstance.get(
        API_BASE_URL +
          `/company/${companyId}/notes/all${
            selectedFolder ? `?folder_id=${selectedFolder?.id}` : ""
          }`
      );
    },
    enabled: !!userId || isPolling,
    refetchInterval: (query) => {
      const notes = query.state?.data?.data?.notes;
      if (!notes || !Array.isArray(notes)) return false;
      const hasLoadingNotes = notes.some(isNoteInLoadingState);
      return hasLoadingNotes ? 3000 : false;
    },
    throwOnError: (error) => {
      console.error("Get notes error:", error);
      Sentry.captureException(error, {
        tags: { query: "fetch_all_notes" },
        extra: { companyId, email, userId },
      });
      return false;
    },
  });

  useEffect(() => {
    const notes = notesQuery.data?.data?.notes;
    if (notes && Array.isArray(notes)) {
      const loadingNotes = notes.filter(isNoteInLoadingState);
      const count = loadingNotes.length;
      setProcessingNotesCount(count);
      if (count === 0) {
        setIsPolling(false);
      }
    }
  }, [notesQuery.data, setProcessingNotesCount]);

  const searchNotesQuery = useQuery({
    queryKey: ["searchNotes", searchQuery],
    queryFn: () => searchNotes(searchQuery),
    enabled: true,
    throwOnError: (error) => {
      console.error("Search error:", error);
      Sentry.captureException(error, {
        tags: { query: "search_notes" },
        extra: { userId, email },
      });
      return false;
    },
  });

  const searchNotes = async (query: string) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const filteredNotes = (notesQuery.data?.data?.notes || []).filter(
          (note: any) => note.name.toLowerCase().includes(query.toLowerCase())
        );
        resolve(filteredNotes);
      }, 500);
    });
  };

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearchQuery(value);
    }, 300),
    []
  );

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [
      ...prev,
      ...acceptedFiles.map((f) =>
        Object.assign(f, { preview: URL.createObjectURL(f) })
      ),
    ]);
  }, []);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    open: openFilePicker,
  } = useDropzone({
    onDrop,
    noClick: true,
    accept: { "image/*": [], "application/pdf": [], "audio/*": [] },
  });

  const noteCount = notesQuery?.data?.data?.notes?.length || 0;

  return (
    <div className="flex flex-1 flex-col">
      <div className="max-w-[1060px] mx-auto w-full pb-20 pt-2">
        {/* --- Greeting --- */}
        <div
          className="flex items-center gap-3.5 mb-5 v2-fade-up"
        >
          <div
            className="w-[52px] h-[52px] rounded-[18px] border flex items-center justify-center shrink-0"
            style={{
              background: "var(--v2-panel)",
              borderColor: "var(--v2-line)",
              boxShadow: "var(--v2-shadow)",
            }}
          >
            <CatPenIcon size={32} />
          </div>
          <div>
            <h1 className="font-heading text-[22px] sm:text-[26px] font-bold tracking-[-0.02em] leading-tight text-[var(--v2-ink)]">
              {t(getGreeting())}, {fullName?.split(" ")[0]}
            </h1>
            <p className="text-[13px] text-[var(--v2-mut)] mt-1.5">
              {t("Hey {{name}}, ask a question, or add material to build a full note.", {
                name: fullName?.split(" ")[0],
              })}
            </p>
          </div>
        </div>

        {/* --- Composer --- */}
        <section
          className="mb-8 v2-fade-up"
          style={{ animationDelay: "0.1s" }}
        >
          <AIPromptInput
            files={files}
            setFiles={setFiles}
            openFilePicker={openFilePicker}
            getInputProps={getInputProps}
            getRootProps={getRootProps}
            isDragActive={isDragActive}
            refetch={notesQuery.refetch}
          />
        </section>

        {/* --- Notes header --- */}
        <div
          className="flex items-center gap-3 mb-3.5 flex-wrap v2-fade-up"
          style={{ animationDelay: "0.15s" }}
          ref={notesListRef}
        >
          <h3 className="font-heading text-[17px] font-bold text-[var(--v2-ink)] m-0">
            {t("Your notes")}
          </h3>
          <span
            className="text-xs font-semibold rounded-full px-2.5 py-0.5"
            style={{
              background: "var(--v2-panel2)",
              color: "var(--v2-mut)",
            }}
          >
            {noteCount} {noteCount === 1 ? "note" : "notes"}
          </span>

          <div className="flex-1" />

          {/* Search */}
          <div
            className="flex items-center gap-2 rounded-xl border px-3 py-2 w-full sm:w-[280px]"
            style={{
              background: "var(--v2-panel)",
              borderColor: "var(--v2-line)",
            }}
          >
            <Search
              className="w-[15px] h-[15px] shrink-0"
              style={{ color: "var(--v2-mut)" }}
              strokeWidth={1.8}
            />
            <input
              placeholder={t("Search notes...")}
              value={searchQuery}
              onChange={(e) => {
                posthog.capture("note_searched", {
                  userId,
                  email,
                  name: e.target.value,
                });
                setSearchQuery(e.target.value);
                debouncedSearch(e.target.value);
              }}
              className="flex-1 w-full bg-transparent border-none focus:ring-0 text-[13px] outline-none font-medium placeholder:text-[var(--v2-mut)]"
              style={{ color: "var(--v2-ink)" }}
            />
            <AnimatePresence>
              {searchNotesQuery.isPending && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Loader2Icon
                    className="animate-spin h-4 w-4"
                    style={{ color: "var(--v2-accent)" }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* --- Notes grid --- */}
        <div className="v2-fade-up" style={{ animationDelay: "0.2s" }}>
          {searchQuery && searchNotesQuery.isPending ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--v2-ink)]" />
              <p className="mt-4 text-[var(--v2-mut)] font-medium animate-pulse text-sm">
                {t("Searching your library...")}
              </p>
            </div>
          ) : searchQuery &&
            searchNotesQuery.isFetched &&
            (searchNotesQuery.data as any[])?.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed"
              style={{ borderColor: "var(--v2-line)", background: "var(--v2-panel)" }}
            >
              <SearchX className="w-[60px] h-[60px]" style={{ color: "var(--v2-line)" }} strokeWidth={1.5} />
              <h2 className="text-xl font-bold text-[var(--v2-mut)] mt-4 tracking-tight">{t("No results found")}</h2>
              <p className="text-[var(--v2-mut)] text-sm mt-1">{t("Try adjusting your keywords or filters")}</p>
            </div>
          ) : (
            <div
              className="grid gap-3.5"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
              }}
            >
              {(searchQuery
                ? (searchNotesQuery?.data as any[]) || []
                : notesQuery?.data?.data?.notes || []
              ).map((item: any) => (
                <NoteCard key={item.id} item={item} view="grid" />
              ))}
            </div>
          )}
          <input {...getInputProps()} />
        </div>
      </div>
    </div>
  );
};

export default Notes;
