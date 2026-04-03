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
import type { AppRole } from "@/lib/auth/session";

export type NavigationItem = {
  title: string;
  href: string;
  description: string;
  icon: LucideIcon;
  roles?: AppRole[];
};

export const navigationItems: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    description: "Operational overview and payroll cycle status.",
    icon: LayoutDashboard,
    roles: ["admin", "admin-finance", "finance", "hr", "employee"],
  },
  {
    title: "Employees",
    href: "/employees",
    description: "Workforce records, onboarding, and directory views.",
    icon: Users,
    roles: ["admin", "hr"],
  },
  {
    title: "Attendance",
    href: "/attendance",
    description: "Time tracking, shifts, and attendance exceptions.",
    icon: Clock3,
    roles: ["admin", "admin-finance", "finance", "hr", "employee"],
  },
  {
    title: "Payroll",
    href: "/payroll",
    description: "Payroll runs, approvals, and pay cycle monitoring.",
    icon: WalletCards,
    roles: ["admin", "admin-finance", "finance"],
  },
  {
    title: "Payslips",
    href: "/payslips",
    description: "Published statements and employee pay documents.",
    icon: Receipt,
    roles: ["admin", "admin-finance", "finance"],
  },
  {
    title: "Reports",
    href: "/reports",
    description: "Reporting views for payroll, attendance, and costs.",
    icon: BarChart3,
    roles: ["admin", "admin-finance"],
  },
  {
    title: "Settings",
    href: "/settings",
    description: "Organization settings and payroll configuration.",
    icon: Settings,
    roles: ["admin", "admin-finance", "hr"],
  },
];

export function getNavigationItemsForRole(role: AppRole | null) {
  if (!role) {
    return navigationItems;
  }

  return navigationItems.filter(
    (item) => !item.roles || item.roles.includes(role),
  );
}

export function getActiveNavigationItem(pathname: string, role: AppRole | null = null) {
  const availableItems = getNavigationItemsForRole(role);

  return (
    availableItems.find((item) =>
      pathname === item.href || pathname.startsWith(`${item.href}/`),
    ) ?? availableItems[0] ?? navigationItems[0]
  );
}
