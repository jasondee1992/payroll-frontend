"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type AttendanceDashboardTab = {
  id: string;
  label: string;
  content: React.ReactNode;
};

type AttendanceDashboardTabsProps = {
  tabs: AttendanceDashboardTab[];
};

export function AttendanceDashboardTabs({
  tabs,
}: AttendanceDashboardTabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? "");
  const currentTab = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <div className="inline-flex min-w-full gap-2 rounded-2xl border border-slate-200/80 bg-white p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex min-w-max items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition",
                tab.id === currentTab?.id
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div>{currentTab?.content}</div>
    </div>
  );
}
