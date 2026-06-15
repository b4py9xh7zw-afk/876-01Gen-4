import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  CheckCircle2,
  Trophy,
  Clock,
  TrendingUp,
  TrendingDown,
  Play,
  Calendar,
  BookOpen,
} from 'lucide-react';
import type { ExamListItem, LearningRecord } from '@shared/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { EmptyState } from '@/components/UI/EmptyState';
import api from '@/services/api';
import { formatDate, formatDuration, getCategoryName, getStatusName } from '@/utils/format';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend: number;
  trendLabel: string;
  bgColor: string;
  iconColor: string;
  valueColor: string;
}

function StatCard({
  title,
  value,
  icon,
  trend,
  trendLabel,
  bgColor,
  iconColor,
  valueColor,
}: StatCardProps) {
  const isPositive = trend >= 0;
  return (
    <Card className="animate-slide-up overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-brand-400 mb-1">{title}</p>
            <p className={cn('text-3xl font-bold font-serif', valueColor)}>{value}</p>
          </div>
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', bgColor)}>
            <div className={iconColor}>{icon}</div>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-4 text-sm">
          {isPositive ? (
            <TrendingUp className="w-4 h-4 text-green-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600" />
          )}
          <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
            {isPositive ? '+' : ''}
            {trend}%
          </span>
          <span className="text-brand-400">{trendLabel}</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pendingExams, setPendingExams] = useState<ExamListItem[]>([]);
  const [recentRecords, setRecentRecords] = useState<LearningRecord[]>([]);

  const today = new Date();
  const weekDay = ['日', '一', '二', '三', '四', '五', '六'][today.getDay()];
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日 星期${weekDay}`;

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [examsRes, recordsRes] = await Promise.all([
          api.exams.getList({ userStatus: 'not_started', pageSize: 10 }),
          api.records.getList({ pageSize: 5 }),
        ]);
        setPendingExams(examsRes.list);
        setRecentRecords(recordsRes.list);
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const stats = [
    {
      title: '待完成测验',
      value: pendingExams.length,
      icon: <ClipboardList className="w-6 h-6" />,
      trend: 12,
      trendLabel: '较上周',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      valueColor: 'text-red-600',
    },
    {
      title: '已完成测验',
      value: recentRecords.length,
      icon: <CheckCircle2 className="w-6 h-6" />,
      trend: 8,
      trendLabel: '较上周',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      valueColor: 'text-green-600',
    },
    {
      title: '通过率',
      value: recentRecords.length > 0
        ? `${Math.round((recentRecords.filter(r => r.passed).length / recentRecords.length) * 100)}%`
        : '0%',
      icon: <Trophy className="w-6 h-6" />,
      trend: 5,
      trendLabel: '较上周',
      bgColor: 'bg-gold-50',
      iconColor: 'text-gold-600',
      valueColor: 'text-gold-600',
    },
    {
      title: '学习总时长',
      value: formatDuration(recentRecords.reduce((sum, r) => sum + r.durationSeconds, 0)),
      icon: <Clock className="w-6 h-6" />,
      trend: 15,
      trendLabel: '较上周',
      bgColor: 'bg-brand-50',
      iconColor: 'text-brand-600',
      valueColor: 'text-brand-700',
    },
  ];

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-brand-700 mb-2">
            欢迎回来，今天也要加油哦！
          </h1>
          <div className="flex items-center gap-2 text-brand-400">
            <Calendar className="w-4 h-4" />
            <span>{dateStr}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={stat.title} style={{ animationDelay: `${index * 100}ms` }}>
            <StatCard {...stat} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 animate-slide-up" style={{ animationDelay: '400ms' }}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-gold-600" />
              待完成任务
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/exams')}>
              查看全部
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-brand-400">加载中...</div>
            ) : pendingExams.length === 0 ? (
              <EmptyState
                title="暂无待完成测验"
                description="您已完成所有需要参加的测验"
                icon={<CheckCircle2 className="w-10 h-10 text-green-400" />}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-brand-400 border-b border-brand-100">
                      <th className="pb-3 font-medium">测验名称</th>
                      <th className="pb-3 font-medium">分类</th>
                      <th className="pb-3 font-medium">截止时间</th>
                      <th className="pb-3 font-medium text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-50">
                    {pendingExams.slice(0, 5).map((exam) => (
                      <tr key={exam.id} className="hover:bg-brand-50/50 transition-colors">
                        <td className="py-4">
                          <div className="font-medium text-brand-700">{exam.title}</div>
                          <div className="text-xs text-brand-400 mt-0.5">
                            {exam.totalQuestions} 题 · {exam.duration} 分钟
                          </div>
                        </td>
                        <td className="py-4">
                          <Badge variant="default">{getCategoryName(exam.category)}</Badge>
                        </td>
                        <td className="py-4 text-sm text-brand-500">
                          {formatDate(exam.endTime)}
                        </td>
                        <td className="py-4 text-right">
                          <Button
                            variant="gold"
                            size="sm"
                            onClick={() => navigate(`/exams/${exam.id}`)}
                          >
                            <Play className="w-4 h-4" />
                            开始答题
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="animate-slide-up" style={{ animationDelay: '500ms' }}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-gold-600" />
              最近学习记录
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-brand-400">加载中...</div>
            ) : recentRecords.length === 0 ? (
              <EmptyState
                title="暂无学习记录"
                description="完成测验后这里会显示您的学习记录"
                icon={<BookOpen className="w-10 h-10 text-brand-300" />}
              />
            ) : (
              <div className="relative">
                <div className="absolute left-[11px] top-1 bottom-1 w-0.5 bg-brand-100" />
                <div className="space-y-6">
                  {recentRecords.slice(0, 5).map((record, index) => (
                    <div key={record.id} className="relative pl-8">
                      <div
                        className={cn(
                          'absolute left-0 top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center',
                          record.passed
                            ? 'bg-green-50 border-green-400'
                            : 'bg-red-50 border-red-400'
                        )}
                      >
                        <div
                          className={cn(
                            'w-2 h-2 rounded-full',
                            record.passed ? 'bg-green-500' : 'bg-red-500'
                          )}
                        />
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-brand-700 text-sm truncate">
                            {record.examTitle}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-brand-400">
                            <Badge
                              variant={record.passed ? 'success' : 'danger'}
                              className="text-xs"
                            >
                              {record.passed ? '通过' : '未通过'}
                            </Badge>
                            <span>{record.score}分</span>
                          </div>
                        </div>
                        <div className="text-xs text-brand-400 shrink-0 text-right">
                          <div>{formatDate(record.submittedAt)}</div>
                          <div className="mt-0.5">
                            {formatDuration(record.durationSeconds)}
                          </div>
                        </div>
                      </div>
                      {index < recentRecords.slice(0, 5).length - 1 && (
                        <div className="absolute left-[11px] top-7 w-0.5 h-8 bg-brand-100" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
