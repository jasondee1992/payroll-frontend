export type DashboardRole =
  | "admin"
  | "admin-finance"
  | "finance"
  | "hr"
  | "employee";

export type DashboardValueType =
  | "currency"
  | "count"
  | "text"
  | "date"
  | "datetime";

export type DashboardTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "strong";

export type DashboardSectionVariant = "metrics" | "activity";

export interface DashboardValueRecord {
  key: string;
  label: string;
  value: string;
  value_type: DashboardValueType;
  context?: string | null;
  tone: DashboardTone;
}

export interface DashboardAlertRecord {
  key: string;
  title: string;
  description: string;
  tone: DashboardTone;
}

export interface DashboardActivityRecord {
  key: string;
  title: string;
  description: string;
  occurred_at?: string | null;
  status_label?: string | null;
  status_tone?: DashboardTone | null;
}

export interface DashboardSectionRecord {
  key: string;
  title: string;
  description: string;
  variant: DashboardSectionVariant;
  items: DashboardValueRecord[];
  activities: DashboardActivityRecord[];
  empty_title?: string | null;
  empty_description?: string | null;
}

export interface DashboardSnapshotRecord {
  role: DashboardRole;
  title: string;
  description: string;
  generated_at: string;
  summary_metrics: DashboardValueRecord[];
  alerts: DashboardAlertRecord[];
  sections: DashboardSectionRecord[];
}
