'use client';

import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, Languages, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ISO_TO_LANGUAGE } from "@/services/config";
import { usePostHog } from 'posthog-js/react';
// Assume ISO_TO_LANGUAGE is imported from your config file


// --- Prepare the language options from your object ---
// We convert the object into an array and filter out duplicates by lng_code
const languageOptions = Object.values(ISO_TO_LANGUAGE).reduce((acc, current) => {
  if (!acc.some(item => item.lng_code === current.lng_code)) {
    acc.push(current);
  }
  return acc;
}, []).sort((a, b) => a.language.localeCompare(b.language)); // Sort alphabetically


export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const posthog = usePostHog();
  // Find the currently selected language's full data object
  const selectedLanguage = languageOptions.find(lang => lang.lng_code === i18n.language) || languageOptions.find(lang => lang.lng_code === 'en');

  const handleLanguageChange = (lngCode) => {
    posthog.capture("lang_changed", {lngCode})
    i18n.changeLanguage(lngCode);
    setOpen(false); // Close the dropdown after selection
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger>
        <Button
          variant="outline"
          className="justify-start focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          {selectedLanguage ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <Languages/>
                <span className="mr-2 text-lg">{selectedLanguage.flag}</span>
                {/* <span>{selectedLanguage.language}</span> */}
              </div>
              <ChevronDown className="h-4 w-4" />
            </div>
          ) : (
            <Languages className="mr-2 h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search language..." />
          <CommandList>
            <CommandEmpty>{t("No language found.")}.</CommandEmpty>
            <CommandGroup>
              {languageOptions.map((lang) => (
                <CommandItem
                  key={lang.lng_code}
                  value={`${lang.language} ${lang.lng_code}`} // Make the value searchable
                  onSelect={() => handleLanguageChange(lang.lng_code)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <span className="mr-2 text-lg">{lang.flag}</span>
                    <span>{lang.language}</span>
                  </div>
                  <Check
                    className={cn(
                      "h-4 w-4",
                      i18n.language === lang.lng_code ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}