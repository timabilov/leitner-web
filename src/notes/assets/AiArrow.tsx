import { cn } from "@/lib/utils";

interface AIArrowProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number;
  useGradient?: boolean;
  className?: string;
}

const AIArrow = ({
  size = 32,
  strokeWidth = 3,
  useGradient = true,
  className,
  ...props
}: AIArrowProps) => {
  // Unique ID to prevent gradient collisions in the DOM
  const gradientId = "ai-arrow-gradient";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("transition-all duration-300", className)}
      {...props}
    >
      <path
        d="M6.66699 16.0003L16.0003 5M16.0003 5L25.3337 16.0003M16.0003 5V15.1668V25.3337"
        // If useGradient is true, use the defined ID, otherwise use the parent's text color
        stroke={useGradient ? `url(#${gradientId})` : "currentColor"}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {useGradient && (
        <defs>
          <linearGradient
            id={gradientId}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
            gradientUnits="userSpaceOnUse"
          >
            {/* Using your Brand Colors: #FE5E5F to #C04796 */}
            <stop stopColor="#FE5E5F" />
            <stop offset="1" stopColor="#C04796" />
          </linearGradient>
        </defs>
      )}
    </svg>
  );
};

export default AIArrow;