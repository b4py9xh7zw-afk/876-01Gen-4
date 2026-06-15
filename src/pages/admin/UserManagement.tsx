import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
  Filter,
  AlertTriangle,
  User,
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/UI';
import api from '@/services/api';
import { getRoleName } from '@/utils/format';
import type { User as UserType, UserRole } from '@shared/types';

export default function UserManagement() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [filters, setFilters] = useState({
    keyword: '',
    role: '' as UserRole | '',
    department: '',
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: Parameters<typeof api.admin.getUsers>[0] = {
        page,
        pageSize,
      };
      if (filters.keyword) params.keyword = filters.keyword;
      if (filters.role) params.role = filters.role;
      if (filters.department) params.department = filters.department;

      const result = await api.admin.getUsers(params);
      setUsers(result.list);
      setTotal(result.total);
    } catch (error) {
      console.error('获取用户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    fetchUsers();
  };

  const handleReset = () => {
    setFilters({
      keyword: '',
      role: '',
      department: '',
    });
    setPage(1);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-brand-700 mb-2">用户管理</h1>
          <p className="text-brand-400">管理系统用户和权限</p>
        </div>
        <Button variant="gold">
          <Plus className="w-4 h-4" />
          新建用户
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gold-500" />
            筛选条件
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-600 mb-1.5">关键词搜索</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
                <input
                  type="text"
                  placeholder="搜索用户名、姓名..."
                  value={filters.keyword}
                  onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                  className="w-full pl-10 pr-4 h-10 rounded-lg border border-brand-200 bg-white text-sm text-brand-700 placeholder-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-600 mb-1.5">角色</label>
              <select
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value as UserRole | '' })}
                className="w-full px-4 h-10 rounded-lg border border-brand-200 bg-white text-sm text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
              >
                <option value="">全部角色</option>
                <option value="super_admin">超级管理员</option>
                <option value="compliance_officer">合规管理员</option>
                <option value="dept_manager">部门管理员</option>
                <option value="employee">普通员工</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-600 mb-1.5">部门</label>
              <input
                type="text"
                placeholder="输入部门名称..."
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                className="w-full px-4 h-10 rounded-lg border border-brand-200 bg-white text-sm text-brand-700 placeholder-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={handleReset}>
              重置
            </Button>
            <Button onClick={handleSearch}>查询</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">用户名</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">姓名</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">部门</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">岗位</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">角色</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">是否高风险</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">状态</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-brand-400">
                      加载中...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-brand-400">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      暂无用户数据
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b border-brand-50 hover:bg-brand-50/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-medium text-brand-700">{user.username}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-brand-700 font-medium">
                        {user.realName}
                      </td>
                      <td className="py-4 px-4 text-sm text-brand-600">{user.department}</td>
                      <td className="py-4 px-4 text-sm text-brand-600">
                        {user.positionName || '-'}
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="gold">{getRoleName(user.role)}</Badge>
                      </td>
                      <td className="py-4 px-4">
                        {user.isHighRisk ? (
                          <Badge variant="danger" className="flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" />
                            高风险
                          </Badge>
                        ) : (
                          <span className="text-sm text-brand-500">否</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={user.status === 'active' ? 'success' : 'danger'}>
                          {user.status === 'active' ? '正常' : '已禁用'}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <Button variant="secondary" size="sm">
                          <Edit className="w-4 h-4" />
                          编辑
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {total > 0 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-brand-100">
              <p className="text-sm text-brand-500">
                共 <span className="font-medium text-brand-700">{total}</span> 条记录
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        page === pageNum
                          ? 'bg-brand-700 text-white'
                          : 'text-brand-600 hover:bg-brand-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
