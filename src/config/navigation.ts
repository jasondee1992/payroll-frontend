import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Clock3,
  LayoutDashboard,
  Receipt,
  Settings,
  Users,
  WalletCards,
} from "lucide-react";

export type NavigationItem = {
  title: string;
  href: string;
  description: string;
  icon: LucideIcon;
};

export const navigationItems: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    description: "Operational overview and payroll cycle status.",
    icon: LayoutDashboard,
  },
  {
    title: "Employees",
    href: "/employees",
    description: "Workforce records, onboarding, and directory views.",
    icon: Users,
  },
  {
    title: "Attendance",
    href: "/attendance",
    description: "Time tracking, shifts, and attendance exceptions.",
    icon: Clock3,
  },
  {
    title: "Payroll",
    href: "/payroll",
    description: "Payroll runs, approvals, and pay cycle monitoring.",
    icon: WalletCards,
  },
  {
    title: "Payslips",
    href: "/payslips",
    description: "Published statements and employee pay documents.",
    icon: Receipt,
  },
  {
    title: "Reports",
    href: "/reports",
    description: "Reporting views for payroll, attendance, and costs.",
    icon: BarChart3,
  },
  {
    title: "Settings",
    href: "/settings",
    description: "Organization settings and payroll configuration.",
    icon: Settings,
  },
];

export function getActiveNavigationItem(pathname: string) {
  return (
    navigationItems.find((item) =>
      pathname === item.href || pathname.startsWith(`${item.href}/`),
    ) ?? navigationItems[0]
  );
}
