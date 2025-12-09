'use client';

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/services/config";
import { axiosInstance } from "@/services/auth";
import { useUserStore } from "@/store/userStore";
import { POLLING_INTERVAL_MS } from ".";
import { GradientProgress } from '@/components/gradient-progress';
import { useTranslation } from "react-i18next"; // Import the hook
import * as Sentry from "@sentry/react"; 
import { usePostHog }  from 'posthog-js/react';

/**
 * A component to display an interactive, flippable set of flashcards.
 * @param {object} props
 * @param {Array<{question: string, answer: string}>} [props.flashcards] - The array of flashcard data.
 */
export function FlashcardsTab({ noteId }) {
  const { companyId, userId, email } = useUserStore();
  const posthog = usePostHog();
  const { t } = useTranslation(); // Initialize the translation hook
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const flashcards = useRef([]);

  const noteQuestionsQuery = useQuery({
    queryKey: [`notes-${noteId}-questions`],
    queryFn: async () => {
      return axiosInstance.get(`${API_BASE_URL}/company/${companyId}/notes/${noteId}/questions`);
    },
    refetchInterval: (query) => {
      const isGenerating = query.state?.data?.data?.quiz_status === 'in_progress';
      if (isGenerating) {
        return POLLING_INTERVAL_MS;
      } else {
        return false;
      }
    },
    enabled: true,
    onError: (error: any) => {
      Sentry.captureException(error, { 
        tags: { query: 'fetch_flashcards' },
        extra: { noteId }
      });

      setErrorMessage(
        error.response?.data?.message || t('Failed to fetch flashcards status')
      );
    },
  });

  if (noteQuestionsQuery.data?.data?.flashcards_json && flashcards.current.length === 0) {
   try {
      flashcards.current = JSON.parse(noteQuestionsQuery.data?.data?.flashcards_json);
    } catch (e) {
      console.error("Failed to parse flashcards JSON", e);
      Sentry.captureException(e, { 
        tags: { action: 'parse_flashcards_json' },
        extra: { noteId, rawJson: noteQuestionsQuery.data?.data?.flashcards_json }
      });
    }
  }

  // Safety check for empty or missing data
  if (!flashcards.current || flashcards.current.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-muted/50 h-64">
        <h3 className="text-lg font-semibold text-muted-foreground">{t("No Flashcards Available")}</h3>
        <p className="text-sm text-muted-foreground mt-2">{t("The AI has not generated any flashcards for this note yet.")}</p>
      </div>
    );
  }

  const currentCard = flashcards.current[currentCardIndex];
  const totalCards = flashcards.current.length;

  const handleNext = () => {
    posthog.capture('flashcard_next_clicked', { userId, email, index: currentCardIndex });
    if (currentCardIndex < totalCards - 1) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentCardIndex(currentCardIndex + 1);
      }, 150);
    }
  };

  const handlePrevious = () => {
    posthog.capture('flashcard_prev_clicked', { userId, email, index: currentCardIndex });
    if (currentCardIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentCardIndex(currentCardIndex - 1);
      }, 150);
    }
  };

  const progressValue = ((currentCardIndex + 1) / totalCards) * 100;

  return (
    <div className="w-full flex flex-col items-center gap-6">
      <div
        className="w-full max-w-2xl h-80 cursor-pointer [perspective:1000px]"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={cn(
            "relative w-full h-full transition-transform duration-700 ease-in-out [transform-style:preserve-3d]",
            isFlipped && "[transform:rotateY(180deg)]"
          )}
        >
          {/* --- Front of the Card (Question) --- */}
          <Card className="bg-muted absolute w-full h-full flex flex-col [backface-visibility:hidden]">
            <div className="p-4 border-b">
              <p className="font-semibold text-primary">{t("Question")}</p>
            </div>
            <CardContent className="flex-1 flex items-center justify-center p-6">
              <p className="text-xl text-center font-medium">{currentCard.question}</p>
            </CardContent>
            <div className="p-4 border-t text-right">
              <p className="text-sm text-muted-foreground">{t("Click card to reveal answer")}</p>
            </div>
          </Card>

          {/* --- Back of the Card (Answer) --- */}
          <Card className="bg-muted absolute w-full h-full flex flex-col [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className="p-4 border-b">
              <p className="font-semibold text-green-600">{t("Answer")}</p>
            </div>
            <CardContent className="flex-1 flex items-center justify-center p-6">
              <p className="text-lg text-center">{currentCard.answer}</p>
            </CardContent>
            <div className="p-4 border-t text-right">
               <p className="text-sm text-muted-foreground">{t("Click card to hide answer")}</p>
            </div>
          </Card>
        </div>
      </div>

      {/* --- Progress and Navigation --- */}
      <div className="w-full max-w-2xl space-y-4">
        <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
          <span>{t("Progress")}</span>
          <span>{t("Card {{current}} of {{total}}", { current: currentCardIndex + 1, total: totalCards })}</span>
        </div>
        <GradientProgress value={progressValue} />
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button variant="outline" size="lg" onClick={handlePrevious} disabled={currentCardIndex === 0}>
            <ArrowLeft className="h-4 w-4 mr-2" /> {t("Previous")}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsFlipped(!isFlipped)}>
            <RefreshCw className={cn("h-5 w-5 transition-transform duration-500", isFlipped && "rotate-180")} />
          </Button>
          <Button variant="outline" size="lg" onClick={handleNext} disabled={currentCardIndex === totalCards - 1}>
            {t("Next")} <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}