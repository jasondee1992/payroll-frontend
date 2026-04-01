export type UserRole = "admin" | "manager" | "hr" | "employee";
export type UserStatus = "active" | "inactive" | "invited";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatarInitials: string;
}

export interface UserApiRecord {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  employee_id?: number;
  created_at: string;
  updated_at: string;
}

