// src/types.ts
export type Category = '投资' | '维持' | '损耗';

export interface TimeEntry {
  id: string;
  title: string;
  category: Category;
  startTime: number;
  endTime: number;
  duration: number;
  note?: string;
  tags?: string[];
}

export interface TimePreset {
  id: string;
  title: string;
  category: Category;
  startTimeStr: string;
  endTimeStr: string;
  tags: string[];
}

export interface ActiveTask {
  title: string;
  category: Category;
  startTime: number;
}

// 必须包含 isReminderEnabled 解决 image_f24b1c 报错
export interface UserSettings {
  sleepStart: string;
  sleepEnd: string;
  reminderTime: string;
  isReminderEnabled: boolean; 
}

export interface UserInfo {
  id: string;
  name: string;
  avatar: string;
  email: string;
  settings: UserSettings;
}