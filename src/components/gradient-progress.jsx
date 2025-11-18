
import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

/**
 * A custom Progress component with a shimmering, animated gradient fill.
 * @param {object} props
 * @param {string} [props.className] - Optional classes for the root container.
 * @param {number} [props.value] - The progress value (0-100).
 */
const GradientProgress = React.forwardRef(({ className, value, ...props }, ref) => {
  return (
    // 1. The Root/Track: This is the outer container. `overflow-hidden` is key.
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      {/* 
        2. The Indicator/Fill: This element's transform is controlled by the `value`.
           `transition-all` makes the fill animate smoothly.
           `overflow-hidden` is CRITICAL to clip the shimmering gradient.
      */}
      <ProgressPrimitive.Indicator
        className="
          h-full w-full flex-1 
          transition-transform duration-500 ease-out 
          bg-[length:200%_auto] /* Make the background twice as wide */
          animate-shimmer      /* Apply our new shimmer animation */
        "
        style={{ 
          transform: `translateX(-${100 - (value || 0)}%)`,
          // The gradient is now the background of the indicator itself.
          backgroundImage: 'linear-gradient(to right, #FE5E5F, #C04796, #FE5E5F)',
        }}
      />
    </ProgressPrimitive.Root>
  );
});
GradientProgress.displayName = ProgressPrimitive.Root.displayName;

export { GradientProgress };