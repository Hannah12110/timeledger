import React, { useState } from 'react';
import { useStore } from '../store/useStore';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const login = useStore((state) => state.login);
  const register = useStore((state) => state.register);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return alert('请填写完整信息');
    
    const success = isRegister 
      ? await register(email, password) 
      : await login(email, password);

    if (!success) {
      alert('操作失败，请检查格式（邮箱需包含@，密码至少6位）');
    }
    // 登录成功后，App.tsx 会自动检测 isLoggedIn 变化并显示主应用
    // 不需要手动跳转
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center px-6">
      <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 max-w-md mx-auto w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-indigo-500 rounded-3xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-indigo-100">
            <i className="fas fa-history text-white text-3xl"></i>
          </div>
          <h2 className="text-2xl font-black text-gray-800">时光帐本</h2>
          <p className="text-gray-400 text-sm font-bold mt-1">记录你的每一分钟</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold ml-4">邮箱地址</span>
            <input
              type="email"
              placeholder="example@mail.com"
              className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold ml-4">登录密码</span>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full bg-gray-50 border-none rounded-2xl p-4 font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-100 active:scale-95 transition-transform mt-4"
          >
            {isRegister ? '立即注册' : '开启记录'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs font-bold text-gray-400 hover:text-indigo-500 transition-colors"
          >
            {isRegister ? '已有账号？去登录' : '没有账号？创建新身份'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;