export type HolidayType =
  | "Regular Holiday"
  | "Special Non-Working Holiday"
  | "Company Holiday"
  | "Local Holiday";

export interface HolidayRecord {
  id: number;
  holiday_date: string;
  holiday_name: string;
  holiday_type: HolidayType;
  applies_nationally: boolean;
  applies_to_location?: string | null;
  is_paid: boolean;
  remarks?: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}
