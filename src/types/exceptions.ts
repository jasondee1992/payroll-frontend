import type { DashboardTone, DashboardValueRecord } from "@/types/dashboard";

export interface ExceptionDashboardDetailRecord {
  key: string;
  label: string;
  description?: string | null;
  href?: string | null;
}

export interface ExceptionDashboardItemRecord {
  key: string;
  title: string;
  description: string;
  severity: DashboardTone;
  affected_count: number;
  href?: string | null;
  details: ExceptionDashboardDetailRecord[];
}

export interface ExceptionDashboardGroupRecord {
  key: string;
  title: string;
  description: string;
  severity: DashboardTone;
  total_affected: number;
  open_item_count: number;
  items: ExceptionDashboardItemRecord[];
}

export interface ExceptionDashboardRecord {
  generated_at: string;
  summary_metrics: DashboardValueRecord[];
  groups: ExceptionDashboardGroupRecord[];
}
