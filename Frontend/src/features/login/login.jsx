import React, { useState } from 'react';
import { Lock, User, LogIn, AlertCircle } from 'lucide-react';
import { login } from '../../api/auth';
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Logic for authentication would go here
    try {
      console.log('Logging in with:', formData);
      const userData = await login(formData.username, formData.password);
      const token = userData.token;
      navigate('/Dashboard');
    } catch (err) {
      setError('اسم المستخدم أو كلمة المرور غير صحيحة');
      alert('Login failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = `
    w-full pr-10 pl-4 py-3 bg-appMuted border border-appBorder rounded-xl 
    text-sm text-appText placeholder:text-slate-400 
    focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand 
    transition-all duration-200
  `;

  return (
    <div className="min-h-screen bg-appMuted flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-[420px]">
        {/* Logo / Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand rounded-2xl shadow-lg shadow-brand/20 mb-4">
            <LogIn className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-extrabold font-display text-appText">تسجيل الدخول</h1>
          <p className="text-appSubtext text-sm mt-2">مرحباً بك مجدداً في نظام إدارة المهام</p>
        </div>

        {/* Main Card */}
        <div className="bg-appSurface rounded-2xl border border-appBorder p-8 shadow-panel">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs animate-in fade-in slide-in-from-top-1">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            {/* Username Input */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-2 mr-1">
                اسم المستخدم
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-appSubtext">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  name="username"
                  className={inputCls}
                  placeholder="أدخل اسم المستخدم"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-appSubtext mb-2 mr-1">
                كلمة المرور
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-appSubtext">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  name="password"
                  className={inputCls}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Remember Me / Forgot Pass (Optional UI helpers) */}
            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-appBorder text-brand focus:ring-brand" />
                <span className="text-xs text-appSubtext">تذكرني</span>
              </label>
              <button type="button" className="text-xs font-medium text-brand hover:underline">
                نسيت كلمة المرور؟
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              onClick={handleSubmit}
              className={`
                w-full py-3.5 bg-brand text-white text-sm font-bold rounded-xl 
                shadow-sm hover:bg-brandDeep active:scale-[0.98] 
                transition-all flex items-center justify-center gap-2
                ${loading ? 'opacity-70 cursor-not-allowed' : ''}
              `}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'تسجيل الدخول'
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-appSubtext mt-8">
          &copy; {new Date().getFullYear()} نظام إدارة الموارد البشرية. جميع الحقوق محفوظة.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;