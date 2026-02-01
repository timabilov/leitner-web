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

// --- Helper sub-component for the level selection cards ---
const LevelCard = ({
  level,
  title,
  description,
  count,
  lastScore,
  onSelect,
  lastTakenDate,
  isLocked,
}) => {
  const { t } = useTranslation(); // Initialize hook
  const isDisabled = count === 0 || isLocked;
  return (
    <Card
      className={cn(
        "text-center transition-all flex flex-col relative overflow-hidden",
        "bg-muted/50 dark:bg-muted/20 border-border",
        !isDisabled &&
          "hover:shadow-lg hover:border-primary/20 hover:-translate-y-1 cursor-pointer",
        isDisabled &&
          "bg-muted/30 dark:bg-muted/10 text-muted-foreground cursor-not-allowed"
      )}
      onClick={() => !isDisabled && onSelect(level)}
    >
      <CardHeader className="items-center">
        <div className="flex flex-row justify-between">
          {level === "easy" ? (
            <QuizPenIcon />
          ) : level === "hard" ? (
            <QuizHardPenIcon />
          ) : (
            <QuizBonusPenIcon />
          )}
          <div className="flex flex-row items-center">
              <Dot className="text-pink-500 -mr-3.5"/>
              <Dot className={" -mr-3.5 " + (level === "hard" || level === "bonus" ? "text-pink-500" :"text-pink-200")}/>
              <Dot className={level === "bonus" ? "text-pink-500" :"text-pink-200"}/>
          </div>
        </div>
        <CardTitle className="text-foreground">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        <p className="text-lg font-bold text-foreground/90">
          {t("{{count}} Questions", { count })}
        </p>
        {lastScore !== null ? (
          <div className="text-sm">
            <p className="font-semibold text-primary">
              {t("Last Score: {{score}}/{{count}}", { score: lastScore, count: count })}
            </p>
          </div>
        ) : (
          <p className="font-semibold text-primary">{t("(Not taken yet)")}</p>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground justify-center pb-4 pt-0">
        {isDisabled
          ? t("(No questions available)")
          : lastTakenDate
          ? t("Last taken: {{date}}", { date: lastTakenDate })
          : null}
      </CardFooter>
      {isLocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-muted/50 backdrop-blur-xs z-10">
          <GiftIcon className="h-10 w-10 text-primary mb-4" />
          <p className="font-semibold text-foreground">
            {t("Unlocks at 70% Quiz Completion")}
          </p>
        </div>
      )}
    </Card>
  );
};

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
      <div className="w-full max-w-4xl mx-auto">
        <div className="grid grid-cols-12 gap-8 mb-10">
          <div className="col-span-12">
            <Alert className="flex items-center justify-between">
              <Avatar className="rounded-sm bg-gray-950 flex items-center">
                <CatLogo />
              </Avatar>
              <div className="flex-1 flex-col justify-center gap-1">
                <AlertTitle className="flex-1">{t("Learning Experience!")}</AlertTitle>
                <AlertDescription>
                  {t("Our app boosts learning with personalized quiz alerts, analyzing performance to send reminders for challenging questions, tailoring your mastery of the material.")}
                </AlertDescription>
              </div>
              <CircleAlert />
            </Alert>
          </div>
        </div>
        <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-6">
          <LevelCard
            level="easy"
            title={t("Easy")}
            description={t("Quick questions to test core concepts.")}
            count={quizLevels.easy.count}
            lastScore={progressEasy}
            onSelect={handleLevelSelect}
            lastTakenDate={quizLevels.easy.lastTaken}
          />
          <LevelCard
            level="hard"
            title={t("Hard")}
            description={t("In-depth questions requiring more thought.")}
            count={quizLevels.hard.count}
            lastScore={progressHard}
            onSelect={handleLevelSelect}
            lastTakenDate={quizLevels.hard.lastTaken}
          />
          <LevelCard
            level="bonus"
            title={t("Advanced")}
            description={t("Challenging questions that connect multiple ideas.")}
            count={quizLevels.bonus.count}
            lastScore={0} // Bonus score not tracked this way
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