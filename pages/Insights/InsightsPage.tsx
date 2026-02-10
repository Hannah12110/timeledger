import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { useStore } from '../../store/useStore';
import { TimeEntry, Category } from '../../types';

// 辅助函数：获取一年中的第几周
const getWeekNumber = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

export const InsightsPage: React.FC = () => {
  const { entries, selectedDate, setSelectedDate, setActiveMainTab } = useStore();
  const [activeTab, setActiveTab] = useState<'周' | '月' | '年' | '自定义'>('周');
  const [showUnreconciled, setShowUnreconciled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [customStart, setCustomStart] = useState<string>(new Date(selectedDate - 7 * 24 * 3600000).toISOString().split('T')[0]);
  const [customEnd, setCustomEnd] = useState<string>(new Date(selectedDate).toISOString().split('T')[0]);

  // 1. 计算周期范围
  const periodRange = useMemo(() => {
    const d = new Date(selectedDate);
    if (activeTab === '周') {
      const start = new Date(d);
      start.setDate(d.getDate() - d.getDay());
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end, label: `${d.getFullYear()}年 第${getWeekNumber(d)}周` };
    } else if (activeTab === '月') {
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end, label: `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月` };
    } else if (activeTab === '年') {
      const start = new Date(d.getFullYear(), 0, 1);
      const end = new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { start, end, label: `${d.getFullYear()}年` };
    } else {
      const start = new Date(customStart);
      const end = new Date(customEnd);
      end.setHours(23, 59, 59, 999);
      return { start, end, label: `${customStart} 至 ${customEnd}` };
    }
  }, [selectedDate, activeTab, customStart, customEnd]);

  // 2. 核心数据过滤
  const filteredEntries = useMemo(() => {
    return entries.filter(e => e.startTime >= periodRange.start.getTime() && e.startTime <= periodRange.end.getTime());
  }, [entries, periodRange]);

  const loggedMinutes = useMemo(() => filteredEntries.reduce((acc, e) => acc + e.duration, 0), [filteredEntries]);
  
  const totalPossibleMinutes = useMemo(() => {
    const now = Date.now();
    const effectiveEnd = Math.min(periodRange.end.getTime(), now);
    return Math.max(0, (effectiveEnd - periodRange.start.getTime()) / 60000);
  }, [periodRange]);

  const unreconciledMinutes = Math.max(0, totalPossibleMinutes - loggedMinutes);

  // 3. 统计饼图数据
  const categoryData = useMemo(() => {
    const totals = filteredEntries.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.duration;
      return acc;
    }, { '投资': 0, '维持': 0, '损耗': 0 } as Record<Category, number>);

    const data = [
      { name: '投资', value: totals['投资'], color: '#22C55E' },
      { name: '维持', value: totals['维持'], color: '#2563EB' },
      { name: '损耗', value: totals['损耗'], color: '#EF4444' },
      { name: '未入账', value: unreconciledMinutes, color: '#D1D5DB' },
    ].filter(d => d.value > 0);

    return data.length === 0 ? [{ name: '空', value: 1, color: '#D1D5DB' }] : data;
  }, [filteredEntries, unreconciledMinutes]);

  const coveragePercent = totalPossibleMinutes > 0 ? Math.min(100, Math.round((loggedMinutes / totalPossibleMinutes) * 100)) : 100;

  // 4. 计算待对账缺口（按日拆分逻辑）
  const gaps = useMemo(() => {
    const periodGaps: { date: number, start: string, end: string, duration: string, fullDate: string }[] = [];
    const now = Date.now();
    let iter = new Date(periodRange.start);
    const endLimit = new Date(periodRange.end);

    while (iter <= endLimit && iter.getTime() <= now) {
      const dayStart = new Date(iter).setHours(0,0,0,0);
      const dayEnd = Math.min(new Date(iter).setHours(23,59,59,999), now);
      
      const dayEntries = filteredEntries
        .filter(e => e.startTime >= dayStart && e.startTime <= dayEnd)
        .sort((a, b) => a.startTime - b.startTime);

      let lastTime = dayStart;
      
      const formatGap = (s: number, e: number) => ({
        date: s,
        fullDate: `${String(new Date(s).getMonth() + 1).padStart(2, '0')}/${String(new Date(s).getDate()).padStart(2, '0')}`,
        start: new Date(s).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        end: new Date(e).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        duration: ((e - s) / 3600000).toFixed(1) + 'h'
      });

      dayEntries.forEach(e => {
        if (e.startTime - lastTime > 15 * 60000) {
          periodGaps.push(formatGap(lastTime, e.startTime));
        }
        lastTime = Math.max(lastTime, e.endTime);
      });

      if (dayEnd - lastTime > 15 * 60000) {
        periodGaps.push(formatGap(lastTime, dayEnd));
      }
      iter.setDate(iter.getDate() + 1);
    }
    return periodGaps.reverse();
  }, [filteredEntries, periodRange]);

  const handleReconcile = (date: number) => {
    setSelectedDate(date);
    setActiveMainTab('time');
  };

  // --- 条件渲染：待对账界面 ---
  if (showUnreconciled) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="px-6 py-4 flex items-center bg-white border-b border-gray-50">
          <button onClick={() => setShowUnreconciled(false)} className="text-blue-500 font-medium">
            <i className="fas fa-chevron-left mr-1"></i> 返回
          </button>
          <h1 className="flex-1 text-center font-bold text-gray-800 pr-10">待对账：{periodRange.label}</h1>
        </header>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl flex flex-col items-center">
            <span className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mb-2">周期累计未对账</span>
            <div className="text-6xl font-black italic">{(unreconciledMinutes / 60).toFixed(1)}<span className="text-2xl ml-1">h</span></div>
          </div>
          <div className="space-y-4">
            <h3 className="text-gray-400 font-bold text-xs uppercase tracking-widest px-2">需补全的日期清单</h3>
            {gaps.length > 0 ? gaps.map((gap, i) => (
              <div key={i} className="bg-white p-5 rounded-[2rem] flex items-center justify-between border border-gray-100 shadow-sm active:scale-[0.98] transition-transform">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-50 rounded-2xl flex flex-col items-center justify-center text-orange-500">
                    <span className="text-[10px] font-black">{gap.fullDate}</span>
                  </div>
                  <div>
                    <div className="font-black text-gray-800 text-lg">{gap.start} - {gap.end}</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase">缺失 {gap.duration}</div>
                  </div>
                </div>
                <button onClick={() => handleReconcile(gap.date)} className="bg-blue-600 text-white font-black px-6 py-2.5 rounded-full text-xs">去填补</button>
              </div>
            )) : <div className="text-center py-20 text-gray-300 font-bold">此阶段已完美对账 ✨</div>}
          </div>
        </div>
      </div>
    );
  }

  // --- 主界面渲染 ---
  return (
    <div className="min-h-screen bg-white pb-24 flex flex-col">
      <div className="relative flex flex-col items-center py-6">
        <button 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 bg-gray-50 px-5 py-2.5 rounded-full text-gray-500 font-bold text-sm shadow-sm"
        >
          <i className="far fa-calendar-alt"></i>
          <span className="whitespace-nowrap">{periodRange.label}</span>
          <i className={`fas fa-caret-down text-gray-300 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}></i>
        </button>

        {isDropdownOpen && (
          <div className="absolute top-16 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[60] p-4">
            <div className="text-[10px] text-gray-400 font-bold uppercase mb-3 tracking-widest">选择 {activeTab}</div>
            <div className="space-y-1 max-h-60 overflow-y-auto no-scrollbar">
              {activeTab === '周' && Array.from({ length: 12 }, (_, i) => {
                const d = new Date(); d.setDate(d.getDate() - (i * 7));
                return (
                  <button key={i} onClick={() => { setSelectedDate(d.getTime()); setIsDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-gray-600 hover:bg-blue-50 rounded-lg">
                    {d.getFullYear()}年 第{getWeekNumber(d)}周
                  </button>
                );
              })}
              {activeTab === '月' && Array.from({ length: 12 }, (_, i) => {
                const d = new Date(); d.setMonth(d.getMonth() - i);
                return (
                  <button key={i} onClick={() => { setSelectedDate(d.getTime()); setIsDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-gray-600 hover:bg-blue-50 rounded-lg">
                    {d.getFullYear()}年{String(d.getMonth() + 1).padStart(2, '0')}月
                  </button>
                );
              })}
              {activeTab === '年' && [0, 1, 2].map(offset => (
                <button key={offset} onClick={() => { setSelectedDate(new Date(new Date().getFullYear() - offset, 0, 1).getTime()); setIsDropdownOpen(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-gray-600 hover:bg-blue-50 rounded-lg">
                  {new Date().getFullYear() - offset}年
                </button>
              ))}
              {activeTab === '自定义' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="bg-gray-50 rounded-lg p-2 text-xs font-bold" />
                    <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="bg-gray-50 rounded-lg p-2 text-xs font-bold" />
                  </div>
                  <button onClick={() => setIsDropdownOpen(false)} className="w-full p-2 bg-blue-600 text-white rounded-lg text-xs font-bold">应用范围</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="px-6 mb-6">
        <div className="bg-gray-100 p-1 rounded-2xl flex">
          {(['周', '月', '年', '自定义'] as const).map((tab) => (
            <button key={tab} onClick={() => { setActiveTab(tab); setIsDropdownOpen(false); }} className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-4 no-scrollbar">
        <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
          <div className="h-64 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={75} outerRadius={95} paddingAngle={0} dataKey="value" stroke="none">
                  {categoryData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-black text-gray-800">{(loggedMinutes / 60).toFixed(0)}h</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">记录时长</span>
            </div>
          </div>
        </section>

        <section className="bg-blue-50 rounded-[2.5rem] p-6 border border-blue-100 flex items-center justify-between">
          <div>
            <h3 className="text-blue-600 font-black text-xl mb-1">对账率：{coveragePercent}%</h3>
            <p className="text-blue-400 text-xs font-medium mb-3">当前还有 {(unreconciledMinutes / 60).toFixed(1)}h 缺失</p>
            <button onClick={() => setShowUnreconciled(true)} className="bg-blue-600 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase">管理待对账</button>
          </div>
          <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-blue-600 shadow-inner"><i className="fas fa-tasks text-2xl"></i></div>
        </section>

        <div className="pt-4 pb-8">
          <h3 className="text-gray-800 font-black text-xl mb-6">账本明细</h3>
          <div className="space-y-3">
            {filteredEntries.length > 0 ? (
                [...filteredEntries].reverse().slice(0, 15).map((entry) => <DetailItem key={entry.id} entry={entry} />)
            ) : <div className="text-center py-10 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100 text-gray-400 text-sm font-medium">该周期内暂无记录</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailItem: React.FC<{ entry: TimeEntry }> = ({ entry }) => {
  const h = (entry.duration / 60).toFixed(1);
  const colorClass = entry.category === '投资' ? 'text-green-500' : entry.category === '维持' ? 'text-blue-600' : 'text-red-500';
  const icon = entry.category === '投资' ? 'fa-rocket' : entry.category === '维持' ? 'fa-tools' : 'fa-trash';
  return (
    <div className="bg-white p-4 rounded-[2rem] flex items-center justify-between border border-gray-50 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center ${colorClass}`}><i className={`fas ${icon} text-xl`}></i></div>
        <div className="overflow-hidden">
          <div className="font-black text-gray-800 truncate max-w-[200px]">{entry.title}</div>
          <div className="text-[10px] text-gray-400 font-bold">{new Date(entry.startTime).toLocaleDateString([], { month: '2-digit', day: '2-digit' })} · {entry.category}</div>
        </div>
      </div>
      <div className="font-black text-gray-800 text-lg">+{h}h</div>
    </div>
  );
};