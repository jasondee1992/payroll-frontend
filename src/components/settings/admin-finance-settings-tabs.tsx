"use client";

import { useState } from "react";
import { Calculator, Upload } from "lucide-react";
import { AttendanceCutoffManager } from "@/components/settings/attendance-cutoff-manager";
import { GovernmentDeductionSettings } from "@/components/settings/government-deduction-settings";
import { cn } from "@/lib/utils";

type SettingsTabId = "government-deductions" | "attendance-uploads";

const SETTINGS_TABS: Array<{
  id: SettingsTabId;
  label: string;
  description: string;
  icon: typeof Calculator;
}> = [
  {
    id: "government-deductions",
    label: "Government Deductions",
    description: "Manage rule sets, brackets, and deduction previews.",
    icon: Calculator,
  },
  {
    id: "attendance-uploads",
    label: "Attendance Uploads",
    description: "Review and delete incorrect attendance cutoff uploads.",
    icon: Upload,
  },
];

export function AdminFinanceSettingsTabs() {
  const [activeTab, setActiveTab] = useState<SettingsTabId>("government-deductions");

  return (
    <div className="space-y-6">
      <nav className="panel-muted p-2">
        <div className="flex flex-wrap gap-2">
          {SETTINGS_TABS.map((tab) => {
            const active = tab.id === activeTab;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "inline-flex min-h-11 items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition",
                  active
                    ? "bg-white text-slate-950 shadow-sm"
                    : "text-slate-600 hover:bg-white/70 hover:text-slate-950",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
        <p className="px-3 pt-3 text-sm text-slate-600">
          {SETTINGS_TABS.find((tab) => tab.id === activeTab)?.description}
        </p>
      </nav>

      {activeTab === "government-deductions" ? (
        <GovernmentDeductionSettings />
      ) : (
        <AttendanceCutoffManager />
      )}
    </div>
  );
}
