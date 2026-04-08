"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type EmployeeTab = {
  id: string;
  label: string;
  content: React.ReactNode;
};

type EmployeeDetailTabsProps = {
  tabs: EmployeeTab[];
};

export function EmployeeDetailTabs({ tabs }: EmployeeDetailTabsProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? "");
  const currentTab = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <div className="inline-flex min-w-full gap-2 rounded-[22px] border border-slate-200/80 bg-white/92 p-2 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex min-w-max items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition",
                tab.id === currentTab.id
                  ? "bg-slate-900 text-white shadow-[0_10px_24px_-16px_rgba(15,23,42,0.75)]"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ui-detail-panel">{currentTab?.content}</div>
    </div>
  );
}

