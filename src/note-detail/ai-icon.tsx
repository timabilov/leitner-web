import { useId } from "react";
import { cn } from "@/lib/utils";

interface AIIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  useBrandGradient?: boolean;
  hideStar?: boolean;
}

const AIIcon = ({ 
  size = 16, 
  className, 
  useBrandGradient = true, 
  hideStar = false,
  ...props 
}: AIIconProps) => {
  const id = useId();

  // Brand Colors (#FE5E5F -> #C04796)
  const brandStart = "#FE5E5F";
  const brandEnd = "#C04796";

  // Original Icon Colors
  const originalStart = "#E8759C";
  const originalEnd = "#8BA8DB";

  const startColor = useBrandGradient ? brandStart : originalStart;
  const endColor = useBrandGradient ? brandEnd : originalEnd;

  // Split path data for the second path:
  // Part 1: The outline of the main star
  const mainStarPath = "M7.917 3.833C8.087 3.833 8.242 3.938 8.304 4.097L9.416 6.917L12.236 8.029C12.3136 8.05984 12.3801 8.11327 12.427 8.18235C12.4739 8.25144 12.4989 8.33301 12.4989 8.4165C12.4989 8.49999 12.4739 8.58156 12.427 8.65065C12.3801 8.71973 12.3136 8.77316 12.236 8.804L9.416 9.916L8.304 12.736C8.27316 12.8136 8.21973 12.8801 8.15065 12.927C8.08156 12.9739 7.99999 12.9989 7.9165 12.9989C7.83301 12.9989 7.75144 12.9739 7.68235 12.927C7.61327 12.8801 7.55984 12.8136 7.529 12.736L6.417 9.916L3.597 8.804C3.51942 8.77316 3.45288 8.71973 3.406 8.65065C3.35912 8.58156 3.33405 8.49999 3.33405 8.4165C3.33405 8.33301 3.35912 8.25144 3.406 8.18235C3.45288 8.11327 3.51942 8.05984 3.597 8.029L6.417 6.917L7.529 4.097C7.56005 4.01938 7.61357 3.95278 7.68269 3.90575C7.75181 3.85872 7.8334 3.83339 7.917 3.833ZM7.917 5.386L7.126 7.39C7.10488 7.4431 7.07314 7.49133 7.03273 7.53173C6.99233 7.57214 6.9441 7.60388 6.891 7.625L4.886 8.415L6.891 9.207C6.944 9.22801 6.99217 9.25959 7.03257 9.29982C7.07298 9.34005 7.10476 9.38809 7.126 9.441L7.916 11.447L8.708 9.441C8.72912 9.38818 8.76076 9.34021 8.80098 9.29998C8.84121 9.25976 8.88918 9.22812 8.942 9.207L10.948 8.416L8.942 7.625C8.88909 7.60376 8.84105 7.57198 8.80082 7.53157C8.76059 7.49117 8.72901 7.443 8.708 7.39L7.917 5.386Z";

  // Part 2: The little floating star (Top Left)
  const littleStarPath = "M4.167 3L4.697 4.136L5.833 4.666L4.697 5.197L4.167 6.333L3.637 5.197L2.5 4.667L3.636 4.137L4.167 3Z";

  // When hiding the little star, we adjust the viewBox to "zoom in" on the big star
  // The big star bounds are roughly x:3.3-12.5 and y:3.8-13
  // "3 3.5 10 10" centers this perfectly.
  const activeViewBox = hideStar ? "3 3.5 10 10" : "0 0 14 14";

  return (
    <svg
      // Size prop sets the default attributes
      width={size}
      height={size}
      viewBox={activeViewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      // Tailwind classes like w-10 will override the width attribute above
      className={cn("shrink-0 transition-all", className)}
      {...props}
    >
      <path
        d="M7.917 4.25L9.095 7.238L12.083 8.417L9.095 9.595L7.917 12.583L6.738 9.595L3.75 8.417L6.738 7.238L7.917 4.25Z"
        fill={`url(#${id}-g1)`}
      />
      <path
        d={hideStar ? mainStarPath : mainStarPath + littleStarPath}
        fill={`url(#${id}-g2)`}
      />
      <defs>
        <linearGradient
          id={`${id}-g1`}
          x1="7.9165"
          y1="4.25"
          x2="7.9165"
          y2="12.583"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={startColor} />
          <stop offset="1" stopColor={endColor} />
        </linearGradient>
        <linearGradient
          id={`${id}-g2`}
          x1="7.49947"
          y1="3"
          x2="7.49947"
          y2="12.9989"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={startColor} />
          <stop offset="1" stopColor={endColor} />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default AIIcon;