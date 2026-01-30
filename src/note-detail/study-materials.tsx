import { useState, useRef, useLayoutEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Lottie from "lottie-react";
import { useTranslation } from "react-i18next";
import * as Sentry from "@sentry/react";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Sparkles
} from "lucide-react";
import typingAnimation from './assets/typing.json';
import { TypeAnimation } from 'react-type-animation';

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";

// Services / Stores
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import { useUserStore } from "@/store/userStore";

// Icons
import QuizHardPenIcon from "@/note-detail/assets/quiz-hard-pen-icon";
import FlashcardIcon from "@/note-detail/assets/flashcard-icon";

// Components
import { FlashcardsTab } from "@/note-detail/flashcard-tab";
import { AIQuizTab } from "@/note-detail/quiz-tab";
import { GenericAILoading } from "../components/generic-ai-loading";
import successAnimation from "./../notes/assets/done.json"; 
import { AiOrbitAnimation } from "./ai-orbit-animation";

export const StudyMaterials = ({ 
  noteId, 
  noteQuery, 
  setIsPolling 
}: { 
  noteId: string, 
  noteQuery: any, 
  setIsPolling?: (polling: boolean) => void 
}) => {
  const { t } = useTranslation();
  const { companyId, userId, email } = useUserStore();
  const queryClient = useQueryClient();

  // View State
  const [view, setView] = useState<"quiz" | "flash" | undefined>();
  const [quizLevel, setQuizLevel] = useState<"easy" | "hard" | "bonus" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Animation State
  const [showSuccess, setShowSuccess] = useState(false);
  const prevStatusRef = useRef(noteQuery.data?.quiz_status);

  // --- MUTATIONS ---
  const generateStudyMaterialNoteMutation = useMutation({
    mutationFn: async () => {
      return await axiosInstance.put(
        `${API_BASE_URL}/company/${companyId}/notes/${noteId}/generate-for-study`
      );
    },
    onSuccess: () => {
      if (setIsPolling) {
        setIsPolling(true);
      }
      setErrorMessage(null);
      // Optimistic update
      queryClient.setQueryData<any>([`notes-${noteId}`], old => {
        if (old) {
          console.log("now will be",  { ...old, data: { ...old.data, quiz_status: "in_progress" } })
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

  // --- EFFECTS ---
  useLayoutEffect(() => {
    const currentStatus = noteQuery.data?.quiz_status;
    const prevStatus = prevStatusRef.current;

    if (prevStatus === 'in_progress' && currentStatus === 'generated') {
      setShowSuccess(true);
     if (setIsPolling) setIsPolling(false);
      const timer = setTimeout(() => setShowSuccess(false), 2500);
      return () => clearTimeout(timer);
    }
    prevStatusRef.current = currentStatus;
  }, [noteQuery.data?.quiz_status, setIsPolling]);

  // --- RENDER HELPERS ---
  const isLoading =
    (noteQuery.data?.quiz_status === "in_progress" || generateStudyMaterialNoteMutation.isPending) && 
    !showSuccess;

  const alertEnabled = noteQuery.data?.quiz_alerts_enabled;
  const isGenerated = noteQuery.data?.quiz_status === 'generated';

  // --- HEADER SECTION (Handles Titles & Back Buttons) ---
  const renderHeader = () => {
    if (isLoading || showSuccess) return null;

    return (
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center text-primary gap-2">
            {view === "quiz" ? t("AI Quiz") : view === 'flash' ? t("Flashcards") : t("AI Study Tools")}
            {view === 'quiz' && (
               <div className="flex items-center gap-2 ml-4">
                 <Switch checked={alertEnabled} onCheckedChange={value => noteAlertsMutation.mutate(value)} />
                 <span className="text-sm font-normal text-muted-foreground">{alertEnabled ? t("Alerts On") : t("Alerts Off")}</span>
                 {noteAlertsMutation.isPending && <Spinner className="h-4 w-4" />}
               </div>
            )}
          </h2>
          <p className="text-muted-foreground">
            {view === 'quiz' 
              ? t("Test your knowledge with personalized questions.") 
              : view === 'flash' 
                ? t("Review key concepts.") 
                : t("Choose a tool to enhance your learning.")}
          </p>
        </div>

        {/* Back Button Logic */}
        {(view || quizLevel) && (
          <Button 
            variant="outline" 
            onClick={() => {
              if (quizLevel) setQuizLevel(null);
              else setView(undefined);
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {view === "quiz" && quizLevel ? t("Back to Levels") : t("Back to Tools")}
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-1 md:p-6 min-h-[500px]">
      {renderHeader()}

      {/* --- STATE 1: LOADING --- */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <GenericAILoading
            mainTitle={noteQuery?.data?.name || t("Note name")}
            subtitle={(
              <TypeAnimation
                sequence={[
                  t('Generating study materials'), // Types this
                  2000,                         // Waits 2s
                  t('Generating quizzes and flashcards'),     // Deletes previous, types this
                  2000                      // Waits 2s

                ]}
                wrapper="span"
                speed={50}
                repeat={Infinity}
                className="text-muted-foreground" // Styling to match your organic theme
                cursor={true}
              />
            )}
            description={t("Creating quizzes and flashcards tailored to this note.")}
            animationComponent={(
                <Lottie 
                    animationData={typingAnimation} 
                    loop={true} 
                    autoplay={true}
                    style={{ width: "30%", height: "100%" }}
                />
            )}
          />
          

        </div>
      ) : showSuccess ? (

        /* --- STATE 2: SUCCESS ANIMATION --- */
        <div className="flex flex-col items-center justify-center min-h-[400px]">
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
            className="text-2xl font-semibold"
          >
            {t("Ready to learn!")}
          </motion.h3>
        </div>

      ) : !isGenerated ? (

        /* --- STATE 3: UNLOCK SCREEN --- */
        <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-muted/30 rounded-4xl border border-dashed border-muted-foreground/25">
          <Avatar className="h-30 w-30 rounded-xl bg-transparent  flex items-center justify-center mb-6">
            <AiOrbitAnimation />
            {/* <CatPenIcon className="w-10 h-10 text-primary" /> */}
          </Avatar>
          <h3 className="text-2xl font-semibold mb-3">
            {t("Unlock Study Tools")}
          </h3>
          <p className="max-w-md text-muted-foreground mb-8 text-lg">
            {t("Generate personalized quizzes and flashcards to master this note.")}
          </p>
          <Button
            size="lg"
            onClick={() => generateStudyMaterialNoteMutation.mutate()}
            disabled={generateStudyMaterialNoteMutation.isPending}
            className="gap-2 h-12 px-8 text-base shadow-lg hover:shadow-primary/25 transition-all"
          >
            <Sparkles className="h-5 w-5" />
            {t("Generate Materials")}
          </Button>
        </div>

      ) : (

        /* --- STATE 4: CONTENT --- */
        <div className="animate-in fade-in duration-500 slide-in-from-bottom-2">
          {view === "flash" ? (
            <FlashcardsTab noteId={noteId} />
          ) : view === "quiz" ? (
            <AIQuizTab 
              quizLevel={quizLevel} 
              setQuizLevel={setQuizLevel} 
              quizData={noteQuery?.data?.questions} 
              noteId={noteId} 
            />
          ) : (
            /* --- DASHBOARD SELECTION --- */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <Card
                className="group relative overflow-hidden cursor-pointer border-muted-foreground/20 hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-1"
                onClick={() => setView("quiz")}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="flex flex-col items-center text-center p-8">
                  <div className="mb-6 p-4 bg-pink-500/10 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                    <QuizHardPenIcon className="h-10 w-10 text-primary" useBrandGradient />
                  </div>
                  <CardTitle className="text-xl mb-2">{t("AI Quiz")}</CardTitle>
                  <CardDescription className="text-base">
                    {t("Challenge yourself with adaptive questions based on your notes.")}
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card
                className="group relative overflow-hidden cursor-pointer border-muted-foreground/20 hover:border-primary/50 transition-all hover:shadow-lg hover:-translate-y-1"
                onClick={() => setView("flash")}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="flex flex-col items-center text-center p-8">
                  <div className="mb-6 p-4 bg-indigo-500/10 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                    <FlashcardIcon className="h-10 w-10 text-indigo-500" />
                  </div>
                  <CardTitle className="text-xl mb-2">{t("Flashcards")}</CardTitle>
                  <CardDescription className="text-base">
                    {t("Memorize key definitions and concepts quickly.")}
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};