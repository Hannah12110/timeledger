import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TimeEntry, Category, ActiveTask, TimePreset } from '../types';

// 定义用户信息的接口
interface UserInfo {
  id: string;
  name: string;
  avatar: string;
}

interface AppState {
  entries: TimeEntry[];
  presets: TimePreset[];
  activeTask: ActiveTask | null;
  selectedDate: number; 
  activeMainTab: 'time' | 'insights' | 'profile';
  // --- 新增状态 ---
  user: UserInfo;
  updateUser: (user: UserInfo) => void;
  // ----------------
  addEntry: (entry: Omit<TimeEntry, 'id'>) => void;
  updateEntry: (id: string, entry: Partial<TimeEntry>) => void;
  deleteEntry: (id: string) => void;
  startTask: (title: string, category: Category) => void;
  stopTask: () => void;
  setSelectedDate: (date: number) => void;
  setActiveMainTab: (tab: 'time' | 'insights' | 'profile') => void;
  addPreset: (preset: Omit<TimePreset, 'id'>) => void;
  updatePreset: (id: string, preset: Partial<TimePreset>) => void;
  deletePreset: (id: string) => void;
  clearAll: () => void;
  logout: () => void;
}

const getStartOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const DEFAULT_PRESETS: TimePreset[] = [
  { id: 'p1', title: '基础睡眠', category: '维持', startTimeStr: '23:00', endTimeStr: '07:00', tags: ['睡眠'] },
  { id: 'p2', title: '午间用餐', category: '维持', startTimeStr: '12:00', endTimeStr: '13:00', tags: ['用餐'] },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      entries: [],
      presets: DEFAULT_PRESETS,
      activeTask: null,
      selectedDate: getStartOfDay(new Date()),
      activeMainTab: 'time',
      
      // --- 用户相关初始状态与方法 ---
      user: {
        id: '1234567',
        name: '用户名',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
      },
      updateUser: (newUser) => set({ user: newUser }),
      // ----------------------------

      addEntry: (entry) => set((state) => {
        let finalEnd = entry.endTime;
        const dayInMs = 24 * 60 * 60 * 1000;

        // 1. 跨天修正逻辑（毫秒级判断）
        if (finalEnd < entry.startTime) {
          finalEnd += dayInMs;
        }

        const startDay = new Date(entry.startTime).toDateString();
        const endDay = new Date(finalEnd).toDateString();

        let newEntries: TimeEntry[] = [];

        // 2. 核心拆分逻辑：判断是否跨自然日
        if (startDay !== endDay) {
          const endOfFirstDay = new Date(entry.startTime);
          endOfFirstDay.setHours(23, 59, 59, 999);
          const endOfFirstDayTs = endOfFirstDay.getTime();

          const startOfSecondDay = new Date(finalEnd);
          startOfSecondDay.setHours(0, 0, 0, 0);
          const startOfSecondDayTs = startOfSecondDay.getTime();

          // 第一段：开始时间 -> 当天 23:59:59
          newEntries.push({
            ...entry,
            endTime: endOfFirstDayTs,
            duration: Math.round((endOfFirstDayTs - entry.startTime) / 60000),
            id: Math.random().toString(36).substr(2, 9)
          });

          // 第二段：次日 00:00 -> 结束时间
          newEntries.push({
            ...entry,
            startTime: startOfSecondDayTs,
            endTime: finalEnd,
            duration: Math.round((finalEnd - startOfSecondDayTs) / 60000),
            id: Math.random().toString(36).substr(2, 9)
          });
        } else {
          // 不跨天，正常录入
          newEntries.push({
            ...entry,
            endTime: finalEnd,
            duration: Math.round((finalEnd - entry.startTime) / 60000),
            id: Math.random().toString(36).substr(2, 9)
          });
        }

        // 3. 冲突检查（针对拆分后的所有条目）
        const hasConflict = newEntries.some(newE => 
          state.entries.some(oldE => 
            new Date(oldE.startTime).toDateString() === new Date(newE.startTime).toDateString() &&
            newE.startTime < oldE.endTime && newE.endTime > oldE.startTime
          )
        );

        if (hasConflict) {
          alert('录入的时间区间与现有记录存在冲突！');
          return state;
        }

        return {
          entries: [...state.entries, ...newEntries].sort((a, b) => a.startTime - b.startTime)
        };
      }),

      updateEntry: (id, updatedFields) => set((state) => {
        const target = state.entries.find(e => e.id === id);
        if (!target) return state;

        let newStart = updatedFields.startTime ?? target.startTime;
        let newEnd = updatedFields.endTime ?? target.endTime;
        const dayInMs = 24 * 60 * 60 * 1000;
        
        if (newEnd < newStart) {
          newEnd += dayInMs;
        }

        const hasConflict = state.entries
          .filter(e => e.id !== id && new Date(e.startTime).toDateString() === new Date(newStart).toDateString())
          .some(e => newStart < e.endTime && newEnd > e.startTime);

        if (hasConflict) {
          alert('修改后的时间与现有任务冲突！');
          return state;
        }

        const duration = Math.round((newEnd - newStart) / 60000);
        
        return {
          entries: state.entries.map((e) => 
            e.id === id 
              ? { ...e, ...updatedFields, endTime: newEnd, duration: Math.max(1, duration) } 
              : e
          ).sort((a, b) => a.startTime - b.startTime)
        };
      }),
      deleteEntry: (id) => set((state) => ({
        entries: state.entries.filter((e) => e.id !== id)
      })),
      startTask: (title, category) => set({
        activeTask: { title, category, startTime: Date.now() }
      }),
      stopTask: () => {
        const { activeTask, addEntry } = get();
        if (activeTask) {
          addEntry({
            title: activeTask.title,
            category: activeTask.category,
            startTime: activeTask.startTime,
            endTime: Date.now(),
            duration: 0, 
            tags: [],
            note: ''
          });
          set({ activeTask: null });
        }
      },
      setSelectedDate: (date) => set({ selectedDate: getStartOfDay(new Date(date)) }),
      setActiveMainTab: (tab) => set({ activeMainTab: tab }),
      addPreset: (preset) => set((state) => ({
        presets: [...state.presets, { ...preset, id: Math.random().toString(36).substr(2, 9) }]
      })),
      updatePreset: (id, updatedFields) => set((state) => ({
        presets: state.presets.map((p) => p.id === id ? { ...p, ...updatedFields } : p)
      })),
      deletePreset: (id) => set((state) => ({
        presets: state.presets.filter((p) => p.id !== id)
      })),
      clearAll: () => set({ entries: [], activeTask: null }),
      logout: () => {
        set({
          entries: [],
          activeTask: null,
          user: { id: '', name: '未登录', avatar: '' }
        });
        localStorage.removeItem('shiguangzhang-v5-storage');
        window.location.reload();
      }
    }),
    {
      name: 'shiguangzhang-v5-storage',
    }
  )
);