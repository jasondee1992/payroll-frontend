"use client";

import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type NotificationBellProps = {
  currentUsername: string | null;
};

export function NotificationBell({
  currentUsername,
}: NotificationBellProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        aria-label="Open notifications"
      >
        <Bell className="h-5 w-5" />
      </button>

      {open ? (
        <div className="absolute right-0 z-30 mt-3 w-[340px] rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-2xl shadow-slate-950/10">
          <div className="border-b border-slate-200/80 pb-3">
            <p className="text-sm font-semibold text-slate-950">Notifications</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {currentUsername
                ? `No notifications for ${currentUsername}.`
                : "No notifications for this account."}
            </p>
          </div>

          <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-sm leading-6 text-slate-500">
            Notifications will appear here once system events, approvals, and request updates are wired to live data.
          </div>
        </div>
      ) : null}
    </div>
  );
}
