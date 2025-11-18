import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL, ISO_TO_LANGUAGE } from "@/services/config";
import { useUserStore } from "@/store/userStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import AIIcon from "@/note-detail/ai-icon";
import { Card, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import QuizHardPenIcon from "@/note-detail/quiz-hard-pen-icon";
import FlashcardIcon from "@/note-detail/flashcard-icon";
import { StickyAiButton } from "../components/sticky-ai-button";
import { FlashcardsTab } from "@/note-detail/flashcard-tab";
import { AIQuizTab } from "@/note-detail/quiz-tab";
import { GenericAILoading } from "../components/generic-ai-loading";
import { Switch } from "../components/ui/switch";
import { Avatar } from "../components/ui/avatar";
import CatPenIcon from "@/notes/cat-pen-icon";


const AiModal = ({ noteId, noteQuery, isPolling, setIsPolling, startPollingForQuiz }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [view, setView] = useState<"quiz" | "flash" | undefined>();
  const [quizLevel, setQuizLevel] = useState(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const companyId = useUserStore((state) => state.companyId);

  // Handle dialog close (including X button)
  const handleClose = () => {
    setIsOpen(false);
  };

  const generateStudyMaterialNoteMutation = useMutation({
    mutationFn: () => {
      return axiosInstance.put(
        `${API_BASE_URL}/company/${companyId}/notes/${noteId}/generate-for-study`
      );
    },
    onSuccess: () => {
      setIsPolling(true);
      startPollingForQuiz()
      setErrorMessage(null);
    },
    onError: (error: any) => {
      setErrorMessage(
        error.response?.data?.message || "Failed to start quiz generation"
      );
    },
  });

     const noteAlertsMutation = useMutation({
        mutationFn: (enabled: boolean) => {
        return axiosInstance.put(`${API_BASE_URL}/company/${companyId}/notes/${noteId}/toggleQuizAlerts`, {
            enabled: enabled,
        });
        },
        // 3. Implement optimistic update
        onMutate: async (newEnabledValue: boolean) => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        await queryClient.cancelQueries([`notes-${noteId}`]);

        // Snapshot the previous value
        const previousNoteData = queryClient.getQueryData<any>([`notes-${noteId}`]);

        // Optimistically update the cache for the specific note
        // Assuming your query data for notes-${noteId} has a 'quizAlertEnabled' field
        queryClient.setQueryData<any>([`notes-${noteId}`], old => {
            if (old) {
            return { ...old, quizAlertEnabled: newEnabledValue };
            }
            return old;
        });

        // Return a context object with the snapshotted value
        return { previousNoteData };
        },
        onError: (error: any, newEnabledValue, context) => {
        console.log('Error updating quiz alerts:', error.response);
        toast.error('Failed to update quiz alerts. Please try again.');
        // If the mutation fails, use the context for rollback
        if (context?.previousNoteData) {
            queryClient.setQueryData<any>([`notes-${noteId}`], context.previousNoteData);
            // Also revert the local state if it was optimistically updated
            //setLocalQuizAlertEnabled(context.previousNoteData.quizAlertEnabled);
        }
        },
        onSuccess: (data) => {
      toast.success('Quiz alerts updated successfully!', { 
            position: 'bottom-center',
        });
        // Optionally, you might not need to invalidate here if your `onMutate`
        // already set the correct state and you trust the server.
        // However, invalidation is safer to ensure data consistency.
        queryClient.invalidateQueries([`notes-${noteId}`]);
        },
        onSettled: () => {
        // This will run whether the mutation succeeded or failed.
        // It's a good place to ensure data is eventually consistent with the server.
        queryClient.invalidateQueries([`notes-${noteId}`]);
        },
    });


  const isLoading = noteQuery.data?.data?.quiz_status == "in_progress" || generateStudyMaterialNoteMutation.isPending;
  const alertEnabled =  noteQuery.data?.data?.quiz_alerts_enabled

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <StickyAiButton onClick={() => setIsOpen(true)} />
      </DialogTrigger>

      <DialogContent className="sm:max-w-4xl max-w-3xl">
        <DialogHeader>
            {
                (!isLoading) && (
                    <>
                        <DialogTitle className="flex flex-row justify-start items-center">
                            {/* <Badge className={cn("h-8 w-8 p-0 flex items-center justify-center", alertEnabled && "border-pink-300 bg-pink-100 dark:border-pink-300/10 dark:bg-pink-400/10")}>
                                {alertEnabled ? <BellRing className="h-4 w-4 stroke-pink-700 dark:stroke-pink-500" /> : <BellOff className="h-4 w-4" />}
                            </Badge> */}
                            {view === "quiz" ? alertEnabled ? "Quiz alerts": "Enable alerts"  : (view === 'flash' ? "Flashcards" : "AI Assistant")}
                            { view === 'quiz' &&  <Switch className="ml-2" value={alertEnabled} onCheckedChange={value => noteAlertsMutation.mutate(value)} />  }
                            {noteAlertsMutation.isPending && <Spinner className="ml-2" /> }
                        </DialogTitle>
                        {
                            view === 'quiz' ? (
                                <DialogDescription>
                                    {`Get yourself prepared with random ${noteQuery.data?.data?.name} questions`}
                                </DialogDescription>
                            ) : view === 'flash' ? null : (
                                <DialogDescription>
                                   Choose an AI-powered tool to enhance your learning experience.
                                </DialogDescription>
                            )
                        }
                    </>
                )
            }
        </DialogHeader>
        {isLoading ? (
            <GenericAILoading
                mainTitle="Note name"
                subtitle={"Generating quiz"}
                description={"It might take a minute, please wait"}
            />
        ) : noteQuery.data?.data?.quiz_status !== 'generated' ? (
          <div className="flex flex-col items-center justify-center text-center p-8">
             <Avatar className="h-16 w-16 rounded-md bg-gray-950 flex items-center mb-8 ">
                {/* <CatLogo /> */}
                <CatPenIcon />
              </Avatar>

            <h3 className="text-xl font-semibold text-foreground mb-2">
              Unlock Your AI Tools
            </h3>

            <p className="max-w-sm text-muted-foreground mb-8">
              AI-powered quizzes and flashcards have not been generated for this
              note yet. Click the button below to create them.
            </p>

            <Button
              size="lg"
              onClick={generateStudyMaterialNoteMutation.mutate}
              disabled={generateStudyMaterialNoteMutation.isPending}
              className="cursor-pointer"
            >
              <AIIcon className="h-10 w-10 text-primary" />
              Generate Quizzes & Flashcards
              {/* )} */}
            </Button>
          </div>
        ) : view === "flash" ? (
            <FlashcardsTab noteId={noteId} />
        ) : view === "quiz" ? (
            <AIQuizTab quizLevel={quizLevel} setQuizLevel={setQuizLevel} quizData={noteQuery?.data?.data?.questions} noteId={noteId} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <Card
              className="transition-all hover:shadow-lg hover:border-primary/30 cursor-pointer"
              onClick={() => setView("quiz")}
            >
              <CardHeader className="flex flex-col items-center text-center p-6">
                <div className="mb-4 p-4 bg-zinc-950  rounded-md">
                  <QuizHardPenIcon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-lg">AI Quiz</CardTitle>
                <CardDescription className="text-sm">
                  Test your knowledge with a personalized quiz based on your
                  note.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Flashcards Card */}
            <Card
              className="transition-all hover:shadow-lg hover:border-primary/30 cursor-pointer"
              onClick={() => setView("flash")}
            >
              <CardHeader className="flex flex-col items-center text-center p-6">
                <div className="mb-4 p-4 bg-zinc-950 rounded-md">
                  <FlashcardIcon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-lg">Flashcards</CardTitle>
                <CardDescription className="text-sm">
                  Review key concepts and definitions from your note.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        )}
        {/* --- THIS IS THE NEW CARD LAYOUT --- */}

        {(view || quizLevel) && (
          <DialogFooter>
            <Button className="cursor-pointer" type="submit" onClick={() => {
                if (quizLevel)
                    setQuizLevel(null);
                else {
                    setView(undefined)
                }
            }}>
              {view === "quiz" && quizLevel ? "Back to quiz levels" : "Back to AI tools"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AiModal;
