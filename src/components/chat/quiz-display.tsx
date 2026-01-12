import React, { useState } from "react";
import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// --- Types matching your Backend Strict Structure ---
export interface QuizOption {
  question: string;
  answer: number; // Index of correct answer
  explanation: string;
  options: string[];
}

export interface QuizData {
  chat_questions: QuizOption[];
}

interface QuizDisplayProps {
  data: QuizData;
}

const QuizItem = ({ item, index }: { item: QuizOption; index: number }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSelect = (idx: number) => {
    if (isSubmitted) return;
    setSelected(idx);
    setIsSubmitted(true);
  };

  const isCorrect = selected === item.answer;

  return (
    <Card className="mb-4 border-muted-foreground/20 overflow-hidden">
      <div className="bg-muted/50 px-4 py-2 border-b flex items-center gap-2">
        <Badge variant="outline" className="h-5 text-[10px]">Q{index + 1}</Badge>
        <span className="text-xs font-medium text-muted-foreground">Single Choice</span>
      </div>
      <CardContent className="pt-4">
        <h4 className="font-semibold text-sm mb-4 leading-relaxed text-foreground">
          {item.question}
        </h4>

        <div className="space-y-2">
          {item.options.map((opt, idx) => {
            // Determine styling based on state
            let variantClass = "hover:bg-accent hover:text-accent-foreground";
            let icon = null;

            if (isSubmitted) {
              if (idx === item.answer) {
                variantClass = "bg-green-100 text-green-900 border-green-200 dark:bg-green-900/30 dark:text-green-100 dark:border-green-800";
                icon = <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />;
              } else if (idx === selected) {
                variantClass = "bg-red-100 text-red-900 border-red-200 dark:bg-red-900/30 dark:text-red-100 dark:border-red-800";
                icon = <XCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />;
              } else {
                variantClass = "opacity-50";
              }
            } else if (selected === idx) {
               variantClass = "bg-primary text-primary-foreground";
            }

            return (
              <Button
                key={idx}
                variant="outline"
                onClick={() => handleSelect(idx)}
                className={cn(
                  "w-full justify-between h-auto py-3 px-4 text-left whitespace-normal font-normal transition-all",
                  variantClass
                )}
                disabled={isSubmitted}
              >
                <span className="flex-1 text-sm">{opt}</span>
                {icon}
              </Button>
            );
          })}
        </div>

        {isSubmitted && (
          <div className={cn(
            "mt-4 p-3 rounded-lg text-sm flex gap-3 items-start",
            isCorrect ? "bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-200" : "bg-blue-50 text-blue-800 dark:bg-blue-950/30 dark:text-blue-200"
          )}>
            <HelpCircle className="h-4 w-4 shrink-0 mt-0.5 opacity-70" />
            <div>
              <p className="font-semibold text-xs mb-1 uppercase tracking-wider opacity-80">Explanation</p>
              <p className="leading-relaxed opacity-90">{item.explanation}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const QuizDisplay = ({ data }: QuizDisplayProps) => {
  if (!data || !data.chat_questions || data.chat_questions.length === 0) {
    return <div className="text-sm text-red-500">Error: Invalid Quiz Data</div>;
  }

  return (
    <div className="w-full max-w-[95%] mt-2">
      {data.chat_questions.map((q, i) => (
        <QuizItem key={i} item={q} index={i} />
      ))}
    </div>
  );
};