"use client";

import { GradientProgress } from "@/components/gradient-progress";
import { ExternalLink, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import Lottie from "lottie-react";
import successAnimation from './assets/done.json';
import sadCat from './assets/sad-cat.jpeg';

interface NoteCreationToastProps {
  step: string;
  progress: number;
  status: "loading" | "success" | "error";
  noteId?: string | number;
  name?: string | null
  onClick?: () => void;
}

export function NoteCreationToast({ step, progress, status, name, onClick }: NoteCreationToastProps) {
  return (
    <div 
      className={cn(
        // Layout & Size (Standard Sonner Width)
        "pointer-events-auto relative flex md:w-[356px] flex-col gap-3 overflow-hidden w-full",
        // Visuals (Shadcn Toast Styles)
        "rounded-xl border bg-background p-4 shadow-lg transition-all",
        // Conditional Border Color
        "border-border"
      )}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 overflow-hidden w-full">
          
          {/* Icon Wrapper */}
          <div className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border shadow-sm",
            status === "loading" && "bg-secondary text-secondary-foreground",
            // Remove bg color for success so Lottie shows clearly on white/dark
            // status === "success" && "border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-900", 
            status === "error" && "bg-destructive/10 text-destructive border-destructive/20"
          )}>
            {status === "loading" && (
              <Loader2 className="h-5 w-5 animate-spin" />
            )}
            
            {/* ✅ LOTTIE ANIMATION FOR SUCCESS */}
            {status === "success" && (
              <div className="w-[180%] h-[180%] flex items-center justify-center">
                 <Lottie 
                    animationData={successAnimation} 
                    loop={false} 
                    autoplay={true}
                 />
              </div>
            )}

            {status === "error" && (
              <img src={sadCat} />
              // <XCircle className="h-5 w-5" />
            )}
          </div>

          {/* Text Content */}
          <div className="flex flex-col gap-1 overflow-hidden w-full">
            <span onClick={onClick} className={`w-full text-sm font-semibold leading-none tracking-tight ${status === "success" ? "underline cursor-pointer" : ""}`}>
              {status === "success" ? <div className=" w-full flex justify-between items-center">{`Analyzing ${name}`}  <ExternalLink className="w-3 h-3 ml-2" /> </div> : status === "error" ? "Error" : "Creating Note"}
            </span>
            <span className="text-xs text-muted-foreground truncate">
              {step}
            </span>
          </div>
        </div>

        {/* Percentage Badge */}
        {status === "loading" && (
            <div className="flex h-6 min-w-[2.5rem] items-center justify-center rounded-md bg-secondary px-1.5 text-[10px] font-mono font-medium text-secondary-foreground">
            {Math.round(progress)}%
            </div>
        )}
      </div>

      {/* Progress Bar Row */}
      {/* Added padding-left to align visually with the text start, not the icon */}
      <div className="w-full pl-[52px]"> 
        <GradientProgress 
          value={progress} 
          className="h-1.5" 
        />
      </div>
    </div>
  );
}

// --- YOUR LOTTIE JSON DATA ---
const successAnimationData = {
  "v": "5.9.0",
  "fr": 29.9700012207031,
  "ip": 0,
  "op": 90.0000036657751,
  "w": 512,
  "h": 512,
  "nm": "Comp 1",
  "ddd": 0,
  "assets": [],
  "layers": [
    {
      "ddd": 0,
      "ind": 1,
      "ty": 4,
      "nm": "Layer 1/hh Outlines",
      "sr": 1,
      "ks": {
        "o": { "a": 1, "k": [{ "i": { "x": [0.833], "y": [0.833] }, "o": { "x": [0.167], "y": [0.167] }, "t": 7, "s": [1] }, { "i": { "x": [0.833], "y": [0.833] }, "o": { "x": [0.167], "y": [0.167] }, "t": 11, "s": [100] }, { "t": 22.0000008960784, "s": [100] }], "ix": 11 },
        "r": { "a": 1, "k": [{ "i": { "x": [0.833], "y": [0.833] }, "o": { "x": [0.167], "y": [0.167] }, "t": 7, "s": [0] }, { "i": { "x": [0.833], "y": [0.833] }, "o": { "x": [0.167], "y": [0.167] }, "t": 11, "s": [-7] }, { "t": 22.0000008960784, "s": [0] }], "ix": 10 },
        "p": { "a": 0, "k": [256.169, 256.169, 0], "ix": 2, "l": 2 },
        "a": { "a": 0, "k": [1763.5, 1732, 0], "ix": 1, "l": 2 },
        "s": { "a": 1, "k": [{ "i": { "x": [0.833, 0.833, 0.833], "y": [0.833, 0.833, 0.833] }, "o": { "x": [0.167, 0.167, 0.167], "y": [0.167, 0.167, 0.167] }, "t": 7, "s": [31, 31, 100] }, { "i": { "x": [0.833, 0.833, 0.833], "y": [0.833, 0.833, 0.833] }, "o": { "x": [0.167, 0.167, 0.167], "y": [0.167, 0.167, 0.167] }, "t": 11, "s": [50, 50, 100] }, { "t": 22.0000008960784, "s": [31, 31, 100] }], "ix": 6, "l": 2 }
      },
      "ao": 0,
      "shapes": [{
        "ty": "gr",
        "it": [{
          "ind": 0,
          "ty": "sh",
          "ix": 1,
          "ks": { "a": 0, "k": { "i": [[0, 0], [0, 0], [0, 0]], "o": [[0, 0], [0, 0], [0, 0]], "v": [[-96.5, 1.833], [-33.433, 65], [96.5, -65]], "c": false }, "ix": 2 },
          "nm": "Path 1",
          "mn": "ADBE Vector Shape - Group",
          "hd": false
        }, {
          "ty": "st",
          "c": { "a": 0, "k": [1, 1, 1, 1], "ix": 3 },
          "o": { "a": 0, "k": 100, "ix": 4 },
          "w": { "a": 0, "k": 39, "ix": 5 },
          "lc": 2,
          "lj": 2,
          "bm": 0,
          "nm": "Stroke 1",
          "mn": "ADBE Vector Graphic - Stroke",
          "hd": false
        }, {
          "ty": "tr",
          "p": { "a": 0, "k": [1763.162, 1731.663], "ix": 2 },
          "a": { "a": 0, "k": [0, 0], "ix": 1 },
          "s": { "a": 0, "k": [100, 100], "ix": 3 },
          "r": { "a": 0, "k": 0, "ix": 6 },
          "o": { "a": 0, "k": 100, "ix": 7 },
          "sk": { "a": 0, "k": 0, "ix": 4 },
          "sa": { "a": 0, "k": 0, "ix": 5 },
          "nm": "Transform"
        }],
        "nm": "Group 1",
        "np": 2,
        "cix": 2,
        "bm": 0,
        "ix": 1,
        "mn": "ADBE Vector Group",
        "hd": false
      }],
      "ip": 0,
      "op": 899.000036617021,
      "st": 0,
      "bm": 0
    },
    {
      "ddd": 0,
      "ind": 2,
      "ty": 4,
      "nm": "Round holder",
      "sr": 1,
      "ks": {
        "o": { "a": 1, "k": [{ "i": { "x": [0.833], "y": [0.833] }, "o": { "x": [0.167], "y": [0.167] }, "t": 0, "s": [0] }, { "t": 3.00000012219251, "s": [100] }], "ix": 11 },
        "r": { "a": 0, "k": 0, "ix": 10 },
        "p": { "a": 0, "k": [248.922, 253.922, 0], "ix": 2, "l": 2 },
        "a": { "a": 0, "k": [0, 0, 0], "ix": 1, "l": 2 },
        "s": { "a": 1, "k": [{ "i": { "x": [0.833, 0.833, 0.833], "y": [0.833, 0.833, 0.833] }, "o": { "x": [0.167, 0.167, 0.167], "y": [0.167, 0.167, 0.167] }, "t": 3, "s": [2, 2, 100] }, { "i": { "x": [0.833, 0.833, 0.833], "y": [0.833, 0.833, 0.833] }, "o": { "x": [0.167, 0.167, 0.167], "y": [0.167, 0.167, 0.167] }, "t": 14, "s": [149.8, 149.8, 100] }, { "t": 27.0000010997325, "s": [100, 100, 100] }], "ix": 6, "l": 2 }
      },
      "ao": 0,
      "shapes": [{
        "ty": "gr",
        "it": [{
          "d": 1,
          "ty": "el",
          "s": { "a": 0, "k": [154.156, 154.156], "ix": 2 },
          "p": { "a": 0, "k": [0, 0], "ix": 3 },
          "nm": "Ellipse Path 1",
          "mn": "ADBE Vector Shape - Ellipse",
          "hd": false
        }, {
          "ty": "st",
          "c": { "a": 0, "k": [0, 0, 0, 1], "ix": 3 },
          "o": { "a": 0, "k": 100, "ix": 4 },
          "w": { "a": 0, "k": 0, "ix": 5 },
          "lc": 1,
          "lj": 1,
          "ml": 4,
          "bm": 0,
          "nm": "Stroke 1",
          "mn": "ADBE Vector Graphic - Stroke",
          "hd": false
        }, {
          "ty": "fl",
          "c": { "a": 0, "k": [0.000563061471, 0.00871629902, 0.004089636896, 1], "ix": 4 },
          "o": { "a": 0, "k": 100, "ix": 5 },
          "r": 1,
          "bm": 0,
          "nm": "Fill 1",
          "mn": "ADBE Vector Graphic - Fill",
          "hd": false
        }, {
          "ty": "tr",
          "p": { "a": 0, "k": [7.078, 2.078], "ix": 2 },
          "a": { "a": 0, "k": [0, 0], "ix": 1 },
          "s": { "a": 0, "k": [100, 100], "ix": 3 },
          "r": { "a": 0, "k": 0, "ix": 6 },
          "o": { "a": 0, "k": 100, "ix": 7 },
          "sk": { "a": 0, "k": 0, "ix": 4 },
          "sa": { "a": 0, "k": 0, "ix": 5 },
          "nm": "Transform"
        }],
        "nm": "Ellipse 1",
        "np": 3,
        "cix": 2,
        "bm": 0,
        "ix": 1,
        "mn": "ADBE Vector Group",
        "hd": false
      }],
      "ip": 0,
      "op": 899.000036617021,
      "st": 0,
      "bm": 0
    }
  ]
};