export type NotificationSeverity = "info" | "success" | "warning" | "critical" | string;

export interface NotificationRecord {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  category: string;
  severity: NotificationSeverity;
  href: string;
  entity_type?: string | null;
  entity_id?: number | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationMarkAllResult {
  marked_count: number;
}
