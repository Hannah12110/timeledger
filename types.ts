
export type Category = '投资' | '维持' | '损耗';

export interface TimeEntry {
  id: string;
  title: string;
  category: Category;
  startTime: number; // timestamp
  endTime: number;   // timestamp
  duration: number;  // in minutes
  note?: string;
  tags?: string[];
}

export interface TimePreset {
  id: string;
  title: string;
  category: Category;
  startTimeStr: string; // e.g., "23:00"
  endTimeStr: string;   // e.g., "07:00"
  tags: string[];
}

export interface ActiveTask {
  title: string;
  category: Category;
  startTime: number;
}

export interface AIInsight {
  summary: string;
  suggestions: string[];
  productivityScore: number;
}
