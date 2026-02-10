import React, { useState, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { TimePreset } from '../../types';

type ProfileView = 'main' | 'presets' | 'export' | 'edit-preset';

export const ProfilePage: React.FC = () => {
  const [currentView, setCurrentView] = useState<ProfileView>('main');
  const [editingPreset, setEditingPreset] = useState<Partial<TimePreset> | null>(null);

  const navigateTo = (view: ProfileView) => setCurrentView(view);

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      {currentView === 'main' && <MainProfileView onNavigate={navigateTo} />}
      {currentView === 'presets' && (
        <FixedDurationPresetsView 
          onBack={() => navigateTo('main')} 
          onEditPreset={(p) => { setEditingPreset(p); navigateTo('edit-preset'); }}
        />
      )}
      {currentView === 'export' && <ExportDataView onBack={() => navigateTo('main')} />}
      {currentView === 'edit-preset' && (
        <EditPresetModal
          preset={editingPreset!}
          onBack={() => navigateTo('presets')}
        />
      )}
    </div>
  );
};

const MainProfileView = ({ onNavigate }: { onNavigate: (v: ProfileView) => void }) => {
  const { user, updateUser, logout, isLoggedIn } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(user?.name || '');

  const handleAvatarClick = () => {
    if (!isLoggedIn) return; // 未登录时不允许修改头像
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        updateUser({ avatar: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      updateUser({ name: tempName.trim() });
      setIsEditingName(false);
    }
  };

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      logout();
    }
  };

  return (
    <div className="pb-24">
      <header className="px-6 py-8 flex flex-col items-center bg-white border-b border-gray-50 relative">
        <h1 className="text-lg font-bold text-gray-800">个人中心</h1>
        
        <div className="mt-8 flex flex-col items-center">
          <div 
            onClick={handleAvatarClick}
            className={`w-20 h-20 rounded-full overflow-hidden border-2 border-white shadow-sm mb-4 relative group transition-transform ${isLoggedIn ? 'cursor-pointer active:scale-95' : 'cursor-default'}`}
          >
            <img 
              src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} 
              alt="Avatar" 
              className="w-full h-full bg-blue-50 object-cover" 
            />
            {isLoggedIn && (
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <i className="fas fa-camera text-white text-xs"></i>
              </div>
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
          
          {/* 昵称编辑功能 - 仅登录后可用 */}
          {isLoggedIn ? (
            isEditingName ? (
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="bg-gray-50 border-none rounded-xl px-3 py-1 text-lg font-bold text-gray-900 text-center focus:ring-2 focus:ring-blue-500 w-40"
                  autoFocus
                />
                <button onClick={handleSaveName} className="text-blue-500 text-sm font-bold">
                  <i className="fas fa-check"></i>
                </button>
                <button onClick={() => setIsEditingName(false)} className="text-gray-400 text-sm font-bold">
                  <i className="fas fa-times"></i>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-gray-900">{user?.name || '用户名'}</h2>
                <button 
                  onClick={() => setIsEditingName(true)}
                  className="text-blue-500 text-sm"
                >
                  <i className="fas fa-edit"></i>
                </button>
              </div>
            )
          ) : (
            <h2 className="text-xl font-bold text-gray-900 mb-1">{user?.name || '未登录'}</h2>
          )}
          
          {/* 邮箱显示 - 仅登录后显示 */}
          {isLoggedIn && user?.email && (
            <p className="text-gray-400 text-xs font-bold mb-1">{user.email}</p>
          )}
          
          <p className="text-gray-400 text-xs mt-1">ID: {user?.id || '未登录'}</p>
        </div>
      </header>

      <div className="px-6 mt-6 space-y-4">
        {/* 仅登录后显示功能板块 */}
        {isLoggedIn && (
          <>
            <section className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-50">
              <MenuItem 
                icon="fa-stopwatch" 
                label="固定时长预设" 
                subLabel="管理睡眠、用餐及自定义预设" 
                color="bg-orange-500" 
                onClick={() => onNavigate('presets')} 
              />
            </section>

            <section className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-50">
              <div className="text-[10px] font-bold text-gray-300 uppercase px-6 pt-4 tracking-widest">数据中心</div>
              <MenuItem 
                icon="fa-file-export" 
                label="导出数据" 
                color="bg-green-500" 
                onClick={() => onNavigate('export')} 
              />
            </section>
          </>
        )}

        {/* 登录/退出按钮 */}
        <div className="mt-8">
          {isLoggedIn ? (
            <button 
              onClick={handleLogout}
              className="w-full py-5 text-rose-500 font-bold bg-white rounded-3xl shadow-sm border border-gray-50 active:scale-95 transition-all"
            >
              <i className="fas fa-sign-out-alt mr-2"></i>
              退出登录
            </button>
          ) : (
            <button 
              className="w-full py-5 text-blue-500 font-bold bg-white rounded-3xl shadow-sm border border-gray-50 active:scale-95 transition-all"
            >
              <i className="fas fa-sign-in-alt mr-2"></i>
              立即登录
            </button>
          )}
        </div>
        
        <p className="text-center text-gray-300 text-[10px] mt-8 font-medium">时光账本 v1.2.4</p>
      </div>
    </div>
  );
};

// 以下代码一字未动
const FixedDurationPresetsView = ({ onBack, onEditPreset }: { onBack: () => void, onEditPreset: (p: Partial<TimePreset>) => void }) => {
  const { presets } = useStore();

  return (
    <div className="flex flex-col h-screen bg-[#F8F9FB]">
      <header className="px-6 py-4 flex items-center justify-between bg-white border-b border-gray-50">
        <button onClick={onBack} className="text-blue-500"><i className="fas fa-chevron-left"></i> 返回</button>
        <h1 className="font-bold text-gray-800">固定时长预设</h1>
        <button onClick={() => onEditPreset({ title: '', category: '维持', startTimeStr: '00:00', endTimeStr: '01:00', tags: [] })} className="text-blue-500 text-xl">
          <i className="fas fa-plus-circle"></i>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 pb-24">
        {presets.map(preset => (
          <div key={preset.id} className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-gray-50 flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer" onClick={() => onEditPreset(preset)}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg ${preset.category === '投资' ? 'bg-blue-500' : preset.category === '损耗' ? 'bg-rose-500' : 'bg-indigo-500'}`}>
                <i className={`fas ${preset.category === '投资' ? 'fa-rocket' : preset.category === '损耗' ? 'fa-trash' : 'fa-tools'}`}></i>
              </div>
              <div>
                <div className="font-black text-gray-800">{preset.title}</div>
                <div className="text-[10px] text-gray-400 font-bold">
                  {preset.startTimeStr} - {preset.endTimeStr} · {preset.category}
                </div>
              </div>
            </div>
            <i className="fas fa-chevron-right text-gray-200"></i>
          </div>
        ))}
        {presets.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-300 font-medium">暂无预设项目</p>
          </div>
        )}
        <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 flex gap-4 mt-4">
          <i className="fas fa-info-circle text-blue-400 mt-1"></i>
          <div>
            <h4 className="font-bold text-blue-600 text-sm mb-1">关于固定时长</h4>
            <p className="text-[10px] text-blue-400 leading-relaxed font-medium">固定时长项目在对应时间段会自动出现在时间轴补账建议中。您可以自由添加常用的生活周期模板。</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditPresetModal = ({ preset, onBack }: { preset: Partial<TimePreset>, onBack: () => void }) => {
  const { addPreset, updatePreset, deletePreset } = useStore();
  const [formData, setFormData] = useState({
    title: preset.title || '',
    category: preset.category || '维持',
    startTimeStr: preset.startTimeStr || '00:00',
    endTimeStr: preset.endTimeStr || '01:00',
    tags: preset.tags || []
  });

  const handleSave = () => {
    if (!formData.title) return;
    if (preset.id) {
      updatePreset(preset.id, formData);
    } else {
      addPreset(formData);
    }
    onBack();
  };

  const handleDelete = () => {
    if (preset.id) {
      deletePreset(preset.id);
      onBack();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-between items-center mb-8">
          <button onClick={onBack} className="text-gray-400 font-bold">取消</button>
          <h2 className="text-gray-900 font-black text-xl">{preset.id ? '编辑预设' : '添加预设'}</h2>
          <button onClick={handleSave} className="text-blue-500 font-bold">完成</button>
        </div>
        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-bold text-gray-300 uppercase block mb-2 px-1">预设名称</label>
            <input 
              type="text" 
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="例如：早起晨跑"
              className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-gray-800"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-300 uppercase block mb-2 px-1">开始时间</label>
              <input 
                type="time" 
                value={formData.startTimeStr}
                onChange={e => setFormData({ ...formData, startTimeStr: e.target.value })}
                className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-gray-800"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-300 uppercase block mb-2 px-1">结束时间</label>
              <input 
                type="time" 
                value={formData.endTimeStr}
                onChange={e => setFormData({ ...formData, endTimeStr: e.target.value })}
                className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold text-gray-800"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-300 uppercase block mb-2 px-1">所属分类</label>
            <div className="bg-gray-50 rounded-2xl p-2 flex gap-2">
              {(['投资', '维持', '损耗'] as const).map(cat => (
                <button 
                  key={cat}
                  onClick={() => setFormData({ ...formData, category: cat })}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${formData.category === cat ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          {preset.id && (
            <button onClick={handleDelete} className="w-full py-4 text-rose-500 font-bold bg-rose-50 rounded-2xl mt-4">
              删除此预设
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ExportDataView = ({ onBack }: { onBack: () => void }) => {
  const [exportRange, setExportRange] = useState<'selected' | 'all'>('selected');
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>('2026-01-24');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsGenerating(false);

    if (navigator.share) {
      try {
        await navigator.share({
          title: '时光账本数据导出',
          text: `这是我在 ${exportRange === 'selected' ? `${startDate}至${endDate}` : '全部'} 期间的时间账本记录。`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled or failed', err);
      }
    } else {
      const shareOverlay = document.createElement('div');
      shareOverlay.className = "fixed inset-0 bg-black/80 z-[200] flex flex-col items-center justify-center p-10 text-center animate-in fade-in duration-300";
      shareOverlay.innerHTML = `
        <i class="fab fa-weixin text-green-500 text-6xl mb-6"></i>
        <h3 class="text-white text-xl font-bold mb-2">准备分享到微信</h3>
        <p class="text-gray-400 text-sm mb-8">数据已封装为 ${format.toUpperCase()} 格式，点击右上角或长按发送给好友。</p>
        <button id="close-share" class="px-8 py-3 bg-white text-gray-900 rounded-full font-bold">我知道了</button>
      `;
      document.body.appendChild(shareOverlay);
      document.getElementById('close-share')?.addEventListener('click', () => {
        document.body.removeChild(shareOverlay);
      });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#F8F9FB]">
      <header className="px-6 py-4 flex items-center justify-between bg-white border-b border-gray-50">
        <button onClick={onBack} className="text-blue-500"><i className="fas fa-chevron-left"></i> 返回</button>
        <h1 className="font-bold text-gray-800">导出账本数据</h1>
        <div className="w-10"></div>
      </header>

      <div className="flex-1 p-6 space-y-6 flex flex-col overflow-y-auto pb-10">
        <section>
          <div className="text-[10px] font-bold text-gray-400 uppercase mb-3 px-1">导出范围</div>
          <div className="space-y-3">
            <div 
              onClick={() => setExportRange('selected')}
              className={`w-full bg-white rounded-3xl p-5 shadow-sm border-2 transition-all flex flex-col gap-4 ${exportRange === 'selected' ? 'border-blue-500' : 'border-transparent'}`}
            >
              <div className="flex justify-between items-center w-full">
                <div className="text-left">
                  <div className="font-bold text-gray-800">指定时间范围</div>
                  <div className="text-[10px] text-blue-400 font-bold mt-0.5">选择起始与结束日期</div>
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${exportRange === 'selected' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                  {exportRange === 'selected' && <i className="fas fa-check text-[10px]"></i>}
                </div>
              </div>
              
              {exportRange === 'selected' && (
                <div className="grid grid-cols-2 gap-3 animate-in fade-in zoom-in-95 duration-200">
                  <div>
                    <label className="text-[9px] font-bold text-gray-300 uppercase block mb-1 px-1">开始日期</label>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-gray-300 uppercase block mb-1 px-1">结束日期</label>
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold text-gray-700"
                    />
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => setExportRange('all')}
              className={`w-full bg-white rounded-3xl p-5 shadow-sm border-2 transition-all flex justify-between items-center ${exportRange === 'all' ? 'border-blue-500' : 'border-transparent'}`}
            >
              <div className="text-left">
                <div className="font-bold text-gray-800">导出全部数据</div>
                <div className="text-[10px] text-gray-400 font-bold mt-0.5">包含账户创建至今的所有记录</div>
              </div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${exportRange === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                {exportRange === 'all' && <i className="fas fa-check text-[10px]"></i>}
              </div>
            </button>
          </div>
        </section>

        <section>
          <div className="text-[10px] font-bold text-gray-400 uppercase mb-3 px-1">数据格式</div>
          <div className="space-y-3">
            <button 
              onClick={() => setFormat('csv')}
              className={`w-full bg-white p-5 rounded-3xl flex items-center justify-between border-2 transition-all shadow-sm ${format === 'csv' ? 'border-blue-500 shadow-blue-50' : 'border-transparent'}`}
            >
              <div className="flex items-center gap-4 text-left">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${format === 'csv' ? 'bg-green-50 text-green-500' : 'bg-gray-50 text-gray-300'}`}>
                  <i className="fas fa-file-csv"></i>
                </div>
                <div>
                  <div className="font-black text-gray-800">CSV 原始数据</div>
                  <div className="text-[10px] text-gray-400 font-medium">适用于 Excel 与 深度分析</div>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${format === 'csv' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                {format === 'csv' && <i className="fas fa-check text-[10px]"></i>}
              </div>
            </button>
            <button 
              onClick={() => setFormat('json')}
              className={`w-full bg-white p-5 rounded-3xl flex items-center justify-between border-2 transition-all shadow-sm ${format === 'json' ? 'border-blue-500 shadow-blue-50' : 'border-transparent'}`}
            >
              <div className="flex items-center gap-4 text-left">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${format === 'json' ? 'bg-blue-50 text-blue-500' : 'bg-gray-50 text-gray-300'}`}>
                  <i className="fas fa-code"></i>
                </div>
                <div>
                  <div className="font-black text-gray-800">JSON 开发格式</div>
                  <div className="text-[10px] text-gray-400 font-medium">适用于开发者导入其他应用</div>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${format === 'json' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                {format === 'json' && <i className="fas fa-check text-[10px]"></i>}
              </div>
            </button>
          </div>
        </section>

        <div className="mt-auto pt-8">
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-6 bg-blue-600 text-white font-black rounded-[2.5rem] shadow-2xl shadow-blue-100 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <i className="fas fa-circle-notch fa-spin"></i>
            ) : (
              <i className="fab fa-weixin"></i>
            )}
            {isGenerating ? '正在生成...' : '生成并分享到微信'}
          </button>
          <p className="text-center text-gray-300 text-[8px] mt-4 font-bold uppercase tracking-widest">TimeLedger 隐私安全保护</p>
        </div>
      </div>
    </div>
  );
};

const MenuItem = ({ icon, label, subLabel, color, onClick }: any) => (
  <button onClick={onClick} className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors group text-left">
    <div className="flex items-center gap-5">
      <div className={`w-12 h-12 ${color} text-white rounded-2xl flex items-center justify-center text-xl shadow-lg shadow-gray-100 group-active:scale-90 transition-transform`}>
        <i className={`fas ${icon}`}></i>
      </div>
      <div>
        <div className="font-bold text-gray-800 text-base">{label}</div>
        {subLabel && <div className="text-[10px] text-gray-400 font-medium mt-0.5">{subLabel}</div>}
      </div>
    </div>
    <i className="fas fa-chevron-right text-gray-200 text-sm group-hover:translate-x-1 transition-transform"></i>
  </button>
);