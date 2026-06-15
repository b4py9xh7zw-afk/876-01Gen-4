import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  BarChart3,
  FileText,
  Users,
  CheckCircle2,
  Award,
  Download,
  Building2,
  ClipboardList,
  UserCheck,
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/UI';
import api from '@/services/api';
import type { ReportSummary } from '@shared/types';

const COLORS = ['#0F2540', '#C9A962', '#2B4566', '#D4AD48', '#536E94', '#DEC070'];

type ViewDimension = 'employee' | 'department' | 'exam';

const mockSummary: ReportSummary = {
  totalExams: 24,
  totalParticipants: 156,
  completionRate: 0.875,
  passRate: 0.794,
  byDepartment: [
    { name: '技术部', total: 45, completed: 42, passed: 35 },
    { name: '市场部', total: 28, completed: 25, passed: 21 },
    { name: '财务部', total: 22, completed: 20, passed: 18 },
    { name: '人力资源部', total: 18, completed: 16, passed: 14 },
    { name: '采购部', total: 25, completed: 22, passed: 17 },
    { name: '法务部', total: 18, completed: 17, passed: 16 },
  ],
  byCategory: [
    { name: '反舞弊', total: 45, completed: 40, passed: 35 },
    { name: '数据安全', total: 38, completed: 34, passed: 30 },
    { name: '采购红线', total: 32, completed: 28, passed: 22 },
    { name: '其他合规', total: 41, completed: 36, passed: 31 },
  ],
  byRiskLevel: {
    highRisk: { total: 58, passed: 42 },
    normal: { total: 98, passed: 82 },
  },
  trend: Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return {
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      completed: Math.floor(Math.random() * 15) + 5,
      passed: Math.floor(Math.random() * 12) + 3,
    };
  }),
};

export default function AdminReports() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [dimension, setDimension] = useState<ViewDimension>('department');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await api.admin.getReportSummary();
        setSummary(data);
      } catch (error) {
        console.error('获取报表数据失败，使用模拟数据:', error);
        setSummary(mockSummary);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const handleExport = () => {
    const headers = ['部门', '总人数', '完成数', '通过数', '完成率', '通过率'];
    const rows = (summary || mockSummary).byDepartment.map((d) => [
      d.name,
      d.total,
      d.completed,
      d.passed,
      `${((d.completed / d.total) * 100).toFixed(1)}%`,
      `${((d.passed / d.total) * 100).toFixed(1)}%`,
    ]);
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `审计报表_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const data = summary || mockSummary;

  const statCards = [
    {
      icon: FileText,
      label: '总测验数',
      value: data.totalExams,
      color: 'text-brand-700',
      bgColor: 'bg-brand-50',
      borderColor: 'border-brand-200',
    },
    {
      icon: Users,
      label: '参与人数',
      value: data.totalParticipants,
      color: 'text-brand-700',
      bgColor: 'bg-brand-50',
      borderColor: 'border-brand-200',
    },
    {
      icon: CheckCircle2,
      label: '完成率',
      value: `${(data.completionRate * 100).toFixed(1)}%`,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    {
      icon: Award,
      label: '通过率',
      value: `${(data.passRate * 100).toFixed(1)}%`,
      color: 'text-gold-600',
      bgColor: 'bg-gold-50',
      borderColor: 'border-gold-200',
    },
  ];

  const riskComparisonData = [
    {
      name: '高风险岗位',
      通过率: (data.byRiskLevel.highRisk.passed / data.byRiskLevel.highRisk.total) * 100,
    },
    {
      name: '普通岗位',
      通过率: (data.byRiskLevel.normal.passed / data.byRiskLevel.normal.total) * 100,
    },
  ];

  const dimensionOptions: { key: ViewDimension; label: string; icon: typeof Building2 }[] = [
    { key: 'department', label: '按部门', icon: Building2 },
    { key: 'exam', label: '按测验', icon: ClipboardList },
    { key: 'employee', label: '按员工', icon: UserCheck },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-brand-700 mb-2">审计报表</h1>
          <p className="text-brand-400">查看合规测评数据统计与分析报表</p>
        </div>
        <Button variant="gold" onClick={handleExport}>
          <Download className="w-4 h-4" />
          导出CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card
            key={stat.label}
            className="animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl ${stat.bgColor} ${stat.borderColor} border flex items-center justify-center`}
                >
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-brand-400 mb-1">{stat.label}</p>
                  <p className={`text-2xl font-bold font-serif ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gold-500" />
              各部门完成情况
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byDepartment} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF2" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#536E94' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#536E94' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E8ECF2',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="completed" name="完成数" fill="#0F2540" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="passed" name="通过数" fill="#C9A962" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gold-500" />
              分类测验占比
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.byCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    innerRadius={50}
                    fill="#8884d8"
                    dataKey="total"
                  >
                    {data.byCategory.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E8ECF2',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gold-500" />
              高风险 vs 普通岗位 通过率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={riskComparisonData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF2" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: '#536E94' }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#536E94' }} width={100} />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(1)}%`, '通过率']}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E8ECF2',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="通过率" fill="#C9A962" radius={[0, 4, 4, 0]} barSize={32}>
                    {riskComparisonData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#C9A962' : '#0F2540'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gold-500" />
              近30天趋势
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8ECF2" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#536E94' }} interval={4} />
                  <YAxis tick={{ fontSize: 12, fill: '#536E94' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E8ECF2',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    name="完成数"
                    stroke="#0F2540"
                    strokeWidth={2}
                    dot={{ fill: '#0F2540', r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="passed"
                    name="通过数"
                    stroke="#C9A962"
                    strokeWidth={2}
                    dot={{ fill: '#C9A962', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-gold-500" />
              数据明细
            </CardTitle>
            <div className="flex items-center gap-2">
              {dimensionOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setDimension(opt.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    dimension === opt.key
                      ? 'bg-brand-700 text-white'
                      : 'text-brand-600 hover:bg-brand-100'
                  }`}
                >
                  <opt.icon className="w-4 h-4" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {dimension === 'department' && (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-brand-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">部门</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">总人数</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">完成数</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">通过数</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">完成率</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">通过率</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byDepartment.map((dept) => (
                    <tr key={dept.name} className="border-b border-brand-50 hover:bg-brand-50/50">
                      <td className="py-3 px-4 text-sm font-medium text-brand-700">{dept.name}</td>
                      <td className="py-3 px-4 text-sm text-brand-600">{dept.total}</td>
                      <td className="py-3 px-4 text-sm text-brand-600">{dept.completed}</td>
                      <td className="py-3 px-4 text-sm text-brand-600">{dept.passed}</td>
                      <td className="py-3 px-4">
                        <Badge variant="info">
                          {((dept.completed / dept.total) * 100).toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={dept.passed / dept.total >= 0.8 ? 'success' : 'warning'}>
                          {((dept.passed / dept.total) * 100).toFixed(1)}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {dimension === 'exam' && (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-brand-100">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">分类</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">总测验数</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">完成数</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">通过数</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byCategory.map((cat) => (
                    <tr key={cat.name} className="border-b border-brand-50 hover:bg-brand-50/50">
                      <td className="py-3 px-4 text-sm font-medium text-brand-700">{cat.name}</td>
                      <td className="py-3 px-4 text-sm text-brand-600">{cat.total}</td>
                      <td className="py-3 px-4 text-sm text-brand-600">{cat.completed}</td>
                      <td className="py-3 px-4 text-sm text-brand-600">{cat.passed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {dimension === 'employee' && (
              <div className="py-8 text-center text-brand-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>员工维度数据加载中...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
