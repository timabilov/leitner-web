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
import { API_BASE_URL } from "@/services/config";
import { useUserStore } from "@/store/userStore";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useLayoutEffect } from "react"; // Changed useEffect to useLayoutEffect
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import AIIcon from "@/note-detail/assets/ai-icon";
import { Card, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import QuizHardPenIcon from "@/note-detail/assets/quiz-hard-pen-icon";
import FlashcardIcon from "@/note-detail/assets/flashcard-icon";
import { StickyAiButton } from "../components/sticky-ai-button";
import { FlashcardsTab } from "@/note-detail/flashcard-tab";
import { AIQuizTab } from "@/note-detail/quiz-tab";
import { GenericAILoading } from "../components/generic-ai-loading";
import { Switch } from "../components/ui/switch";
import { Avatar } from "../components/ui/avatar";
import CatPenIcon from "@/notes/cat-pen-icon";
import { useTranslation } from "react-i18next";
import * as Sentry from "@sentry/react";
import { motion, AnimatePresence } from "framer-motion";

// Lottie Imports
import Lottie from "lottie-react";
import successAnimation from "./../notes/done.json"; // Make sure path is correct
import { AiOrbitAnimation } from "./ai-orbit-animation";

const AiModal = ({ noteId, noteQuery, isPolling, setIsPolling, startPollingForQuiz }) => {
  const { t } = useTranslation();
  const { companyId, userId, email } = useUserStore();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [view, setView] = useState<"quiz" | "flash" | undefined>();
  const [quizLevel, setQuizLevel] = useState(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // --- ANIMATION STATE ---
  const [showSuccess, setShowSuccess] = useState(false);
  // Store the status from the previous render to detect changes
  const prevStatusRef = useRef(noteQuery?.data?.data?.quiz_status);

  const generateStudyMaterialNoteMutation = useMutation({
    mutationFn: () => {
      return axiosInstance.put(
        `${API_BASE_URL}/company/${companyId}/notes/${noteId}/generate-for-study`
      );
    },
    onSuccess: () => {
      setIsPolling(true);
      setErrorMessage(null);
      // Optimistic update: Set to "in_progress" immediately to prevent Unlock screen flash
      queryClient.setQueryData<any>([`notes-${noteId}`], old => {
        if (old) {
          return { ...old, data: { ...old.data, quiz_status: "in_progress" } };
        }
        return old;
      });
    },
    onError: (error: any) => {
       Sentry.captureException(error, { 
        tags: { action: 'generate_study_material' },
        extra: { noteId, userId, email }
      });
      setErrorMessage(
        error.response?.data?.message || t("Failed to start quiz generation")
      );
    },
  });

  // --- LOGIC: DETECT COMPLETION WITHOUT FLASH ---
  // usage of useLayoutEffect prevents the "flicker" of content before animation
  useLayoutEffect(() => {
    const currentStatus = noteQuery?.data?.data?.quiz_status;
    const prevStatus = prevStatusRef.current;

    // Trigger only if we transitioned from 'in_progress' to 'generated'
    if (prevStatus === 'in_progress' && currentStatus === 'generated') {
      setShowSuccess(true);
      
      // Stop polling now that we are done
      if (setIsPolling) setIsPolling(false);

      // Show Success Animation for 2.5 seconds, then show content
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 2500);

      return () => clearTimeout(timer);
    }

    // Update the ref for the next render
    prevStatusRef.current = currentStatus;
  }, [noteQuery?.data?.data?.quiz_status, setIsPolling]);

  const noteAlertsMutation = useMutation({
    mutationFn: (enabled: boolean) => {
      return axiosInstance.put(`${API_BASE_URL}/company/${companyId}/notes/${noteId}/toggleQuizAlerts`, {
        enabled: enabled,
      });
    },
    onMutate: async (newEnabledValue: boolean) => {
      await queryClient.cancelQueries({ queryKey: [`notes-${noteId}`] });
      const previousNoteData = queryClient.getQueryData<any>([`notes-${noteId}`]);
      queryClient.setQueryData<any>([`notes-${noteId}`], old => {
        if (old) {
          return { ...old, data: { ...old.data, quiz_alerts_enabled: newEnabledValue } };
        }
        return old;
      });
      return { previousNoteData };
    },
    onError: (error: any, newEnabledValue, context) => {
      toast.error(t('Failed to update quiz alerts. Please try again.'));
      if (context?.previousNoteData) {
        queryClient.setQueryData<any>([`notes-${noteId}`], context.previousNoteData);
      }
    },
    onSuccess: () => {
      toast.success(t('Quiz alerts updated successfully!'), { position: 'bottom-center' });
      queryClient.invalidateQueries({ queryKey: [`notes-${noteId}`] });
    },
  });

  // Loading Logic: True if processing OR if mutation is pending
  // BUT: If showSuccess is true, we are technically "done" loading, but showing animation
  const isLoading = 
    (noteQuery?.data?.data?.quiz_status === "in_progress" || generateStudyMaterialNoteMutation.isPending) && 
    !showSuccess;

  const alertEnabled = noteQuery?.data?.data?.quiz_alerts_enabled;
  const isGenerated = noteQuery?.data?.data?.quiz_status === 'generated';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <StickyAiButton onClick={() => setIsOpen(true)} />
          {/* <AiOrbitAnimation onClick={() => setIsOpen(true)} /> */}
      </DialogTrigger>

      {/* Added min-h to prevent layout shift during state changes */}
      <DialogContent className="sm:max-w-4xl max-w-3xl min-h-[450px]"> 
        <DialogHeader>
          {/* Hide Header during Loading OR Success Animation */}
          {!isLoading && !showSuccess && (
            <>
              <DialogTitle className="flex flex-row justify-start items-center">
                {view === "quiz" ? (alertEnabled ? t("Quiz alerts") : t("Enable alerts")) : view === 'flash' ? t("Flashcards") : t("AI Assistant")}
                {view === 'quiz' && <Switch className="ml-2" checked={alertEnabled} onCheckedChange={value => noteAlertsMutation.mutate(value)} />}
                {noteAlertsMutation.isPending && <Spinner className="ml-2" />}
              </DialogTitle>
              {view === 'quiz' ? (
                <DialogDescription>
                  {t("Get yourself prepared with random {{noteName}} questions", { noteName: noteQuery?.data?.data?.name })}
                </DialogDescription>
              ) : view === 'flash' ? null : (
                <DialogDescription>
                  {t("Choose an AI-powered tool to enhance your learning experience.")}
                </DialogDescription>
              )}
            </>
          )}
        </DialogHeader>

        {/* --- STATE 1: LOADING --- */}
        {isLoading ? (
          <GenericAILoading
            mainTitle={noteQuery?.data?.data?.name || t("Note name")}
            subtitle={t("Generating quiz")}
            description={t("It might take a minute, please wait")}
          />
        ) : showSuccess ? (
          
          /* --- STATE 2: SUCCESS ANIMATION (Lottie) --- */
          <div className="flex flex-col items-center justify-center h-full w-full py-10">
             <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
                className="w-48 h-48 mb-4"
             >
                 <Lottie 
                    animationData={successAnimation} 
                    loop={false} 
                    autoplay={true}
                    style={{ width: "100%", height: "100%" }}
                 />
             </motion.div>

             <motion.h3 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-semibold text-foreground"
             >
                {t("Ready to learn!")}
             </motion.h3>
             <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-muted-foreground mt-2"
             >
                {t("Your quizzes and flashcards have been generated.")}
             </motion.p>
          </div>

        ) : !isGenerated ? (
          
          /* --- STATE 3: UNLOCK / INITIAL --- */
          <div className="flex flex-col items-center justify-center text-center p-8 mt-4">
            <Avatar className="h-16 w-16 rounded-md bg-gray-950 flex items-center mb-8">
              <CatPenIcon />
            </Avatar>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {t("Unlock Your AI Tools")}
            </h3>
            <p className="max-w-sm text-muted-foreground mb-8">
              {t("AI-powered quizzes and flashcards have not been generated for this note yet. Click the button below to create them.")}
            </p>
            <Button
              size="lg"
              onClick={() => generateStudyMaterialNoteMutation.mutate()}
              disabled={generateStudyMaterialNoteMutation.isPending}
              className="cursor-pointer"
            >
              <AIIcon className="h-10 w-10 text-primary" />
              {t("Generate Quizzes & Flashcards")}
            </Button>
          </div>

        ) : (

          /* --- STATE 4: SELECTION VIEW / CONTENT --- */
          <>
             {view === "flash" ? (
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
                    <div className="mb-4 p-4 bg-zinc-950 rounded-md">
                      <QuizHardPenIcon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{t("AI Quiz")}</CardTitle>
                    <CardDescription className="text-sm">
                      {t("Test your knowledge with a personalized quiz based on your note.")}
                    </CardDescription>
                  </CardHeader>
                </Card>
                <Card
                  className="transition-all hover:shadow-lg hover:border-primary/30 cursor-pointer"
                  onClick={() => setView("flash")}
                >
                  <CardHeader className="flex flex-col items-center text-center p-6">
                    <div className="mb-4 p-4 bg-zinc-950 rounded-md">
                      <FlashcardIcon className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{t("Flashcards")}</CardTitle>
                    <CardDescription className="text-sm">
                      {t("Review key concepts and definitions from your note.")}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            )}
            {(view || quizLevel) && (
              <DialogFooter>
                <Button className="cursor-pointer" type="button" onClick={() => {
                  if (quizLevel) setQuizLevel(null);
                  else setView(undefined);
                }}>
                  {view === "quiz" && quizLevel ? t("Back to quiz levels") : t("Back to AI tools")}
                </Button>
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AiModal;