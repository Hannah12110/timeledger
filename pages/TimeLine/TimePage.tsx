
import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { EntryItem } from './EntryItem';
import { Category, TimeEntry, TimePreset } from '../../types';
import { CATEGORY_COLORS } from '../../constants';

interface GapItemProps {
  duration: number;
  startTime: number;
  endTime: number;
  onQuickLog: (startTime: number, endTime: number, preset?: TimePreset) => void;
}

export const TimePage: React.FC = () => {
  const { entries, presets, activeTask, startTask, stopTask, deleteEntry, addEntry, updateEntry, selectedDate, setSelectedDate } = useStore();
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState<Category>('投资');
  const [timerDisplay, setTimerDisplay] = useState('00:00:00');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingEntry, setEditingEntry] = useState<Partial<TimeEntry> | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  const isToday = new Date(selectedDate).toDateString() === new Date().toDateString();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
      if (activeTask && isToday) {
        const diff = Date.now() - activeTask.startTime;
        const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
        const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
        const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
        setTimerDisplay(`${h}:${m}:${s}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeTask, isToday]);

  const handleStart = () => {
    if (!taskTitle) return;
    startTask(taskTitle, taskCategory);
    setTaskTitle('');
  };

  const openAddModal = () => {
    const targetDate = new Date(selectedDate);
    targetDate.setHours(new Date().getHours(), new Date().getMinutes());
    const ts = targetDate.getTime();
    setEditingEntry({
      startTime: ts - (30 * 60000),
      endTime: ts,
      title: '',
      category: '投资',
      tags: [],
      note: ''
    });
    setIsModalOpen(true);
  };

  const handleQuickLog = (startTime: number, endTime: number, preset?: TimePreset) => {
    setEditingEntry({
      startTime,
      endTime,
      title: preset?.title || '',
      category: preset?.category || '投资',
      tags: preset?.tags || [],
      note: ''
    });
    setIsModalOpen(true);
  };

  const handleEditEntry = (entry: TimeEntry) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  const saveEntry = (data: Partial<TimeEntry>) => {
    if (!data.title) return;
    const duration = Math.round(((data.endTime || 0) - (data.startTime || 0)) / 60000);
    
    if (data.id) {
      updateEntry(data.id, { ...data, duration });
    } else {
      addEntry({
        title: data.title,
        category: data.category || '投资',
        startTime: data.startTime || Date.now(),
        endTime: data.endTime || Date.now(),
        duration,
        tags: data.tags || [],
        note: data.note || ''
      });
    }
    setIsModalOpen(false);
    setEditingEntry(null);
  };

  const handleDeleteEntry = (id: string) => {
    if (window.confirm('确定要删除这条记录吗？')) {
      deleteEntry(id);
      setIsModalOpen(false);
      setEditingEntry(null);
    }
  };

  // Timeline Logic
  const timelineElements: React.ReactNode[] = [];
  const filteredEntries = entries.filter(e => new Date(e.startTime).toDateString() === new Date(selectedDate).toDateString());
  const sortedEntries = [...filteredEntries].sort((a, b) => a.startTime - b.startTime);

  sortedEntries.forEach((entry, idx) => {
    if (idx > 0) {
      const prevEntry = sortedEntries[idx - 1];
      const gapMinutes = Math.round((entry.startTime - prevEntry.endTime) / 60000);
      if (gapMinutes >= 5) {
        timelineElements.push(
          <GapItem 
            key={`gap-${idx}`} 
            duration={gapMinutes} 
            startTime={prevEntry.endTime} 
            endTime={entry.startTime}
            onQuickLog={handleQuickLog}
          />
        );
      }
    }
    timelineElements.push(
      <EntryItem 
        key={entry.id} 
        entry={entry} 
        onDelete={deleteEntry} 
        onEdit={handleEditEntry}
      />
    );
  });

  // Check for relevant presets to suggest in gaps
  const getRelevantPreset = (startTime: number, endTime: number) => {
    const startHour = new Date(startTime).getHours();
    return presets.find(p => {
      const [pHour] = p.startTimeStr.split(':').map(Number);
      return Math.abs(pHour - startHour) <= 1;
    });
  };

  if (isToday) {
    const lastEntry = sortedEntries[sortedEntries.length - 1];
    const lastTime = lastEntry ? lastEntry.endTime : new Date(selectedDate).setHours(0, 0, 0, 0);
    const currentGap = Math.round((currentTime - lastTime) / 60000);
    
    if (currentGap >= 5 && !activeTask) {
      timelineElements.push(
        <GapItem 
          key="current-gap" 
          duration={currentGap} 
          startTime={lastTime} 
          endTime={currentTime}
          onQuickLog={(s, e) => handleQuickLog(s, e, getRelevantPreset(s, e))}
        />
      );
    }
  }

  const dateLabel = new Date(selectedDate).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  const weekdayLabel = new Date(selectedDate).toLocaleDateString('zh-CN', { weekday: 'long' });

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between bg-white border-b border-gray-100 sticky top-0 z-40">
        <button 
          onClick={() => setIsCalendarOpen(true)}
          className="text-blue-500 text-xl hover:bg-blue-50 w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
        >
          <i className="far fa-calendar-alt"></i>
        </button>
        <h1 className="text-lg font-bold text-gray-800 tracking-tight">{dateLabel}</h1>
        <button 
          onClick={() => setIsSearchOpen(true)}
          className="text-gray-400 text-xl hover:bg-gray-50 w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
        >
          <i className="fas fa-search"></i>
        </button>
      </header>

      {isSearchOpen && (
        <div className="fixed inset-0 bg-white z-[100] flex flex-col p-6 animate-in fade-in slide-in-from-top duration-200">
           <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 bg-gray-50 rounded-2xl flex items-center px-4">
                 <i className="fas fa-search text-gray-300 mr-3"></i>
                 <input 
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="搜索任务名称、标签..."
                    className="flex-1 bg-transparent border-none outline-none py-4 text-gray-700 font-medium"
                 />
              </div>
              <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="text-blue-500 font-bold">取消</button>
           </div>
           <div className="flex-1 overflow-y-auto space-y-3">
              {entries
                .filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase()) || e.tags?.some(t => t.includes(searchQuery)))
                .map(e => (
                   <div 
                      key={e.id} 
                      onClick={() => { handleEditEntry(e); setIsSearchOpen(false); setSearchQuery(''); }}
                      className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center cursor-pointer"
                   >
                      <div>
                        <div className="text-xs text-gray-400 mb-0.5">{new Date(e.startTime).toLocaleDateString()}</div>
                        <div className="font-bold text-gray-800">{e.title}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${CATEGORY_COLORS[e.category]}`}>
                        {e.category}
                      </span>
                   </div>
                ))
              }
           </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 pt-6 pb-24 relative">
        {/* Compact Quick Start Bar */}
        {isToday && !activeTask && (
          <div className="bg-white p-4 rounded-[2.5rem] shadow-[0_10px_30px_rgba(0,0,0,0.04)] mb-8 flex flex-col gap-3">
            <div className="flex items-center gap-3">
                <button 
                onClick={handleStart}
                className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all flex-shrink-0 shadow-lg shadow-blue-100"
                >
                <i className="fas fa-play text-sm translate-x-0.5"></i>
                </button>
                
                <input 
                type="text" 
                value={taskTitle}
                onChange={e => setTaskTitle(e.target.value)}
                placeholder="正在做什么？"
                className="flex-1 bg-gray-50 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-blue-100 outline-none border-none min-w-0"
                />

                <div className="flex gap-1.5 flex-shrink-0">
                {(['投资', '损耗', '维持'] as Category[]).map(cat => (
                    <button
                    key={cat}
                    onClick={() => setTaskCategory(cat)}
                    className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all border flex items-center justify-center flex-col gap-0.5 ${
                        taskCategory === cat 
                        ? `${CATEGORY_COLORS[cat]} text-white border-transparent shadow-md` 
                        : `bg-white text-gray-400 border-gray-100 hover:border-blue-100`
                    }`}
                    >
                    <span className="leading-none">{cat[0]}</span>
                    </button>
                ))}
                </div>
            </div>
            
            {/* Presets Quick Picker */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 px-1">
                {presets.slice(0, 4).map(p => (
                    <button 
                        key={p.id}
                        onClick={() => {
                            const now = Date.now();
                            const [h, m] = p.startTimeStr.split(':').map(Number);
                            const [eh, em] = p.endTimeStr.split(':').map(Number);
                            const start = new Date(selectedDate).setHours(h, m, 0, 0);
                            const end = new Date(selectedDate).setHours(eh, em, 0, 0);
                            handleQuickLog(start, end, p);
                        }}
                        className="flex-shrink-0 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 text-[10px] font-bold text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                        {p.title}
                    </button>
                ))}
            </div>
          </div>
        )}

        {isToday && activeTask && (
          <div className="bg-white p-6 rounded-[2.5rem] shadow-[0_20px_40px_rgba(99,102,241,0.1)] mb-8 animate-in zoom-in-95 duration-300 border border-blue-50">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                <h2 className="text-gray-800 font-bold text-lg">{activeTask.title}</h2>
              </div>
              <span className={`px-3 py-1 rounded-lg text-[10px] font-bold text-white ${CATEGORY_COLORS[activeTask.category]}`}>
                {activeTask.category}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-5xl font-black text-blue-600 tracking-tighter tabular-nums font-mono">
                {timerDisplay}
              </div>
              <button onClick={stopTask} className="bg-rose-50 text-rose-500 font-bold px-6 py-3 rounded-2xl flex items-center gap-2">
                <i className="fas fa-stop text-xs"></i> 停止
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-6 px-2">
          <h3 className="text-gray-400 font-bold text-xs uppercase tracking-wider">今日对账时间轴</h3>
          <span className="text-gray-300 text-[10px] font-medium">{weekdayLabel}</span>
        </div>

        <div className="space-y-4 relative">
          {timelineElements.length > 0 ? (
            timelineElements
          ) : (
            <div className="text-center py-20 bg-white/50 rounded-[2rem] border-2 border-dashed border-gray-100">
               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="far fa-folder-open text-gray-200 text-xl"></i>
               </div>
               <p className="text-gray-400 font-medium text-sm">此日没有记账记录</p>
            </div>
          )}

          {isToday && (
            <div className="flex gap-4 items-center relative py-2">
               <div className="w-12 text-xs font-bold text-rose-500 text-right">
                  {new Date(currentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
               </div>
               <div className="flex-1 h-0.5 bg-rose-500 relative flex items-center">
                  <div className="absolute -left-1 w-2.5 h-2.5 bg-rose-500 rounded-full shadow-md shadow-rose-200 border-2 border-white"></div>
                  <div className="absolute right-0 bg-rose-500 text-white text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter shadow-sm">NOW</div>
               </div>
            </div>
          )}
        </div>
      </div>

      <button 
        onClick={openAddModal}
        className="fixed bottom-28 right-6 w-16 h-16 bg-blue-600 text-white rounded-full shadow-[0_12px_30px_rgba(37,99,235,0.4)] flex items-center justify-center text-3xl active:scale-90 transition-transform z-30"
      >
        <i className="fas fa-plus"></i>
      </button>

      {isCalendarOpen && (
        <CalendarModal 
          selectedDate={selectedDate}
          onSelect={(d) => { setSelectedDate(d); setIsCalendarOpen(false); }}
          onClose={() => setIsCalendarOpen(false)}
        />
      )}

      {isModalOpen && editingEntry && (
        <EditModal 
          entry={editingEntry} 
          onClose={() => setIsModalOpen(false)} 
          onSave={saveEntry}
          onDelete={handleDeleteEntry}
        />
      )}
    </div>
  );
};

const CalendarModal = ({ selectedDate, onSelect, onClose }: { selectedDate: number, onSelect: (d: number) => void, onClose: () => void }) => {
  const [viewDate, setViewDate] = useState(new Date(selectedDate));
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  
  const firstDay = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const days = [];
  
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthLastDay - i);
    days.push({ day: d.getDate(), month: 'prev', ts: d.getTime() });
  }
  
  for (let i = 1; i <= lastDay; i++) {
    const d = new Date(year, month, i);
    days.push({ day: i, month: 'curr', ts: d.getTime() });
  }

  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    days.push({ day: d.getDate(), month: 'next', ts: d.getTime() });
  }

  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  const monthsList = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const isSameDay = (d1: number, d2: number) => new Date(d1).toDateString() === new Date(d2).toDateString();

  const handleJumpToToday = () => {
    onSelect(Date.now());
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[200] flex items-center justify-center p-8 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-sm rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col relative">
        <div className="p-8 pb-4">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              <div 
                onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
                className="flex items-center gap-1 border-2 border-blue-500 rounded-lg px-2 py-0.5 cursor-pointer hover:bg-blue-50 transition-colors"
              >
                <span className="text-lg font-black text-gray-900">{year}年{month + 1}月</span>
                <i className={`fas fa-caret-down text-blue-500 text-xs transition-transform ${isMonthPickerOpen ? 'rotate-180' : ''}`}></i>
              </div>
              
              <button 
                onClick={handleJumpToToday}
                className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-black shadow-sm active:scale-90 transition-all border border-blue-100"
              >
                今
              </button>
            </div>
            <div className="flex gap-6 text-gray-400">
              <button onClick={() => setViewDate(new Date(year, month - 1))} className="hover:text-blue-500 transition-colors">
                <i className="fas fa-chevron-left text-sm"></i>
              </button>
              <button onClick={() => setViewDate(new Date(year, month + 1))} className="hover:text-blue-500 transition-colors">
                <i className="fas fa-chevron-right text-sm"></i>
              </button>
            </div>
          </div>

          <div className="relative">
            {isMonthPickerOpen && (
              <div className="absolute inset-0 z-10 bg-white grid grid-cols-3 gap-2 p-2 animate-in zoom-in-95 duration-200">
                {monthsList.map((m, i) => (
                  <button
                    key={m}
                    onClick={() => {
                      setViewDate(new Date(year, i, 1));
                      setIsMonthPickerOpen(false);
                    }}
                    className={`py-3 rounded-2xl text-sm font-bold ${month === i ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-7 mb-4">
              {weekdays.map(w => <div key={w} className="text-center text-xs font-medium text-gray-400 py-2">{w}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-y-2">
              {days.map((d, i) => (
                <div 
                  key={i} 
                  onClick={() => onSelect(d.ts)}
                  className="flex items-center justify-center p-0.5"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer transition-all
                    ${d.month === 'curr' ? 'text-gray-800' : 'text-gray-200'}
                    ${isSameDay(d.ts, selectedDate) ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-blue-50'}
                    ${isSameDay(d.ts, Date.now()) && !isSameDay(d.ts, selectedDate) ? 'border-2 border-blue-100 text-blue-600' : ''}
                  `}>
                    {d.day}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <button 
          onClick={onClose} 
          className="w-full py-6 text-blue-600 font-bold text-base border-t border-gray-100 mt-2 active:bg-gray-50 transition-colors"
        >
          关闭
        </button>
      </div>
    </div>
  );
};

const GapItem: React.FC<GapItemProps> = ({ duration, startTime, endTime, onQuickLog }) => (
  <div className="flex gap-4 items-start">
    <div className="w-12 pt-2 text-xs font-medium text-gray-300 text-right">
       {new Date(startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
    </div>
    <div className="flex-1 bg-blue-50/20 border-2 border-dashed border-blue-100 rounded-2xl p-4 flex items-center justify-between transition-all hover:bg-blue-50/40">
      <div>
        <h4 className="text-blue-500 font-bold text-sm">未对账缺口</h4>
        <p className="text-[10px] text-blue-300 font-bold">发现 {duration} 分钟空白</p>
      </div>
      <button 
        onClick={() => onQuickLog(startTime, endTime)}
        className="bg-blue-600 text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-lg shadow-blue-200 active:scale-95 transition-transform"
      >
        快速补账
      </button>
    </div>
  </div>
);

const EditModal = ({ entry, onClose, onSave, onDelete }: { entry: Partial<TimeEntry>, onClose: () => void, onSave: (data: Partial<TimeEntry>) => void, onDelete: (id: string) => void }) => {
  const [formData, setFormData] = useState({
    title: entry.title || '',
    category: entry.category || '投资',
    startTime: entry.startTime || Date.now(),
    endTime: entry.endTime || Date.now(),
    tags: entry.tags || [],
    note: entry.note || ''
  });
  const [tagInput, setTagInput] = useState('');

  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const gapMinutes = Math.round((formData.endTime - formData.startTime) / 60000);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  const getTimeValue = (ts: number) => {
    const date = new Date(ts);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const handleTimeChange = (type: 'start' | 'end', timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const baseDate = new Date(type === 'start' ? formData.startTime : formData.endTime);
    baseDate.setHours(hours, minutes, 0, 0);
    setFormData({ ...formData, [type === 'start' ? 'startTime' : 'endTime']: baseDate.getTime() });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto no-scrollbar relative">
        <div className="flex justify-between items-center mb-8 sticky top-0 bg-white z-10 pt-2 pb-2 -mt-2">
          <button onClick={onClose} className="text-blue-500 font-bold text-base">取消</button>
          <h2 className="text-gray-900 font-black text-xl">编辑账目</h2>
          <div className="w-10 flex justify-end">
            {entry.id && (
              <button 
                onClick={() => onDelete(entry.id!)}
                className="text-rose-500 hover:bg-rose-50 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              >
                <i className="fas fa-trash-alt"></i>
              </button>
            )}
          </div>
        </div>

        <div className="mb-10">
          <input 
            autoFocus
            type="text"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            placeholder="你在做什么？"
            className="w-full text-4xl font-black text-gray-900 placeholder-gray-100 border-none outline-none p-0 focus:ring-0"
          />
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">时间</span>
          <span className="bg-blue-50 text-blue-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
            {gapMinutes} 分钟
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 flex flex-col items-center relative group/time hover:bg-blue-50/50 transition-colors">
            <span className="text-[10px] font-bold text-gray-400 uppercase mb-2">开始</span>
            <div className="flex items-center gap-3 relative cursor-pointer">
              <span className="text-xl font-black text-gray-800">{formatTime(formData.startTime)}</span>
              <i className="far fa-clock text-gray-400 group-hover/time:text-blue-500 transition-colors"></i>
              <input 
                type="time" 
                value={getTimeValue(formData.startTime)}
                onChange={(e) => handleTimeChange('start', e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>
          </div>
          <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 flex flex-col items-center relative group/time hover:bg-blue-50/50 transition-colors">
            <span className="text-[10px] font-bold text-gray-400 uppercase mb-2">结束</span>
            <div className="flex items-center gap-3 relative cursor-pointer">
              <span className="text-xl font-black text-gray-800">{formatTime(formData.endTime)}</span>
              <i className="far fa-clock text-gray-400 group-hover/time:text-blue-500 transition-colors"></i>
              <input 
                type="time" 
                value={getTimeValue(formData.endTime)}
                onChange={(e) => handleTimeChange('end', e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
            </div>
          </div>
        </div>

        <div className="mb-10">
          <span className="text-xs font-bold text-gray-300 uppercase tracking-widest block mb-4">分类</span>
          <div className="flex gap-4">
            <CategoryBtn 
              isActive={formData.category === '投资'} 
              onClick={() => setFormData({ ...formData, category: '投资' })}
              label="投资"
              icon="fa-chart-line"
              color="green"
            />
            <CategoryBtn 
              isActive={formData.category === '损耗'} 
              onClick={() => setFormData({ ...formData, category: '损耗' })}
              label="损耗"
              icon="fa-trash"
              color="red"
            />
            <CategoryBtn 
              isActive={formData.category === '维持'} 
              onClick={() => setFormData({ ...formData, category: '维持' })}
              label="维持"
              icon="fa-wrench"
              color="blue"
            />
          </div>
        </div>

        <div className="mb-10">
          <span className="text-xs font-bold text-gray-300 uppercase tracking-widest block mb-4">标签</span>
          <div className="bg-gray-50/50 p-4 rounded-3xl border border-gray-100 flex flex-wrap gap-2 items-center">
             {formData.tags.map(tag => (
               <span key={tag} className="bg-white px-3 py-1.5 rounded-full text-xs font-bold text-gray-700 shadow-sm border border-gray-100 flex items-center gap-2">
                 #{tag}
                 <button onClick={() => removeTag(tag)} className="text-gray-300 hover:text-rose-500">×</button>
               </span>
             ))}
             <input 
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="输入标签..."
                className="bg-transparent border-none outline-none text-xs text-gray-500 focus:ring-0 min-w-[80px]"
             />
          </div>
        </div>

        <div className="mb-10">
          <span className="text-xs font-bold text-gray-300 uppercase tracking-widest block mb-4">备注</span>
          <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
            <textarea 
               value={formData.note}
               onChange={e => setFormData({ ...formData, note: e.target.value })}
               placeholder="记录这一刻的想法..."
               className="bg-transparent border-none outline-none text-sm text-gray-800 w-full min-h-[100px] resize-none focus:ring-0"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 mb-4">
          <button 
            onClick={() => onSave({ ...entry, ...formData })}
            className="w-full bg-blue-600 text-white font-black py-5 rounded-[2rem] shadow-xl shadow-blue-200 flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            <i className="fas fa-save"></i>
            存入账本
          </button>
        </div>
      </div>
    </div>
  );
};

const CategoryBtn = ({ isActive, onClick, label, icon, color }: any) => {
  const activeClasses = {
    green: 'bg-green-50 text-green-500 border-green-100',
    red: 'bg-red-50 text-red-500 border-red-100',
    blue: 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100'
  }[color as 'green' | 'red' | 'blue'];

  const inactiveClasses = 'bg-white text-gray-400 border-gray-100';

  return (
    <button 
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-3xl border-2 font-black text-sm transition-all ${isActive ? activeClasses : inactiveClasses}`}
    >
      <i className={`fas ${icon}`}></i>
      {label}
    </button>
  );
};
