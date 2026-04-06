import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Calculator, Upload, UserPlus } from "lucide-react";
import {
  canManageEmployees,
  canManageAttendanceUploads,
  canManagePayroll,
  type AppRole,
} from "@/lib/auth/session";

type QuickAction = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  isVisible?: (role: AppRole | null | undefined) => boolean;
};

const quickActions: QuickAction[] = [
  {
    title: "Add Employee",
    description: "Create a new employee record and begin payroll setup.",
    href: "/employees/new",
    icon: UserPlus,
    isVisible: canManageEmployees,
  },
  {
    title: "Upload Attendance",
    description: "Prepare the attendance import workflow for the active period.",
    href: "/attendance",
    icon: Upload,
    isVisible: canManageAttendanceUploads,
  },
  {
    title: "Payroll Review",
    description: "Calculate, review, approve, and post payroll by cutoff.",
    href: "/payroll",
    icon: Calculator,
    isVisible: canManagePayroll,
  },
];

type QuickActionsPanelProps = {
  currentRole?: AppRole | null;
};

export function QuickActionsPanel({ currentRole = null }: QuickActionsPanelProps) {
  const visibleActions = quickActions.filter(
    (action) => action.isVisible?.(currentRole) ?? true,
  );

  return (
    <div className="grid gap-3">
      {visibleActions.map((action) => {
        const Icon = action.icon;

        return (
          <Link
            key={action.href}
            href={action.href}
            className="group flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-4 transition hover:border-slate-300 hover:bg-white"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white transition group-hover:bg-slate-800">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-950">{action.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {action.description}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

