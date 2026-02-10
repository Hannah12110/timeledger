import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TimeEntry, Category, ActiveTask, TimePreset, UserInfo } from '../types';

const DEFAULT_PRESETS: TimePreset[] = [
  { id: 'p1', title: '基础睡眠', category: '维持', startTimeStr: '23:00', endTimeStr: '07:00', tags: ['睡眠'] },
];

const getStartOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

interface AppState {
  entries: TimeEntry[];
  presets: TimePreset[];
  activeTask: ActiveTask | null;
  selectedDate: number; 
  activeMainTab: 'time' | 'insights' | 'profile';
  user: UserInfo;
  isLoggedIn: boolean; 

  addPreset: (preset: Omit<TimePreset, 'id'>) => void;
  updatePreset: (id: string, updatedFields: Partial<TimePreset>) => void;
  deletePreset: (id: string) => void;

  login: (email: string, pass: string) => Promise<boolean>;
  register: (email: string, pass: string) => Promise<boolean>;
  updateUser: (newUser: Partial<UserInfo>) => void;
  logout: () => void;
  
  addEntry: (entry: Omit<TimeEntry, 'id'>) => void;
  updateEntry: (id: string, entry: Partial<TimeEntry>) => void;
  deleteEntry: (id: string) => void;
  startTask: (title: string, category: Category) => void;
  stopTask: () => void;
  setSelectedDate: (date: number) => void;
  setActiveMainTab: (tab: 'time' | 'insights' | 'profile') => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      entries: [],
      presets: DEFAULT_PRESETS,
      activeTask: null,
      selectedDate: getStartOfDay(new Date()),
      activeMainTab: 'time',
      isLoggedIn: false,
      user: {
        id: '',
        name: '未登录',
        avatar: '',
        email: '',
        settings: {
          sleepStart: '23:30',
          sleepEnd: '07:30',
          reminderTime: '21:00',
          isReminderEnabled: true // 解决 image_f24b1c 报错
        }
      },

      // --- 实现预设管理逻辑，解决 ProfilePage 报错 ---
      addPreset: (preset) => set((state) => ({
        presets: [...state.presets, { ...preset, id: Math.random().toString(36).substr(2, 9) }]
      })),

      updatePreset: (id, updatedFields) => set((state) => ({
        presets: state.presets.map((p) => p.id === id ? { ...p, ...updatedFields } : p)
      })),

      deletePreset: (id) => set((state) => ({
        presets: state.presets.filter((p) => p.id !== id)
      })),

      // --- 用户认证逻辑 (针对需求1：设置好登录界面逻辑) ---
      login: async (email, pass) => {
        if (email.includes('@') && pass.length >= 6) {
          set({
            isLoggedIn: true,
            user: {
              ...get().user,
              id: 'u-' + Date.now(),
              name: email.split('@')[0], // 初始昵称默认为邮箱前缀
              email: email,
            }
          });
          return true;
        }
        return false;
      },

      register: async (email, pass) => get().login(email, pass),

      // --- 个人中心设置 (针对需求2：增加昵称/邮箱/设置设置板块) ---
      updateUser: (newData) => set((state) => ({
        user: { 
          ...state.user, 
          ...newData,
          // 确保 settings 能够深度合并，方便修改睡眠时间等固定时长
          settings: newData.settings ? { ...state.user.settings, ...newData.settings } : state.user.settings 
        }
      })),

      // --- 退出逻辑 ---
      logout: () => {
        set({ 
          isLoggedIn: false, 
          activeMainTab: 'time',
          user: { 
            id: '',
            name: '未登录', 
            avatar: '', 
            email: '', 
            settings: get().user.settings // 保留偏好设置，但清除用户信息
          } 
        });
        // 不执行 reload 以免丢失其他内存状态，让 UI 响应 isLoggedIn 的变化
      },

      // --- 核心时间轴逻辑 ---
      addEntry: (entry) => set((state) => {
        const id = Math.random().toString(36).substr(2, 9);
        const duration = Math.round((entry.endTime - entry.startTime) / 60000);
        return {
          entries: [...state.entries, { ...entry, id, duration }].sort((a, b) => a.startTime - b.startTime)
        };
      }),

      updateEntry: (id, fields) => set((state) => ({
        entries: state.entries.map((e) => e.id === id ? { ...e, ...fields } : e)
      })),

      deleteEntry: (id) => set(s => ({ entries: s.entries.filter(e => e.id !== id) })),

      startTask: (t, c) => set({ activeTask: { title: t, category: c, startTime: Date.now() } }),

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

      setSelectedDate: (d) => set({ selectedDate: getStartOfDay(new Date(d)) }),
      setActiveMainTab: (t) => set({ activeMainTab: t }),
    }),
    { name: 'shiguangzhang-v5-storage' }
  )
);