import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsItemProps {
  label: string;
  value?: React.ReactNode;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}

export const SettingsItem = ({ 
  label, 
  value, 
  icon: Icon, 
  action, 
  className 
}: SettingsItemProps) => (
  <div className={cn("flex items-center justify-between py-4", className)}>
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
        {Icon && <Icon className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />}
        {label}
      </span>
    </div>
    <div className="flex items-center gap-3">
      {/* Value text: Dark Gray in Light mode, Light Gray in Dark mode */}
      {value && <span className="text-sm text-zinc-600 dark:text-zinc-400">{value}</span>}
      {action}
    </div>
  </div>
);