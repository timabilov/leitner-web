import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL, ISO_TO_LANGUAGE } from "@/services/config";
import { useUserStore } from "@/store/userStore";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next"; // Import the hook
import * as Sentry from "@sentry/react"; 
import { usePostHog } from 'posthog-js/react';

const CreateYoutubeNote = ({ component, refetch }) => {
  const { t } = useTranslation(); // Initialize the translation hook
  const { userId, email } = useUserStore();

  const availableLanguages = [
    { iso: "auto", flag: "🤖", language: t("Auto") },
    ...Object.entries(ISO_TO_LANGUAGE).map(([iso, data]) => ({
      iso,
      ...data,
    })),
  ];
  const posthog = usePostHog()
  const [urlInputValue, setUrlInputValue] = useState("");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const selectedFolder = useUserStore((store) => store.selectedFolder);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [videoId, setVideoId] = useState<string | undefined>();
  const [selectedLanguage, setSelectedLanguage] = useState("auto");
  const [noteId, setNoteId] = useState<string | undefined>();

  const companyId = useUserStore((state) => state.companyId);

  useEffect(() => {
    posthog.capture('youtube_dialog_toggled', { userId, email, state: isOpen })
  }, [isOpen]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsValid(validateYouTubeUrl(urlInputValue));
    }, 1000);
    return () => clearTimeout(timeoutId);
  }, [urlInputValue]);

  useEffect(() => {
    if (noteId) markUploadAsFinished.mutate(noteId);
  }, [noteId]);

  const handleClose = () => {
    setUrlInputValue("");
    setIsOpen(false);
  };

  const getYouTubeVideoId = (url: string) => {
    const isShorts = url.includes("youtube.com/shorts/");
    if (isShorts) {
      alert(t("Shorts aren't supported"));
    }
    const regex =
      /^(?:https?:\/\/)?(?:www\.|m\.)?(?:(?:youtube\.com\/(?:watch\?v=|v\/|embed\/|live\/))|(?:youtu\.be|y2u\.be)\/)([a-zA-Z0-9_-]{11})(?:[?&].*)?$/i;
    const match = url.match(regex);
    return match && match[1] && !isShorts ? setVideoId(match[1]) : null;
  };

  const validateYouTubeUrl = (url: string) => {
    if (!url) {
      clearInput();
      return null;
    }
    const youtubeRegex =
      /^(?:https?:\/\/)?(?:www\.|m\.)?(?:(?:youtube\.com\/(?:watch\?v=|v\/|embed\/|live\/))|(?:youtu\.be|y2u\.be)\/)([a-zA-Z0-9_-]{11})(?:[?&].*)?$/i;
    const isValid = youtubeRegex.test(url.trim());
    if (isValid) {
      getYouTubeVideoId(url);
    }
    return isValid;
  };

  const handleUrlChange = (text: string) => setUrlInputValue(text);

  const clearInput = () => {
    setYoutubeUrl("");
    setIsValid(null);
    setVideoId(undefined);
  };

  const draftNoteMutation = useMutation({
    mutationFn: (newNote: any) =>
      axiosInstance.post(
        `${API_BASE_URL}/company/${companyId}/notes/create`,
        newNote
      ),
    onSuccess: (response) => setNoteId(response.data.id),
    onError: (error) => {
      console.log(error?.response?.data);
       Sentry.captureException(error, { 
        tags: { action: 'create_youtube_note' },
        extra: { url: urlInputValue, userId, email, videoId }
      });

      alert(t("Failed to create note, please try again."));
    },
  });

  const handleProcess = () => {
    if (!urlInputValue) alert(t("Please add youtube link first."));
    else {
      if (isValid && urlInputValue) {
         posthog.capture('youtube_create_clicked', { userId, email, url: urlInputValue })

        const languageCode =
          ISO_TO_LANGUAGE[selectedLanguage]?.lng_code || "auto";
        draftNoteMutation.mutate({
          note_type: "youtube",
          name: t("Youtube Note"),
          file_name: "",
          transcript: t("Not transcribed yet"),
          language: "en",
          language_code: languageCode,
          youtube_url: urlInputValue,
          folder_id: selectedFolder?.id,
        });
      }
    }
  };

  const markUploadAsFinished = useMutation({
    mutationFn: (noteId: string) => {
      return axiosInstance.put(
        API_BASE_URL + `/company/${companyId}/notes/${noteId}/setAsUploaded`,
        {}
      );
    },
    onSuccess: () => {
      console.log("Note marked as finished!");
      setUrlInputValue("");
      setIsOpen(false);
      toast.success(t("Note has been created"));
      refetch();
    },
    onError: (error) => {
        Sentry.captureException(error, { 
        tags: { action: 'finalize_youtube_note' },
        extra: { noteId, email, userId }
      });

      console.log("Mark upload as finished error:", error.response?.data);
      console.log(
        t(
          "Sorry, couldn't start processing your note. Please try again by creating new one."
        )
      );
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {/* <Plus className=" h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" /> */}
        {component}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Youtube note")}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-3">
            <Input
              id="url"
              value={urlInputValue}
              onChange={(e) => handleUrlChange(e.target.value)}
              autoFocus
              placeholder={t("http://youtube.com/")}
              aria-invalid={urlInputValue ? !isValid : false}
              className={cn(
                "w-full",
                isValid
                  ? "border-green-500 focus-visible:ring-green-500"
                  : "border-border bg-background focus-visible:ring-ring"
              )}
            />
          </div>
        </div>
        <DialogFooter>
          <Label htmlFor={"lang"}>{t("Translate to")}:</Label>

          <Select
            defaultValue="auto"
            onValueChange={(val) => setSelectedLanguage(val)}
          >
            <SelectTrigger className="[&>span_svg]:text-muted-foreground/80 max-w-2xl [&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span_svg]:shrink-0">
              <SelectValue placeholder={t("Select language")} />
            </SelectTrigger>
            <SelectContent
              id="lang"
              className="[&_*[role=option]>span>svg]:text-muted-foreground/80 max-h-100 [&_*[role=option]]:pr-4 [&_*[role=option]]:pl-2 [&_*[role=option]>span]:right-2 [&_*[role=option]>span]:left-auto [&_*[role=option]>span]:flex [&_*[role=option]>span]:items-center [&_*[role=option]>span]:gap-2 [&_*[role=option]>span>svg]:shrink-0"
            >
              {availableLanguages.map((country, index) => (
                <SelectItem key={index} value={country.iso}>
                  <span className="truncate">{`${country.flag} ${country.language}`}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DialogClose asChild>
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={handleClose}
            >
              {t("Cancel")}
            </Button>
          </DialogClose>

          <Button
            disabled={
              !urlInputValue.trim() ||
              draftNoteMutation.isPending ||
              markUploadAsFinished.isPending
            }
            onClick={() => handleProcess()}
            className="cursor-pointer"
          >
            {(draftNoteMutation.isPending ||
              markUploadAsFinished.isPending) && <Spinner />}
            {draftNoteMutation.isPending ? t("Saving...") : t("Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateYoutubeNote;