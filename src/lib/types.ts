export type Setting = "indoor" | "outdoor" | "either";
export type Budget = "free" | "low" | "medium" | "high";

export interface Activity {
  id: string;
  title: string;
  description: string;
  setting: Exclude<Setting, "either">;
  budget: Budget;
  minAge: number;
  durationHours: number;
  tags: string[];
}

export interface Preferences {
  childAge: number;
  setting: Setting;
  budget: Budget;
  hours: number;
}
