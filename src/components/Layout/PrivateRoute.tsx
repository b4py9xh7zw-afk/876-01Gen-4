import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Lock, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/UI/Button';
import type { UserRole } from '@shared/types';

interface PrivateRouteProps {
  children: React.ReactNode;
  reqRoles?: UserRole[];
}

export default function PrivateRoute({ children, reqRoles }: PrivateRouteProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasRole = useAuthStore((s) => s.hasRole);
  const fetchCurrentUser = useAuthStore((s) => s.fetchCurrentUser);
  const user = useAuthStore((s) => s.user);

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      fetchCurrentUser().finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, [isAuthenticated, fetchCurrentUser]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-50">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-gold-500" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-brand-400 text-sm">正在验证身份...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (reqRoles && reqRoles.length > 0 && !hasRole(reqRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-50 p-6">
        <div className="max-w-md w-full text-center animate-fade-in">
          <div className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-red-50 border-2 border-red-100 flex items-center justify-center">
            <ShieldAlert className="w-12 h-12 text-red-500" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-brand-700 mb-3">
            403 - 访问受限
          </h1>
          <p className="text-brand-400 mb-2">
            抱歉，您没有权限访问此页面
          </p>
          <p className="text-brand-300 text-sm mb-8">
            当前用户：{user?.realName}（{user?.role}）
            <br />
            如需访问，请联系系统管理员
          </p>
          <div className="flex items-center justify-center gap-4">
            <Lock className="w-5 h-5 text-gold-400" />
            <span className="text-xs text-brand-400 tracking-wider">
              COMPLIANCE PLATFORM - ACCESS CONTROL
            </span>
            <Lock className="w-5 h-5 text-gold-400" />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
