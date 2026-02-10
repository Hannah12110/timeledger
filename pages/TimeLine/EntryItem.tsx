import React from 'react';
import { TimeEntry } from '../../types';
import { CATEGORY_COLORS } from '../../constants';

interface EntryItemProps {
  entry: TimeEntry;
  onDelete: (id: string) => void;
  onEdit: (entry: TimeEntry) => void;
}

export const EntryItem: React.FC<EntryItemProps> = ({ entry, onDelete, onEdit }) => {
  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const start = formatTime(entry.startTime);
  const end = formatTime(entry.endTime);

  const durationStr = entry.duration >= 60 
    ? `${Math.floor(entry.duration / 60)}h ${entry.duration % 60}min`
    : `${entry.duration}min`;

  return (
    <div className="flex gap-4 mb-4 items-start group">
      <div className="w-12 pt-1 text-[11px] font-semibold text-gray-400 text-right tabular-nums">
        {start}
      </div>
      
      <div 
        onClick={() => onEdit(entry)}
        className="flex-1 bg-white px-4 py-3 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-gray-100 transition-all active:scale-[0.98] cursor-pointer relative overflow-hidden"
      >
        <div className="flex justify-between items-center">
          <div className="flex-1">
            {/* 确保这里没有任何图标，保持苹果手机极简风格 */}
            <h3 className="text-gray-900 font-bold text-[15px] leading-tight mb-0.5">{entry.title}</h3>
            <p className="text-[11px] text-gray-400 font-medium">
              {start} - {end} · {durationStr}
            </p>
            {entry.tags && entry.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {entry.tags.map(tag => (
                  <span key={tag} className="text-[9px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">#{tag}</span>
                ))}
              </div>
            )}
          </div>
          <span className={`flex-shrink-0 px-2 py-0.5 rounded-md text-[9px] font-black text-white tracking-tight ${CATEGORY_COLORS[entry.category]}`}>
            {entry.category}
          </span>
        </div>
        
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(entry.id);
          }}
          className="absolute -right-10 group-hover:right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
        >
          <i className="fas fa-trash text-xs"></i>
        </button>
      </div>
    </div>
  );
};