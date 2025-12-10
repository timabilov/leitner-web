// import { LucideIcon } from "lucide-react";

interface SettingsItemProps {
  label: string;
  value?: React.ReactNode;
  icon?: any; // Stronger typing
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
  <div className={`flex items-center justify-between py-4 ${className}`}>
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-neutral-900 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-neutral-400" />}
        {label}
      </span>
    </div>
    <div className="flex items-center gap-3">
      {value && <span className="text-sm text-neutral-600">{value}</span>}
      {action}
    </div>
  </div>
);