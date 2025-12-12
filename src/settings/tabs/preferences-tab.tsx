import { useTranslation } from "react-i18next";
import { SettingsItem } from "../settings-item"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ISO_TO_LANGUAGE } from "@/services/config";
import { useTheme } from "@/components/theme-provider";

const PreferencesTab = () => {
    const { t, i18n } = useTranslation();
    const { setTheme, theme } = useTheme();

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div>
                <h3 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {t("Preferences")}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {t("Customize experience")}
                </p>
            </div>
            
            <div className="flex flex-col">
                <Separator className="bg-zinc-200 dark:bg-zinc-800" />
                
                <SettingsItem 
                    label={t("Language")}
                    action={
                        <Select value={i18n.language} onValueChange={(val) => i18n.changeLanguage(val)}>
                            <SelectTrigger className="w-[140px] h-8 text-xs border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-zinc-950 dark:border-zinc-800">
                                {Object.entries(ISO_TO_LANGUAGE).map(([iso, data]) => (
                                    <SelectItem key={iso} value={iso}>
                                        {data.flag} {data.language}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    }
                />

                <Separator className="bg-zinc-200 dark:bg-zinc-800" />

                <SettingsItem 
                    label={t("Theme")}
                    action={
                        <Select value={theme} onValueChange={(val: any) => setTheme(val)}>
                            <SelectTrigger className="w-[140px] h-8 text-xs border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-zinc-950 dark:border-zinc-800">
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