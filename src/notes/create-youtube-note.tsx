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
import { API_BASE_URL, ISO_TO_LANGUAGE } from "@/services/config";
import { useUserStore } from "@/store/userStore";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


  const availableLanguages = [
    { iso: "auto", flag: "🤖", language: "Auto" },
    ...Object.entries(ISO_TO_LANGUAGE).map(([iso, data]) => ({
      iso,
      ...data
    }))
  ];

const CreateYoutubeNote = () => {
  const [urlInputValue, setUrlInputValue] = useState("");
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const email = useUserStore((store) => store.email);
  const userName = useUserStore((store) => store.userName);
  const userId = useUserStore((store) => store.userId);
  const queryClient = useQueryClient();
  const selectedFolder = useUserStore(store => store.selectedFolder);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [videoId, setVideoId] = useState<string | undefined>();
  const [selectedLanguage, setSelectedLanguage] = useState("auto"); // Default to "auto"
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [noteId, setNoteId] = useState<string | undefined>();
  const subscriptionStatus = useUserStore(store=> store.subscriptionStatus);
  const navigate = useNavigate();

  const companyId = useUserStore((state) => state.companyId);



    useEffect(() => {
    const timeoutId = setTimeout(() => {
        setIsValid(validateYouTubeUrl(urlInputValue))
        }, 1000);
        return () => clearTimeout(timeoutId);
    }, [urlInputValue]);

    useEffect(() => {
        if (noteId)  markUploadAsFinished.mutate(noteId);
    }, [noteId])
    


  // Handle dialog close (including X button)
  const handleClose = () => {
    setUrlInputValue("");
    setIsOpen(false);
  };

  const getYouTubeVideoId = (url: string) => {
    const isShorts = url.includes('youtube.com/shorts/');
    if (isShorts) {
      alert("Shorts aren't supported");
    }
    const regex = /^(?:https?:\/\/)?(?:www\.|m\.)?(?:(?:youtube\.com\/(?:watch\?v=|v\/|embed\/|live\/))|(?:youtu\.be|y2u\.be)\/)([a-zA-Z0-9_-]{11})(?:[?&].*)?$/i;
    const match = url.match(regex);
    console.log("match", match);
    return match && match[1] && !isShorts ? setVideoId(match[1]) : null;
  }

  const validateYouTubeUrl = (url: string) => {
    if (!url) {
      clearInput()
      return null;
    }

    const youtubeRegex = /^(?:https?:\/\/)?(?:www\.|m\.)?(?:(?:youtube\.com\/(?:watch\?v=|v\/|embed\/|live\/))|(?:youtu\.be|y2u\.be)\/)([a-zA-Z0-9_-]{11})(?:[?&].*)?$/i;
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

  const handleLanguageSelect = (languageIso: string) => {
    const languageCode = ISO_TO_LANGUAGE[languageIso]?.lng_code || "auto";
    console.log("Changed language:", languageIso, languageCode);
    setSelectedLanguage(languageIso);
    setShowLanguageModal(false);
  };
  const getLanguageDisplayText = () => {
    const leftText = t('Translation');

    if (selectedLanguage === "auto") {
      return { left: leftText, right: `🤖 ${t("Auto")}` };
    }

    const languageData = ISO_TO_LANGUAGE[selectedLanguage];
    if (languageData) {
      return { left: leftText, right: `${languageData.flag}  ${languageData.language}` };
    }

    return { left: leftText, right: "Auto" };
  };


  const draftNoteMutation = useMutation({
    mutationFn: (newNote: any) =>
      axiosInstance.post(
        `${API_BASE_URL}/company/${companyId}/notes/create`,
        newNote
      ),
      onSuccess: response => setNoteId(response.data.id),
    onError: (error) => {
      console.log(error?.response?.data);
      alert("Failed to create note, please try again.");
    },
  });

  const handleProcess = () => {
    if (!urlInputValue)
      alert("Please add youtube link first.");
    else {
      if (isValid && urlInputValue){
        //  postHog.capture("custom_create_note", {
        //   note_type: noteType,
        //   youtube_url: youtubeUrl,
        //   isValid: isValid,
        //   language: selectedLanguage,
        //   subscription: subscriptionStatus
        // });
        const languageCode = ISO_TO_LANGUAGE[selectedLanguage]?.lng_code || "auto";
        draftNoteMutation.mutate({
          note_type: 'youtube',
          name: "Youtube Note",
          file_name: "",
          transcript: "Not transcribed yet",
          language: "en",
          language_code: languageCode,
          youtube_url: urlInputValue,
          folder_id: selectedFolder?.id,
          // trans
        });
      }
    }
  };

  const markUploadAsFinished = useMutation({
    mutationFn: (noteId: string) => {
      return axiosInstance.put(API_BASE_URL + `/company/${companyId}/notes/${noteId}/setAsUploaded`, {});
    },
    onSuccess: () => {
      console.log('Note marked as finished!');
      setUrlInputValue("")
      setIsOpen(false);
      toast.success("Note has been created");
    },
    onError: (error) => {
      console.log('Mark upload as finished error:', error.response?.data);
    //   Sentry.captureException(error,
    //     {
    //       extra: {
    //         noteId,
    //         companyId,
    //         materialZipUri,
    //       },
    //     }
    //   );
      console.log("Sorry, couldn't start processing your note. Please try again by creating new one.")
    //   queryClient.invalidateQueries(['notes'])
    //   queryClient.invalidateQueries(['profile'])
    //   setTimeout(() => {
    //     router.dismissAll();
    //   }, 1000);
      // noteLogger.error(noteId, `Error marking upload as finished: ${error.response?.data}`)
    },
  });



  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
         <Plus className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Youtube note</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-3">
            <Input
              id="url"
              value={urlInputValue}
              onChange={(e) => handleUrlChange(e.target.value)}
              autoFocus
              placeholder="http://youtube.com/"
              aria-invalid={urlInputValue ? !isValid : false}
              className={cn(
                    "w-full",
                    isValid
                        ? "border-green-500 focus-visible:ring-green-500" // Success styles
                        : "border-border bg-background focus-visible:ring-ring" // Default
                    )}
            />
          </div>
        </div>
        <DialogFooter>
             <Label htmlFor={"lang"}>Translation:</Label>

            <Select defaultValue='Auto'onValueChange={val => setSelectedLanguage(val)} >
                <SelectTrigger
                className='[&>span_svg]:text-muted-foreground/80 max-w-2xl [&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span_svg]:shrink-0'
                >
                <SelectValue placeholder='Select framework' />
                </SelectTrigger>
        <SelectContent  id="lang" className='[&_*[role=option]>span>svg]:text-muted-foreground/80 max-h-100 [&_*[role=option]]:pr-4 [&_*[role=option]]:pl-2 [&_*[role=option]>span]:right-2 [&_*[role=option]>span]:left-auto [&_*[role=option]>span]:flex [&_*[role=option]>span]:items-center [&_*[role=option]>span]:gap-2 [&_*[role=option]>span>svg]:shrink-0'>
          {availableLanguages.map((country, index) => (
            <SelectItem key={index} value={country.iso}>
              <span className='truncate'>{`${country.flag} ${country.language}`}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

          <DialogClose asChild>
            <Button variant="outline" className="cursor-pointer" onClick={handleClose}>
              Cancel
            </Button>
          </DialogClose>

          <Button
            disabled={!urlInputValue.trim() || draftNoteMutation.isPending || markUploadAsFinished.isPending}
            onClick={() => handleProcess()}
            className="cursor-pointer"
          >
            {(draftNoteMutation.isPending || markUploadAsFinished.isPending) && <Spinner />}
            {draftNoteMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateYoutubeNote;