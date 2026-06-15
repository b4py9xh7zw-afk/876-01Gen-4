import { useState } from 'react';
import {
  Outlet,
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  FileText,
  BookOpen,
  ClipboardList,
  HelpCircle,
  Users,
  BarChart3,
  LogOut,
  ChevronDown,
  User,
  ChevronRight,
  Building2,
  type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import { ROLE_MAP, type UserRole } from '@shared/types';
import { Badge } from '@/components/UI/Badge';

interface MenuItem {
  path: string;
  label: string;
  icon: LucideIcon;
  roles?: UserRole[];
}

const menuItems: MenuItem[] = [
  {
    path: '/dashboard',
    label: '工作台',
    icon: LayoutDashboard,
    roles: ['super_admin', 'compliance_officer', 'dept_manager', 'employee'],
  },
  {
    path: '/exams',
    label: '测验中心',
    icon: FileText,
    roles: ['super_admin', 'compliance_officer', 'dept_manager', 'employee'],
  },
  {
    path: '/records',
    label: '学习记录',
    icon: BookOpen,
    roles: ['super_admin', 'compliance_officer', 'dept_manager', 'employee'],
  },
  {
    path: '/admin/exams',
    label: '测验管理',
    icon: ClipboardList,
    roles: ['super_admin', 'compliance_officer'],
  },
  {
    path: '/admin/questions',
    label: '题库管理',
    icon: HelpCircle,
    roles: ['super_admin', 'compliance_officer'],
  },
  {
    path: '/admin/positions',
    label: '岗位管理',
    icon: Building2,
    roles: ['super_admin'],
  },
  {
    path: '/admin/users',
    label: '用户管理',
    icon: Users,
    roles: ['super_admin'],
  },
  {
    path: '/admin/reports',
    label: '审计报表',
    icon: BarChart3,
    roles: ['super_admin', 'compliance_officer'],
  },
];

const breadcrumbMap: Record<string, string[]> = {
  '/dashboard': ['工作台'],
  '/exams': ['测验中心'],
  '/records': ['学习记录'],
  '/admin/exams': ['管理中心', '测验管理'],
  '/admin/questions': ['管理中心', '题库管理'],
  '/admin/positions': ['管理中心', '岗位管理'],
  '/admin/users': ['管理中心', '用户管理'],
  '/admin/reports': ['管理中心', '审计报表'],
};

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const filteredMenuItems = menuItems.filter(
    (item) => user && item.roles?.includes(user.role)
  );

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const breadcrumbs = breadcrumbMap[location.pathname] || ['首页'];

  return (
    <div className="flex h-screen bg-brand-50">
      <aside className="w-[260px] shrink-0 bg-gradient-brand flex flex-col relative">
        <div className="absolute inset-0 bg-noise opacity-20 pointer-events-none" />

        <div className="relative z-10 p-6 border-b border-brand-600/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gold-500/20 border border-gold-400/40 flex items-center justify-center">
              <Shield className="w-6 h-6 text-gold-400" strokeWidth={1.8} />
            </div>
            <div>
              <div className="font-serif font-bold text-gold-400 text-lg leading-tight">
                合规测评
              </div>
              <div className="text-brand-300 text-xs mt-0.5">
                Compliance Platform
              </div>
            </div>
          </div>
        </div>

        <div className="gold-line my-0" />

        <nav className="relative z-10 flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            const isAdmin = item.path.startsWith('/admin');
            const showDivider =
              item.path === '/dashboard' || item.path === '/admin/exams';

            return (
              <div key={item.path}>
                {showDivider && isAdmin && (
                  <div className="px-3 py-3 text-xs text-brand-400 font-medium tracking-wider">
                    管理功能
                  </div>
                )}
                <Link
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-gold-500/20 text-gold-300 border border-gold-400/30'
                      : 'text-brand-200 hover:bg-brand-600/40 hover:text-white'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-5 h-5',
                      isActive ? 'text-gold-400' : ''
                    )}
                  />
                  <span>{item.label}</span>
                  {isActive && (
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  )}
                </Link>
              </div>
            );
          })}
        </nav>

        <div className="relative z-10 p-4 border-t border-brand-600/30">
          <div className="rounded-xl bg-brand-800/60 backdrop-blur-sm p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-sm font-medium truncate">
                  {user?.realName || '用户'}
                </div>
                <div className="text-brand-300 text-xs truncate">
                  {user?.department || '-'}
                </div>
              </div>
            </div>
            <div className="mb-3">
              <Badge
                variant="gold"
                className="w-full justify-center bg-gold-500/20 text-gold-300"
              >
                {user ? ROLE_MAP[user.role] : ''}
              </Badge>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-brand-200 hover:bg-brand-700/50 hover:text-white transition-all text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>退出登录</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-brand-100 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-2 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb} className="flex items-center gap-2">
                {index > 0 && (
                  <ChevronRight className="w-4 h-4 text-brand-300" />
                )}
                <span
                  className={cn(
                    index === breadcrumbs.length - 1
                      ? 'text-brand-700 font-medium'
                      : 'text-brand-400'
                  )}
                >
                  {crumb}
                </span>
              </div>
            ))}
          </div>

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-brand-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-medium text-brand-700">
                {user?.realName}
              </span>
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-brand-400 transition-transform',
                  userMenuOpen && 'rotate-180'
                )}
              />
            </button>

            {userMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-white shadow-card-hover border border-brand-100 py-2 z-20 animate-fade-in">
                  <div className="px-4 py-3 border-b border-brand-50">
                    <div className="text-sm font-medium text-brand-700">
                      {user?.realName}
                    </div>
                    <div className="text-xs text-brand-400 mt-0.5">
                      {user?.username}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-brand-600 hover:bg-brand-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>退出登录</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
