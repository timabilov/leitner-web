import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCw,
  ArrowLeft,
  BrainCircuit,
  Star,
  Zap,
  Info,
  CircleAlert,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { axiosInstance } from "@/services/auth";
import { API_BASE_URL } from "@/services/config";
import { useUserStore } from "@/store/userStore";
import QuizPenIcon from "./quiz-pen-icon";
import QuizHardPenIcon from "./QuizHardPenIcon";
import QuizBonusPenIcon from "./QuizBonusPenIcon";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import CatLogo from "./cat-logo";
import GiftIcon from "./GiftIcon";
import {GradientProgress}  from '@/components/gradient-progress'
// --- Helper sub-component for the level selection cards ---
const LevelCard = ({
  level,
  title,
  description,
  icon,
  count,
  lastScore,
  onSelect,
  lastTakenDate,
  isLocked,
}) => {
  const isDisabled = count === 0 || isLocked;
  return (
    <Card
      className={cn(
        "text-center transition-all flex flex-col relative overflow-hidden",
        // --- THIS IS THE MAIN STYLE CHANGE ---
        "bg-muted/50 dark:bg-muted/20 border-border", // Use a muted background color
        !isDisabled &&
          "hover:shadow-lg hover:border-primary/20 hover:-translate-y-1 cursor-pointer",
        isDisabled &&
          "bg-muted/30 dark:bg-muted/10 text-muted-foreground cursor-not-allowed"
      )}
      onClick={() => !isDisabled && onSelect(level)}
    >
      <CardHeader className="items-center">
        {level === "easy" ? (
          <QuizPenIcon />
        ) : level === "hard" ? (
          <QuizHardPenIcon />
        ) : (
          <QuizBonusPenIcon />
        )}

        {/* Use a brighter text color for better contrast on the darker background */}
        <CardTitle className="text-foreground">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        <p className="text-lg font-bold text-foreground/90">
          {count} Questions
        </p>

        {lastScore !== null ? (
          <div className="text-sm">
            <p className="font-semibold text-primary">
              {`Last Score: ${lastScore.correct}/${count}`}
            </p>
          </div>
        ) : (
          <p className="font-semibold text-primary">(Not taken yet)</p>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground justify-center pb-4 pt-0">
        {isDisabled
          ? "(No questions available)"
          : lastTakenDate
          ? `Last taken: ${lastTakenDate}`
          : null}
      </CardFooter>
      {isLocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-muted/50 backdrop-blur-xs z-10">
          <GiftIcon className="h-10 w-10 text-primary mb-4" />
          <p className="font-semibold text-foreground">
            Unlocks at 70% Quiz Completion
          </p>
        </div>
      )}
    </Card>
  );
};

/**
 * A component for an interactive quiz with difficulty levels and last score display.
 * @param {object} props
 * @param {Array<{question_text: string, options: string[], answer: string, complexity_level: string, user_answer: string}>} [props.quizData]
 */
export function AIQuizTab({ quizData, noteId }) {
  const { companyId, userId } = useUserStore();

  const [quizLevel, setQuizLevel] = useState(null);
  const [activeQuestions, setActiveQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const quizLevels = useMemo(() => {
    const levels = {
      easy: { count: 0, lastScore: null, questions: [] },
      hard: { count: 0, lastScore: null, questions: [] },
      bonus: { count: 0, lastScore: null, questions: [] },
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
        if (group.answered > 0) {
          levels[level].lastScore = {
            correct: group.correct,
            total: group.count,
          };
        }
      }
    }
    return levels;
  }, [quizData]);

  const easyQuestions = quizData?.filter(
    (question: any) => question.complexity_level === "easy"
  );
  const hardQuestions = quizData?.filter(
    (question: any) => question.complexity_level === "hard"
  );

  const progressEasy = (easyQuestions || [])?.filter(
    (q) => q.user_answer != "" && q.user_answer == q.answer
  ).length;
  const progressHard = (hardQuestions || [])?.filter(
    (q) => q.user_answer != "" && q.user_answer == q.answer
  ).length;

  const totalProgress =
    (progressEasy + progressHard) /
    (easyQuestions.length + hardQuestions.length);
  const canProceedWithAdvancedQuiz = totalProgress >= 0.7;
  console.log("canProceedWithAdvancedQuiz", canProceedWithAdvancedQuiz);

  const answerQuestionMutation = useMutation({
    mutationFn: (data: { questionId: number; answer: number }) => {
      return axiosInstance.post(
        `${API_BASE_URL}/company/${companyId}/notes/${noteId}/questions/${data.questionId}/answer`,
        { answer: data.answer + "" }
      );
    },
    onSuccess: (response) => {
      console.log("Answer submitted successfully:", response.data);
    },
    onError: (error) => {
      // Sentry.captureException(error, { extra: { companyId, userId } });
      console.error("Error submitting answer:", error.response?.data);
    },
  });

  const handleLevelSelect = (level) => {
    const questionsForLevel = quizLevels[level]?.questions || [];
    if (questionsForLevel.length > 0) {
      setQuizLevel(level);
      setActiveQuestions(questionsForLevel);
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setScore(0);
      setIsFinished(false);
      setShowFeedback(false);
    }
  };

  const getLastAnsweredDate = (questions: any[]) => {
    const answeredDates = questions
      .filter((q: any) => q.user_answered_date)
      .map((q: any) => new Date(q.user_answered_date));
    return answeredDates.length > 0
      ? new Date(Math.max(...answeredDates)).toLocaleDateString()
      : "Not taken";
  };

  const handleBackToSelection = () => setQuizLevel(null);

  if (!quizData || quizData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-muted/50 h-64">
        <h3 className="text-lg font-semibold text-muted-foreground">
          No Quiz Available
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          AI has not generated a quiz for this note yet.
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
              <Avatar className="rounded-sm bg-zinc-300 flex items-center">
                <CatLogo />
              </Avatar>
              <div className="flex-1 flex-col justify-center gap-1">
                <AlertTitle className="flex-1">Learning Experience!</AlertTitle>
                <AlertDescription>
                  {" "}
                  Our app boosts learning with personalized quiz alerts,
                  analyzing performance to send reminders for challenging
                  questions, tailoring your mastery of the material.
                </AlertDescription>
              </div>
              <CircleAlert />
            </Alert>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <LevelCard
            level="easy"
            title="Easy"
            description="Quick questions to test core concepts."
            icon={<Star className="h-8 w-8 text-green-500" />}
            count={quizLevels.easy.count}
            lastScore={quizLevels.easy.lastScore}
            onSelect={handleLevelSelect}
            lastTakenDate={getLastAnsweredDate(activeQuestions)}
          />
          <LevelCard
            level="hard"
            title="Hard"
            description="In-depth questions requiring more thought."
            icon={<BrainCircuit className="h-8 w-8 text-orange-500" />}
            count={quizLevels.hard.count}
            lastScore={quizLevels.hard.lastScore}
            onSelect={handleLevelSelect}
            lastTakenDate={getLastAnsweredDate(activeQuestions)}
          />
          <LevelCard
            level="bonus"
            title="Advanced"
            description="Challenging questions that connect multiple ideas."
            icon={<Zap className="h-8 w-8 text-red-500" />}
            count={quizLevels.bonus.count}
            lastScore={quizLevels.bonus.lastScore}
            onSelect={handleLevelSelect}
            lastTakenDate={getLastAnsweredDate(activeQuestions)}
            isLocked={!canProceedWithAdvancedQuiz}
          />
        </div>
      </div>
    );
  }

  const totalQuestions = activeQuestions.length;
  const currentQuestion = activeQuestions[currentQuestionIndex];
  const correctAnswer =
    currentQuestion.options[parseInt(currentQuestion.answer)];
  const isCorrect = selectedAnswer === correctAnswer;
  const progressValue = (currentQuestionIndex / totalQuestions) * 100;

  const handleAnswerSelect = (option) => {
    if (!showFeedback) setSelectedAnswer(option);
  };
  const handleCheckAnswer = () => {
    if (selectedAnswer) {
      setShowFeedback(true);
      if (isCorrect) setScore(score + 1);
    }
  };
  const handleNextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      setIsFinished(true);
    }
  };
  const handleRestartQuiz = () => handleLevelSelect(quizLevel);

  if (isFinished) {
    const finalPercentage = Math.round((score / totalQuestions) * 100);
    return (
      <Card className="w-full max-w-2xl mx-auto text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Quiz Completed!</CardTitle>
          {/* <CardDescription>Here's how you did.</CardDescription> */}
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-4xl font-bold">
            {score} / {totalQuestions}
          </p>
          <p className="text-2xl font-semibold text-primary">
            {finalPercentage}%
          </p>
            <GradientProgress value={finalPercentage} className="w-full" />
          {/* <Progress value={finalPercentage} className="w-full bg-" /> */}
        </CardContent>
        <CardFooter className="flex-col sm:flex-row gap-2">
          <Button onClick={handleRestartQuiz} className="w-full sm:flex-1">
            <RotateCw className="h-4 w-4 mr-2" /> Try Again
          </Button>
          <Button
            variant="ghost"
            onClick={handleBackToSelection}
            className="w-full sm:flex-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Change Difficulty
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
      <Button
        variant="ghost"
        onClick={handleBackToSelection}
        className="self-start text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-2" /> Change Difficulty
      </Button>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
          <span>
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
          <span>Score: {score}</span>
        </div>
        <Progress value={progressValue} />
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
                onClick={() => handleAnswerSelect(option)}
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
      {showFeedback ? (
        <div className="flex flex-col items-center gap-4">
          {!isCorrect ? (
            <Alert className="border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400">
              <Lightbulb />
              <AlertTitle>Hint</AlertTitle>
              <AlertDescription className="text-amber-600/80 dark:text-amber-400/80">
                {`Hint ${currentQuestion.explanation}`}
              </AlertDescription>
            </Alert>
          ) : null}
          <Button onClick={handleNextQuestion} className="w-full sm:w-auto">
            {currentQuestionIndex === totalQuestions - 1
              ? "Finish Quiz"
              : "Next"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      ) : (
        <Button
          onClick={handleCheckAnswer}
          disabled={selectedAnswer === null}
          className="w-full sm:w-auto self-center"
        >
          Check Answer
        </Button>
      )}
    </div>
  );
}
