// components/SettingsDialog.tsx

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  User as UserIcon, 
  Palette, 
  CreditCard, 
  Users, 
  Database, 
  X, 
  Pencil, 
  Flame, 
  Copy, // A better icon for "content count"
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

// The component accepts a `children` prop which will be the DropdownMenuItem
export function SettingsDialog({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState("account");

  const sidebarItems = [
    { id: "account", label: "Счет", icon: UserIcon },
    { id: "personalization", label: "Персонализация", icon: Palette },
    { id: "billing", label: "План и выставление счетов", icon: CreditCard },
    { id: "members", label: "Члены", icon: Users },
    { id: "data", label: "Контроль данных", icon: Database },
  ];

  return (
    <Dialog>
      <DialogTrigger>
        {children}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden h-[650px] rounded-2xl sm:rounded-2xl border shadow-2xl">
        <div className="flex h-full">
          
          {/* --- Left Sidebar --- */}
          <div className="w-[280px] bg-neutral-50/70 border-r flex flex-col">
            <div className="p-4 pt-5 border-b">
              {/* The close button is part of the Dialog, but we can add our own if needed or just rely on the default */}
            </div>

            <nav className="flex flex-col gap-1 p-3">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all",
                    activeTab === item.id
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:bg-neutral-100/70 hover:text-gray-900"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", activeTab === item.id ? "text-gray-800" : "text-gray-400")} />
                  <span className={item.id === 'billing' ? 'leading-tight text-left' : ''}>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* --- Right Content Area --- */}
          <div className="flex-1 overflow-y-auto bg-white">
            <div className="p-8 max-w-2xl mx-auto">
              
              {/* Blue Banner */}
              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 flex items-center justify-center">
                    {/* Animated SVG for the profile completion icon */}
                    <svg className="h-full w-full" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="16" fill="none" className="stroke-blue-100" strokeWidth="2"></circle>
                      <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        className="stroke-blue-500"
                        strokeWidth="2"
                        strokeDasharray="100"
                        strokeDashoffset="30"
                        transform="rotate(-90 18 18)"
                      ></circle>
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-blue-900 font-semibold">Полный профиль</h3>
                    <p className="text-blue-700 text-sm">Получайте персонализированные материалы</p>
                  </div>
                </div>
                <Button variant="outline" className="bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 rounded-lg px-4 h-9 text-sm font-medium">
                  Полный <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              {/* Profile Details Grid */}
              <div className="space-y-0">
                <ProfileRow label="Имя" value="sevil tagiyeva" icon={<Pencil className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-700" />} />
                <ProfileRow label="Электронная почта" value="ttssevil@gmail.com" />
                <ProfileRow label="Дата создания" value="October 18, 2025" />
                <ProfileRow 
                  label="Полосы" 
                  customValue={
                      <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                          <Flame className="h-4 w-4 text-orange-400" /> 1
                      </div>
                  } 
                />
                <ProfileRow 
                  label="Подсчет содержания" 
                  customValue={
                      <div className="flex items-center gap-2 text-gray-700 font-medium">
                          <Copy className="h-4 w-4 text-blue-500" /> 9
                      </div>
                  } 
                />
              </div>

              {/* Referral Section */}
              <div className="mt-12 pt-8">
                  <div className="flex items-start justify-between">
                      <div>
                          <h4 className="font-semibold text-gray-900">Скидка 15% - реферальная ссылка</h4>
                          <p className="text-gray-500 text-sm mt-1 max-w-xs">
                            Пригласите друзей, получите скидку 15% на 1 месяц за...
                          </p>
                      </div>
                      <Button className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg h-9 px-4 font-medium text-sm">
                        Копировать ссылку
                      </Button>
                  </div>
              </div>

            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper Component for consistent row styling
const ProfileRow = ({ label, value, customValue, icon }: { label: string, value?: string, customValue?: React.ReactNode, icon?: React.ReactNode }) => {
    return (
        <div className="flex items-center justify-between py-4 border-b border-neutral-100 last:border-0">
            <span className="font-medium text-gray-800 text-sm">{label}</span>
            <div className="flex items-center gap-3">
                {customValue ? customValue : <span className="text-gray-600 text-sm">{value}</span>}
                {icon && <div>{icon}</div>}
            </div>
        </div>
    )
}