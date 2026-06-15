import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Building2,
  AlertTriangle,
  Award,
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/UI';
import api from '@/services/api';
import type { Position } from '@shared/types';

export default function PositionManagement() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPositions = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getPositions();
      setPositions(data);
    } catch (error) {
      console.error('获取岗位列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-brand-700 mb-2">岗位管理</h1>
          <p className="text-brand-400">管理组织架构中的岗位信息</p>
        </div>
        <Button variant="gold">
          <Plus className="w-4 h-4" />
          新建岗位
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">岗位名</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">部门</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">是否高风险</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">要求及格分</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-brand-400">
                      加载中...
                    </td>
                  </tr>
                ) : positions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-brand-400">
                      <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      暂无岗位数据
                    </td>
                  </tr>
                ) : (
                  positions.map((position) => (
                    <tr key={position.id} className="border-b border-brand-50 hover:bg-brand-50/50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-brand-500" />
                          </div>
                          <span className="text-sm font-medium text-brand-700">{position.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-brand-600">{position.department}</td>
                      <td className="py-4 px-4">
                        {position.isHighRisk ? (
                          <Badge variant="danger" className="flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" />
                            高风险岗位
                          </Badge>
                        ) : (
                          <Badge variant="default">普通岗位</Badge>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-gold-500" />
                          <span className="text-sm font-medium text-brand-700">
                            {position.requiredPassScore} 分
                          </span>
                        </div>
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
        </CardContent>
      </Card>
    </div>
  );
}
