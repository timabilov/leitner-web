import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  ArrowRight,
  RotateCw,
  ArrowLeft,
  CircleAlert,
  Lightbulb,
  Dot,
  Gift,
  Trophy,
  Clock,
  Lock,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import { useUserStore } from "@/store/userStore";
import QuizPenIcon from "./assets/quiz-pen-icon";
import QuizHardPenIcon from "./assets/quiz-hard-pen-icon";
import QuizBonusPenIcon from "./assets/quiz-bonus-pen-icon";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import CatLogo from "./assets/cat-logo";
import GiftIcon from "./assets/gift-icon";
import {GradientProgress}  from '@/components/gradient-progress'
import { useTranslation } from "react-i18next"; // Import the hook
import * as Sentry from "@sentry/react"; 
import { usePostHog } from 'posthog-js/react';





const LevelCard = ({
  level,
  title,
  description,
  count,
  lastScore,
  onSelect,
  lastTakenDate,
  isLocked = false,
}: any) => {
  const { t } = useTranslation();
  
  // 🟢 Is this the special advanced card?
  const isBonus = level === "bonus";

  return (
    <button
      onClick={() => !isLocked && onSelect(level)}
      disabled={isLocked}
      className={cn(
        "group relative w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-ring overflow-hidden",
        
        // --- STYLING LOGIC ---
        
        // 1. Normal Unlocked Cards (Easy / Hard)
        !isBonus && !isLocked && "bg-white dark:bg-zinc-950 border-border hover:border-primary/50 hover:shadow-md dark:hover:bg-zinc-900",
        
        // 2. Normal Locked Cards (Easy / Hard)
        !isBonus && isLocked && "bg-zinc-50/50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800 opacity-70 cursor-not-allowed",
        
        // 3. Unlocked Bonus Card
        isBonus && !isLocked && "border-pink-500/30 dark:border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-rose-500/5 backdrop-blur-md hover:shadow-[0_0_20px_-5px_rgba(236,72,153,0.3)] hover:border-pink-500/60 dark:hover:border-pink-500/40",
        
        // 4. Locked Bonus Card (Needs to be visible enough to show the blur effect)
        isBonus && isLocked && "border-pink-500/20 dark:border-pink-500/10 bg-white/40 dark:bg-zinc-950/40 cursor-not-allowed"
      )}
    >
      
      {/* --- 🟢 LOCKED BONUS OVERLAY (The Magic Frosted Glass) --- */}
      {isBonus && isLocked && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/60 dark:bg-zinc-950/70 backdrop-blur-[3px]">
          
          {/* Glowing Gift Icon */}
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/30 mb-2">
            <Gift size={18} className="text-white" />
          </div>
          
          {/* Main Unlock Text */}
          <span className="text-[11px] font-bold tracking-wide text-zinc-900 dark:text-white mb-0.5">
            {t("Unlocks at 70% Quiz Completion")}
          </span>
          
          {/* 🟢 The 70% Requirement Text */}
        
          
        </div>
      )}

      {/* --- CONTENT AREA (Gets blurred if locked bonus) --- */}
      <div className={cn(
        "flex flex-col gap-1.5 flex-1 min-w-0 pr-4 relative z-10 transition-all",
        isBonus && isLocked && "opacity-30 blur-[3px] grayscale-[20%]" // Blurs the text underneath the gift icon!
      )}>
        
        {/* Header Row */}
        <div className="flex items-center gap-2">
          <h3 className={cn(
            "font-bold text-[15px] leading-none tracking-tight",
            isBonus ? "bg-gradient-to-r from-pink-600 to-rose-600 dark:from-pink-400 dark:to-rose-400 bg-clip-text text-transparent" : "text-foreground"
          )}>
            {title}
          </h3>
          
          {/* Difficulty Dots */}
          <div className="flex flex-row items-center">
              <Dot className="text-pink-500 -mr-3.5"/>
              <Dot className={" -mr-3.5 " + (level === "hard" || level === "bonus" ? "text-pink-500" :"text-pink-200 dark:text-zinc-700")}/>
              <Dot className={level === "bonus" ? "text-pink-500" :"text-pink-200 dark:text-zinc-700"}/>
          </div>
        </div>
        
        {/* Description */}
        <p className="text-xs text-muted-foreground truncate">
          {description}
        </p>

        {/* Stats Row (Always render it so the blur has something to cover, even if 0) */}
        <div className={cn(
          "flex items-center gap-4 mt-1.5 pt-1.5 border-t",
          isBonus ? "border-pink-500/10 dark:border-pink-500/20" : "border-border/50",
          (!lastScore && !lastTakenDate && !isLocked) && "hidden" // Hide if truly empty and unlocked
        )}>
          <div className="flex items-center gap-1 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
            <Trophy size={10} className="text-yellow-500" />
            {t("Best")}: {lastScore || 100}%
          </div>
          <div className="flex items-center gap-1 text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
            <Clock size={10} />
            {lastTakenDate || "2 days ago"}
          </div>
        </div>
      </div>

      {/* --- ACTION BUTTON / LOCK ICON --- */}
      <div className={cn(
        "flex items-center justify-center shrink-0 relative z-10",
        isBonus && isLocked && "opacity-0" // Hide the normal right-side button because the big Gift is in the middle!
      )}>
        {isLocked && !isBonus ? (
          <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
            <Lock size={14} />
          </div>
        ) : !isLocked ? (
          <div className={cn(
            "h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300",
            isBonus 
              ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/20 group-hover:scale-110" 
              : "bg-primary/10 group-hover:bg-primary text-primary group-hover:text-primary-foreground"
          )}>
            <Play size={14} className="ml-0.5" />
          </div>
        ) : null}
      </div>

    </button>
  );
};


export default LevelCard;


export function AIQuizTab({ quizData, noteId, quizLevel, setQuizLevel }) {
 const { companyId, userId, email, fullName } = useUserStore();
  const { t } = useTranslation(); // Initialize hook
  const posthog = usePostHog();
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const queryClient = useQueryClient();

   useEffect(() => {
    posthog.capture("quiz_tab_viewed", { note_id: noteId });
  }, [posthog, noteId]);

  
  const getLastAnsweredDate = (questions: any[]) => {
    const answeredDates = questions
      .filter((q: any) => q.user_answered_date)
      .map((q: any) => new Date(q.user_answered_date));
    return answeredDates.length > 0
      ? new Date(Math.max(...answeredDates)).toLocaleDateString()
      : t("Not taken");
  };

  const quizLevels = useMemo(() => {
    const levels = {
      easy: { count: 0, lastScore: null, questions: [], lastTaken: null },
      hard: { count: 0, lastScore: null, questions: [], lastTaken: null  },
      bonus: { count: 0, lastScore: null, questions: [], lastTaken: null  },
    };
    if (!Array.isArray(quizData)) return levels;

    const groups = quizData.reduce((acc, q) => {
      const level = q.complexity_level;
      if (!acc[level]) acc[level] = { questions: [], correct: 0, answered: 0 };
      acc[level].questions.push(q);
      if (q.user_answer !== null && q.user_answer !== "") {
        acc[level].answered++;
        if (String(q.user_answer) === String(q.answer)) acc[level].correct++;
      }
      return acc;
    }, {});

    for (const level in groups) {
      if (levels[level]) {
        const group = groups[level];
        levels[level].count = group.questions.length;
        levels[level].questions = group.questions;
        levels[level].lastTaken = getLastAnsweredDate(group.questions);
        if (group.answered > 0) {
          levels[level].lastScore = {
            correct: group.correct,
            total: group.count,
          };
        }
      }
    }
    return levels;
  }, [quizData, t]);

  const easyQuestions = quizData?.filter(
    (question: any) => question.complexity_level === "easy"
  );
  const hardQuestions = quizData?.filter(
    (question: any) => question.complexity_level === "hard"
  );

  const progressEasy = (easyQuestions || [])?.filter(
    (q) => q.user_answer !== "" && q.user_answer === q.answer
  ).length;
  const progressHard = (hardQuestions || [])?.filter(
    (q) => q.user_answer !== "" && q.user_answer === q.answer
  ).length;

  const totalProgress =
    (progressEasy + progressHard) /
    ((easyQuestions?.length || 0) + (hardQuestions?.length || 0));
  const canProceedWithAdvancedQuiz = totalProgress >= 0.7;

  const handleLevelSelect = (level) => {
    const questionsForLevel = quizLevels[level]?.questions || [];
    if (questionsForLevel.length > 0) {
    posthog.capture('quiz_level_selected', { 
            note_id: noteId, 
            level: level,
            question_count: questionsForLevel.length 
          });
      setQuizLevel(level);
      setActiveQuestions(questionsForLevel);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setScore(0);
      setIsFinished(false);
      setShowFeedback(false);
    }
  };

  const handleBackToSelection = () => {
    setQuizLevel(null);
    queryClient.invalidateQueries({ queryKey: [`notes-${noteId}`] });
  }

  const totalQuestions = activeQuestions.length;
  const currentQuestion = activeQuestions[currentQuestionIndex];
  const correctAnswer =
    currentQuestion?.options[parseInt(currentQuestion?.answer)];
  const isCorrect = selectedAnswer === correctAnswer;
  const progressValue = (currentQuestionIndex / totalQuestions) * 100;

  const handleCheckAnswer = (option, index) => {
     posthog.capture('quiz_question_answered', { 
        note_id: noteId,
        level: quizLevel,
        question_index: currentQuestionIndex,
        is_correct: isCorrect 
      });
    setSelectedAnswer(option)
    if (option) {
      setShowFeedback(true);
      answerQuestionMutation.mutate({ questionId: currentQuestion?.id , answer: index})
      if (option === correctAnswer) {
        setScore(score + 1);
      }
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      posthog.capture('next_question_clicked', { userId, email });
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      
    } else {
        posthog.capture('quiz_completed', { 
        note_id: noteId,
        level: quizLevel,
        final_score: score + (selectedAnswer === correctAnswer ? 1 : 0), // Add 1 if last was correct
        total_questions: totalQuestions
      });
      setIsFinished(true);
    }
  };

  const handleRestartQuiz = () => {
    posthog.capture('quiz_restart_clicked', { userId, email });
    queryClient.invalidateQueries({ queryKey: [`notes-${noteId}`] });
    handleLevelSelect(quizLevel);
  }

  const answerQuestionMutation = useMutation({
    mutationFn: (data: { questionId: number; answer: number }) => {
      return axiosInstance.post(
        `${API_BASE_URL}/company/${companyId}/notes/${noteId}/questions/${data.questionId}/answer`,
        { answer: String(data.answer) }
      );
    },
    onSuccess: (response) => console.log("Answer submitted", response.data),
    onError: (error, variables) => {
      Sentry.captureException(error, { 
        tags: { action: 'submit_quiz_answer' },
        extra: { noteId, questionId: variables.questionId, userId, email }
      });
      console.error("Error submitting answer:", error.response?.data)
    }
  });

  if (!quizData || quizData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-muted/50 h-64">
        <h3 className="text-lg font-semibold text-muted-foreground">
          {t("No Quiz Available")}
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          {t("AI has not generated a quiz for this note yet.")}
        </p>
      </div>
    );
  }

 if (!quizLevel) {
    return (
      <div className="w-full max-w-full mx-auto flex flex-col gap-6">
        
        {/* Intro Alert */}
        <Alert className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border border-border/50 bg-zinc-50/50 dark:bg-zinc-900/50">
          <Avatar className="rounded-xl h-12 w-12 bg-black flex items-center justify-center shrink-0">
            <CatLogo />
          </Avatar>
          <div className="flex-1 flex flex-col justify-center">
            <AlertTitle className="text-sm font-bold tracking-tight mb-1">{t("Learning Experience!")}</AlertTitle>
            <AlertDescription className="text-xs text-muted-foreground leading-snug">
              {t("Our app boosts learning with personalized quiz alerts, analyzing performance to send reminders for challenging questions.")}
            </AlertDescription>
          </div>
        </Alert>

        {/* Level Cards List (Vertical Stack) */}
        <div className="flex flex-col gap-3">
          <LevelCard
            level="easy"
            title={t("Easy")}
            description={t("Quick questions to test core concepts.")}
            count={quizLevels.easy.count}
            lastScore={progressEasy}
            onSelect={handleLevelSelect}
            lastTakenDate={quizLevels.easy.lastTaken}
            isLocked={false}
          />
          <LevelCard
            level="hard"
            title={t("Hard")}
            description={t("In-depth questions requiring more thought.")}
            count={quizLevels.hard.count}
            lastScore={progressHard}
            onSelect={handleLevelSelect}
            lastTakenDate={quizLevels.hard.lastTaken}
            isLocked={false}
          />
          <LevelCard
            level="bonus"
            title={t("Advanced")}
            description={t("Challenging questions connecting multiple ideas.")}
            count={quizLevels.bonus.count}
            lastScore={0} 
            onSelect={handleLevelSelect}
            lastTakenDate={quizLevels.bonus.lastTaken}
            isLocked={!canProceedWithAdvancedQuiz}
          />
        </div>
      </div>
    );
  }

  if (isFinished) {
    const finalPercentage = Math.round((score / totalQuestions) * 100);
    return (
      <Card className="w-full max-w-2xl mx-auto text-center">
        <CardHeader>
          <CardTitle className="text-2xl">{t("Quiz Completed!")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-4xl font-bold">
            {score} / {totalQuestions}
          </p>
          <p className="text-2xl font-semibold text-primary">
            {finalPercentage}%
          </p>
            <GradientProgress value={finalPercentage} className="w-full" />
        </CardContent>
        <CardFooter className="flex-col sm:flex-row gap-2">
          <Button onClick={handleRestartQuiz} className="w-full sm:flex-1">
            <RotateCw className="h-4 w-4 mr-2" /> {t("Try Again")}
          </Button>
          <Button
            variant="ghost"
            onClick={handleBackToSelection}
            className="w-full sm:flex-1 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> {t("Change Difficulty")}
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex flex-row justify-between">
        <Button
          variant="outline"
          onClick={handleBackToSelection}
          className="self-start text-muted-foreground cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> {t("Change Difficulty")}
        </Button>
        {showFeedback ? (
        <div className="flex flex-col items-center gap-4">
          <Button onClick={handleNextQuestion} className="w-full sm:w-auto cursor-pointer">
            {currentQuestionIndex === totalQuestions - 1
              ? t("Finish Quiz")
              : t("Next")}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => handleCheckAnswer(selectedAnswer, currentQuestion.options.indexOf(selectedAnswer))}
          disabled={selectedAnswer === null}
          className="w-full sm:w-auto self-center"
        >
          {t("Check Answer")}
        </Button>
      )}

      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
          <span>
            {t("Question {{current}} of {{total}}", { current: currentQuestionIndex + 1, total: totalQuestions })}
          </span>
          <span>{t("Score: {{score}}", { score })}</span>
        </div>
        <GradientProgress value={progressValue} className="w-full" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl leading-relaxed">
            {currentQuestion.question_text}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isAnswerCorrect = correctAnswer === option;
            return (
              <button
                key={index}
                onClick={() => setSelectedAnswer(option)}
                disabled={showFeedback}
                className={cn(
                  "w-full text-left p-4 border rounded-lg transition-all text-sm font-medium",
                  "hover:bg-accent/50 disabled:cursor-not-allowed disabled:opacity-70",
                  isSelected && !showFeedback && "ring-2 ring-primary",
                  showFeedback &&
                    isAnswerCorrect &&
                    "bg-green-100 dark:bg-green-900/30 border-green-500 ring-2 ring-green-500 text-green-800 dark:text-green-300",
                  showFeedback &&
                    isSelected &&
                    !isAnswerCorrect &&
                    "bg-red-100 dark:bg-red-900/30 border-red-500 ring-2 ring-red-500 text-red-800 dark:text-red-300"
                )}
              >
                {option}
              </button>
            );
          })}
        </CardContent>
      </Card>
      {showFeedback && !isCorrect && (
        <Alert className="border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400">
          <Lightbulb />
          <AlertTitle>{t("Hint")}</AlertTitle>
          <AlertDescription className="text-amber-600/80 dark:text-amber-400/80">
            {currentQuestion.explanation}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}