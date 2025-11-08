import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

/**
 * A custom Progress component with an animated gradient fill.
 */
const GradientProgress = React.forwardRef(({ className, value, ...props }, ref) => (
  // 1. The main container (the "track")
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
    {...props}
  >
    {/* 2. The indicator, which clips the animated gradient */}
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all relative overflow-hidden rounded-2xl"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    >
      {/* 3. The animated gradient itself */}
      {/*    It's a very wide element that sits inside the Indicator. */}
      {/*    The `animate-progress-indeterminate` makes it slide back and forth. */}
      <div 
        className="absolute top-0 left-0 bottom-0 w-[200%] h-full animate-progress-indeterminate rounded-xs"
        style={{
          backgroundImage: 'linear-gradient(to right, #FE5E5F, #C04796, #FE5E5F)',
        }}
      />
    </ProgressPrimitive.Indicator>
  </ProgressPrimitive.Root>
));
GradientProgress.displayName = ProgressPrimitive.Root.displayName;

export { GradientProgress };