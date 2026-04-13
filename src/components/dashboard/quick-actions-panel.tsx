import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Calculator,
  CalendarDays,
  Clock3,
  FileBarChart2,
  Receipt,
  Settings,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import type { AppRole } from "@/lib/auth/session";

type QuickAction = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

const actionsByRole: Record<AppRole, QuickAction[]> = {
  hr: [
    {
      title: "Add Employee",
      description: "Create a new employee record and start profile setup.",
      href: "/employees/new",
      icon: UserPlus,
    },
    {
      title: "Review Time Requests",
      description: "Review leave and other time-related requests.",
      href: "/leave-requests",
      icon: CalendarDays,
    },
    {
      title: "Review Attendance",
      description: "Check attendance cutoffs and resolve exceptions.",
      href: "/attendance",
      icon: Clock3,
    },
    {
      title: "Manage Employee Records",
      description: "Open the employee directory and update profiles or loans.",
      href: "/employees",
      icon: Users,
    },
  ],
  employee: [
    {
      title: "File Leave",
      description: "Create a leave or time request from your self-service workspace.",
      href: "/leave-requests",
      icon: CalendarDays,
    },
    {
      title: "View Attendance",
      description: "Check your latest attendance review and unresolved items.",
      href: "/attendance",
      icon: Clock3,
    },
    {
      title: "View Payslips",
      description: "Open your published payslips and payroll details.",
      href: "/payslips",
      icon: Receipt,
    },
    {
      title: "Change Password",
      description: "Open the account security screen for password updates.",
      href: "/change-password",
      icon: Settings,
    },
  ],
  admin: [
    {
      title: "Employees",
      description: "Open workforce records, onboarding, and employee details.",
      href: "/employees",
      icon: Users,
    },
    {
      title: "Attendance",
      description: "Review attendance operations and current exceptions.",
      href: "/attendance",
      icon: Clock3,
    },
    {
      title: "Reports",
      description: "Open higher-level operational and payroll reporting.",
      href: "/reports",
      icon: FileBarChart2,
    },
    {
      title: "Settings",
      description: "Open organization and admin-facing settings.",
      href: "/settings",
      icon: ShieldCheck,
    },
  ],
  finance: [
    {
      title: "Review Payroll",
      description: "Open payroll cutoffs, batches, and detailed breakdowns.",
      href: "/payroll",
      icon: Calculator,
    },
    {
      title: "Open Reports",
      description: "Review deeper payroll and contribution reporting.",
      href: "/reports",
      icon: FileBarChart2,
    },
    {
      title: "View Payslips",
      description: "Inspect published payroll outputs by employee.",
      href: "/payslips",
      icon: Receipt,
    },
  ],
  "admin-finance": [
    {
      title: "Open Current Cutoff",
      description: "Review, approve, and post payroll for the active cutoff.",
      href: "/payroll",
      icon: Calculator,
    },
    {
      title: "Open Reports",
      description: "Inspect monthly totals, YTD values, and contribution breakdowns.",
      href: "/reports",
      icon: FileBarChart2,
    },
    {
      title: "Review Attendance",
      description: "Check cutoff readiness and upstream attendance issues.",
      href: "/attendance",
      icon: Clock3,
    },
    {
      title: "Settings",
      description: "Open payroll and attendance administration settings.",
      href: "/settings",
      icon: Settings,
    },
  ],
  "system-admin": [
    {
      title: "Employees",
      description: "Create and maintain employee records and linked user accounts.",
      href: "/employees",
      icon: Users,
    },
    {
      title: "Settings",
      description: "Update company branding, logo, and login presentation.",
      href: "/settings",
      icon: Settings,
    },
  ],
};

type QuickActionsPanelProps = {
  currentRole?: AppRole | null;
};

export function QuickActionsPanel({ currentRole = null }: QuickActionsPanelProps) {
  const visibleActions = currentRole ? actionsByRole[currentRole] : [];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {visibleActions.map((action) => {
        const Icon = action.icon;

        return (
          <Link
            key={action.href}
            href={action.href}
            className="group flex h-full flex-col rounded-[24px] border border-slate-200/80 bg-slate-50/80 px-4 py-4 transition hover:border-slate-300 hover:bg-white"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white transition group-hover:bg-slate-800">
                <Icon className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Open
              </span>
            </div>
            <div className="mt-4 min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-950">{action.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {action.description}
              </p>
            </div>
            <div className="mt-4 border-t border-slate-200/80 pt-3 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
              {action.href.replace(/\//g, " ").replace(/-/g, " ").trim() || "dashboard"}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
