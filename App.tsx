
import React from 'react';
import { useStore } from './store/useStore';
import { TimePage } from './pages/TimeLine/TimePage';
import { InsightsPage } from './pages/Insights/InsightsPage';
import { ProfilePage } from './pages/Profile/ProfilePage';

const App: React.FC = () => {
  const { activeMainTab, setActiveMainTab } = useStore();

  return (
    <div className="min-h-screen bg-white">
      {/* Content Area */}
      <main>
        {activeMainTab === 'time' && <TimePage />}
        {activeMainTab === 'insights' && <InsightsPage />}
        {activeMainTab === 'profile' && <ProfilePage />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl border-t border-gray-100 px-10 flex items-center justify-between z-50">
        <TabButton 
          isActive={activeMainTab === 'time'} 
          onClick={() => setActiveMainTab('time')} 
          icon="fa-clock" 
          label="时间" 
        />
        <TabButton 
          isActive={activeMainTab === 'insights'} 
          onClick={() => setActiveMainTab('insights')} 
          icon="fa-chart-bar" 
          label="洞察" 
        />
        <TabButton 
          isActive={activeMainTab === 'profile'} 
          onClick={() => setActiveMainTab('profile')} 
          icon="fa-user" 
          label="我的" 
        />
      </nav>
    </div>
  );
};

const TabButton = ({ isActive, onClick, icon, label }: { isActive: boolean, onClick: () => void, icon: string, label: string }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1.5 transition-all ${isActive ? 'text-blue-600' : 'text-gray-300'}`}
  >
    <i className={`${isActive ? 'fas' : 'far'} ${icon} text-xl transition-all ${isActive ? 'scale-110' : ''}`}></i>
    <span className="text-[10px] font-black tracking-tight">{label}</span>
  </button>
);

export default App;
