'use client';

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/services/config";
import { axiosInstance } from "@/services/auth";
import { useUserStore } from "@/store/userStore";
import { POLLING_INTERVAL_MS } from ".";
import {GradientProgress} from '@/components/gradient-progress'
/**
 * A component to display an interactive, flippable set of flashcards.
 * @param {object} props
 * @param {Array<{question: string, answer: string}>} [props.flashcards] - The array of flashcard data.
 */
export function FlashcardsTab({ noteId }) {
    const { companyId } = useUserStore()
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const flashcards = useRef<FlashCard[]>([])

   const noteQuestionsQuery = useQuery({
      queryKey: [`notes-${noteId}-questions`],
      queryFn: async () => {
        return axiosInstance.get(`${API_BASE_URL}/company/${companyId}/notes/${noteId}/questions`);
      },
      refetchInterval: (data, query) => {
        const isGenerating = data?.data?.quiz_status == 'in_progress'; // This will be the array of notes returned by queryFn
        console.log(`[Note ${noteId} Flashcard Generation status isGenerating:`, isGenerating);
    
          if (isGenerating) {
  
            return POLLING_INTERVAL_MS;
          } else {
            return false;
          }
          
      },
      enabled: true,
      onError: (error: any) => {
        setErrorMessage(
          error.response?.data?.message || t('Failed to fetch flashcards status')
        );
      },
    });


//     const generateStudyMaterialNoteMutation = useMutation({
//     mutationFn: () => {
//       return axiosInstance.put(`${API_BASE_URL}/company/${companyId}/notes/${noteId}/generate-for-study`);
//     },
//     onSuccess: () => {
//       noteQuestionsQuery.refetch();
//       queryClient.invalidateQueries([`notes-${noteId}`]);
//       setErrorMessage(null);
//       queryClient.invalidateQueries([`notes-${noteId}-questions`]);
//     },
//     onError: (error: any) => {
//       Sentry.captureException(error, { extra: { companyId, userId } });
//        postHog.capture("flashcard_screen_error", {
//           user_id: userId,
//           company_id: companyId,
//           note_id: noteId,
//           error,
//           action: `notes/${noteId}/generate-for-study`
//         });
//       setErrorMessage(
//         error.response?.data?.message || t('Failed to start flashcard generation')
//       );
//     },
//   });


   if (noteQuestionsQuery.data?.data?.flashcards_json && flashcards.current.length === 0) {
        flashcards.current = JSON.parse(noteQuestionsQuery.data?.data?.flashcards_json);
      }


  // Safety check for empty or missing data
  if (!flashcards.current || flashcards.current.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-muted/50 h-64">
        <h3 className="text-lg font-semibold text-muted-foreground">No Flashcards Available</h3>
        <p className="text-sm text-muted-foreground mt-2">The AI has not generated any flashcards for this note yet.</p>
      </div>
    );
  }

  const currentCard = flashcards.current[currentCardIndex];
  const totalCards = flashcards.current.length;

  const handleNext = () => {
    if (currentCardIndex < totalCards - 1) {
      setIsFlipped(false); // Always show the question first
      // A small delay allows the flip-back animation to start before the card content changes
      setTimeout(() => {
        setCurrentCardIndex(currentCardIndex + 1);
      }, 150);
    }
  };

  const handlePrevious = () => {
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
      {/* Perspective container for the 3D effect */}
      <div
        className="w-full max-w-2xl h-80 cursor-pointer [perspective:1000px]"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* The flippable inner container */}
        <div
          className={cn(
            "relative w-full h-full transition-transform duration-700 ease-in-out [transform-style:preserve-3d]",
            isFlipped && "[transform:rotateY(180deg)]"
          )}
        >
          {/* --- Front of the Card (Question) --- */}
          <Card className="bg-muted absolute w-full h-full flex flex-col [backface-visibility:hidden]">
            <div className="p-4 border-b">
              <p className="font-semibold text-primary">Question</p>
            </div>
            <CardContent className="flex-1 flex items-center justify-center p-6">
              <p className="text-xl text-center font-medium">{currentCard.question}</p>
            </CardContent>
            <div className="p-4 border-t text-right">
              <p className="text-sm text-muted-foreground">Click card to reveal answer</p>
            </div>
          </Card>

          {/* --- Back of the Card (Answer) --- */}
          <Card className="bg-muted absolute w-full h-full flex flex-col [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className="p-4 border-b">
              <p className="font-semibold text-green-600">Answer</p>
            </div>
            <CardContent className="flex-1 flex items-center justify-center p-6">
              <p className="text-lg text-center">{currentCard.answer}</p>
            </CardContent>
            <div className="p-4 border-t text-right">
               <p className="text-sm text-muted-foreground">Click card to hide answer</p>
            </div>
          </Card>
        </div>
      </div>

      {/* --- Progress and Navigation --- */}
      <div className="w-full max-w-2xl space-y-4">
        <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
          <span>Progress</span>
          <span>Card {currentCardIndex + 1} of {totalCards}</span>
        </div>
          <GradientProgress value={progressValue} /> 
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button variant="outline" size="lg" onClick={handlePrevious} disabled={currentCardIndex === 0}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Previous
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsFlipped(!isFlipped)}>
            <RefreshCw className={cn("h-5 w-5 transition-transform duration-500", isFlipped && "rotate-180")} />
          </Button>
          <Button variant="outline" size="lg" onClick={handleNext} disabled={currentCardIndex === totalCards - 1}>
            Next <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}