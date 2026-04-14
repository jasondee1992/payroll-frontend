"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type AttendanceDashboardTab = {
  id: string;
  label: string;
  content: React.ReactNode;
};

type AttendanceDashboardTabsProps = {
  tabs: AttendanceDashboardTab[];
  initialTabId?: string;
  onTabChange?: (tabId: string) => void;
};

export function AttendanceDashboardTabs({
  tabs,
  initialTabId,
  onTabChange,
}: AttendanceDashboardTabsProps) {
  const [activeTab, setActiveTab] = useState(initialTabId ?? tabs[0]?.id ?? "");
  const currentTab = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];

  useEffect(() => {
    if (initialTabId) {
      setActiveTab(initialTabId);
    }
  }, [initialTabId]);

  function handleTabChange(tabId: string) {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  }

  return (
    <div className="space-y-4">
      <div className="ui-sticky-band overflow-x-auto">
        <div className="inline-flex min-w-full gap-2 rounded-[22px] border border-slate-200/80 bg-white/94 p-2 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "inline-flex min-w-max items-center justify-center rounded-xl px-4 py-2.5 text-[12px] font-medium transition",
                tab.id === currentTab?.id
                  ? "bg-slate-900 text-white shadow-[0_10px_24px_-16px_rgba(15,23,42,0.75)]"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">{currentTab?.content}</div>
    </div>
  );
}
