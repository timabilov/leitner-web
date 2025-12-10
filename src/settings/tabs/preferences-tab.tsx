import { useTranslation } from "react-i18next";
import { SettingsItem } from "../settings-item"; // Naming convention used
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ISO_TO_LANGUAGE } from "@/services/config";
import { useTheme } from "@/components/theme-provider"; // ✅ Import the hook

const PreferencesTab = () => {
    const { t, i18n } = useTranslation();
    const { setTheme, theme } = useTheme(); // ✅ Destructure

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div>
                <h3 className="text-2xl font-semibold tracking-tight">{t("Preferences")}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {t("Customize experience")}
                </p>
            </div>
            
            <div className="flex flex-col">
                <Separator />
                
                {/* Language Selector */}
                <SettingsItem 
                    label={t("Language")}
                    action={
                        <Select value={i18n.language} onValueChange={(val) => i18n.changeLanguage(val)}>
                            <SelectTrigger className="w-[140px] h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(ISO_TO_LANGUAGE).map(([iso, data]) => (
                                    <SelectItem key={iso} value={iso}>
                                        {data.flag} {data.language}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    }
                />

                <Separator />

                {/* Theme Selector */}
                <SettingsItem 
                    label={t("Theme")}
                    action={
                        <Select value={theme} onValueChange={(val: any) => setTheme(val)}>
                            <SelectTrigger className="w-[140px] h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="light">{t("Light")}</SelectItem>
                                <SelectItem value="dark">{t("Dark")}</SelectItem>
                                <SelectItem value="system">{t("System")}</SelectItem>
                            </SelectContent>
                        </Select>
                    }
                />
            </div>
        </div>
    );
};

export default PreferencesTab;