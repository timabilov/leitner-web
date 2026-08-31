import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

const CatPenSvg = ({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) => {
  const { theme } = useTheme();
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <img
      src={isDark ? "/catpendark.svg" : "/catpenlight.svg"}
      width={size}
      height={size}
      alt="Bycat"
      className={cn("transition-all duration-300", className)}
    />
  );
};

export default CatPenSvg;
