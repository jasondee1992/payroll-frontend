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

