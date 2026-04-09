export interface AuditLogActorRecord {
  id: number;
  username: string;
  email: string;
  role: string;
  first_name?: string | null;
  last_name?: string | null;
}

export interface AuditLogRecord {
  id: number;
  actor_user_id?: number | null;
  actor_role?: string | null;
  action_type: string;
  module: string;
  entity_type: string;
  entity_id?: number | null;
  summary: string;
  previous_value?: unknown;
  new_value?: unknown;
  metadata?: unknown;
  created_at: string;
  actor_user?: AuditLogActorRecord | null;
}
