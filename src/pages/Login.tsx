import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/UI/Button';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const testAccounts = [
    { username: 'admin', password: '123456', role: '超级管理员' },
    { username: 'compliance01', password: '123456', role: '合规管理员' },
    { username: 'employee01', password: '123456', role: '普通员工' },
  ];

  const fillAccount = (acc: { username: string; password: string }) => {
    setUsername(acc.username);
    setPassword(acc.password);
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-brand overflow-hidden">
        <div className="absolute inset-0 bg-noise opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900/60 via-transparent to-transparent" />

        <div className="relative z-10 flex flex-col justify-center items-center w-full px-16">
          <div className="mb-10 animate-pulse-slow">
            <div className="w-28 h-28 rounded-2xl border-2 border-gold-500/60 flex items-center justify-center bg-brand-800/40 backdrop-blur-sm">
              <Shield className="w-14 h-14 text-gold-400" strokeWidth={1.5} />
            </div>
          </div>

          <div className="gold-line w-48 mb-8" />

          <h1 className="font-serif text-5xl font-bold text-gold-400 text-center leading-tight mb-5 animate-slide-up">
            企业内控合规
            <br />
            测评平台
          </h1>

          <p className="text-brand-200 text-xl font-serif tracking-[0.3em] mb-10 animate-slide-up">
            合规 · 审慎 · 可追溯
          </p>

          <div className="gold-line w-64 mb-10" />

          <div className="text-brand-300 text-sm leading-relaxed text-center max-w-md animate-fade-in">
            <p className="mb-3">以标准化测评体系强化内部控制</p>
            <p className="mb-3">以全流程审计确保合规可追溯</p>
            <p>以数据驱动洞察风险管理水平</p>
          </div>

          <div className="absolute bottom-10 text-brand-400/60 text-xs">
            © 2025 Compliance Platform. All Rights Reserved.
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-brand-50">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex flex-col items-center mb-10">
            <div className="w-16 h-16 rounded-xl bg-gradient-brand flex items-center justify-center mb-4 shadow-gold">
              <Shield className="w-8 h-8 text-gold-400" strokeWidth={1.5} />
            </div>
            <h2 className="font-serif text-2xl font-bold text-brand-700">
              企业内控合规测评平台
            </h2>
          </div>

          <Card glass className="p-8 shadow-xl">
            <div className="mb-8">
              <h2 className="font-serif text-2xl font-bold text-brand-700 mb-2">
                欢迎登录
              </h2>
              <p className="text-brand-400 text-sm">请输入您的账号和密码</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-100 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <span className="text-sm text-red-600">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-brand-600 mb-2">
                  账号
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-300" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="请输入账号"
                    className="w-full h-12 pl-12 pr-4 rounded-lg border border-brand-200 bg-white text-brand-700 placeholder-brand-300 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-600 mb-2">
                  密码
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-300" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    className="w-full h-12 pl-12 pr-12 rounded-lg border border-brand-200 bg-white text-brand-700 placeholder-brand-300 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-300 hover:text-brand-500 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="gold"
                size="lg"
                loading={loading}
                className="w-full mt-2"
              >
                {loading ? '登录中...' : '登 录'}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-brand-100">
              <p className="text-xs text-brand-400 mb-3">
                测试账号（点击快速填充）：
              </p>
              <div className="space-y-2">
                {testAccounts.map((acc) => (
                  <button
                    key={acc.username}
                    type="button"
                    onClick={() => fillAccount(acc)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-brand-100 hover:border-gold-300 hover:bg-gold-50/30 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-brand-700 group-hover:text-brand-800">
                        {acc.username}
                      </span>
                      <span className="text-xs text-brand-300">/ 123456</span>
                    </div>
                    <Badge variant="gold">{acc.role}</Badge>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
