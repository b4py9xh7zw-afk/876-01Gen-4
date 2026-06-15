import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  FileText,
} from 'lucide-react';
import type { ExamListItem, ExamCategory, ExamUserStatus } from '@shared/types';
import { Card, CardContent } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { EmptyState } from '@/components/UI/EmptyState';
import api from '@/services/api';
import { cn } from '@/lib/utils';
import ExamCard from '@/components/Exam/ExamCard';

type CategoryFilter = ExamCategory | 'all';
type StatusFilter = ExamUserStatus | 'all';

const categoryTabs: { key: CategoryFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'anti_fraud', label: '反舞弊' },
  { key: 'data_security', label: '数据安全' },
  { key: 'procurement', label: '采购红线' },
];

const statusOptions: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: '全部状态' },
  { key: 'not_started', label: '未开始' },
  { key: 'in_progress', label: '进行中' },
  { key: 'passed', label: '已通过' },
  { key: 'failed', label: '未通过' },
  { key: 'expired', label: '已过期' },
];

export default function ExamCenter() {
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(9);
  const [exams, setExams] = useState<ExamListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const totalPages = Math.ceil(total / pageSize);

  const loadExams = useCallback(async () => {
    try {
      setLoading(true);
      const params: {
        keyword?: string;
        category?: ExamCategory;
        userStatus?: ExamUserStatus;
        page: number;
        pageSize: number;
      } = {
        page,
        pageSize,
      };
      if (debouncedKeyword) params.keyword = debouncedKeyword;
      if (category !== 'all') params.category = category;
      if (status !== 'all') params.userStatus = status;

      const res = await api.exams.getList(params);
      setExams(res.list);
      setTotal(res.total);
    } catch (error) {
      console.error('加载测验列表失败:', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedKeyword, category, status, page, pageSize]);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    setPage(1);
  }, [category, status]);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-brand-700 mb-2">
            测验中心
          </h1>
          <p className="text-brand-400">选择并参加您需要完成的合规测验</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索测验名称..."
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-brand-200 bg-white text-sm text-brand-700 placeholder:text-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 transition-all"
              />
            </div>

            <div className="relative">
              <Button
                variant="secondary"
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                className="w-full lg:w-auto justify-between min-w-[160px]"
              >
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <span>{statusOptions.find((o) => o.key === status)?.label}</span>
                </div>
              </Button>
              {statusDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setStatusDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-white shadow-card-hover border border-brand-100 py-2 z-20 animate-fade-in">
                    {statusOptions.map((option) => (
                      <button
                        key={option.key}
                        onClick={() => {
                          setStatus(option.key);
                          setStatusDropdownOpen(false);
                        }}
                        className={cn(
                          'w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors text-left',
                          status === option.key
                            ? 'bg-brand-50 text-brand-700 font-medium'
                            : 'text-brand-600 hover:bg-brand-50'
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {categoryTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setCategory(tab.key)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  category === tab.key
                    ? 'bg-gradient-gold text-white shadow-gold'
                    : 'bg-brand-50 text-brand-600 hover:bg-brand-100'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="py-20 text-center text-brand-400">加载中...</div>
      ) : exams.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              title="暂无测验"
              description="当前筛选条件下没有找到相关测验"
              icon={<FileText className="w-10 h-10 text-brand-300" />}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam, index) => (
              <div key={exam.id} style={{ animationDelay: `${index * 50}ms` }}>
                <ExamCard exam={exam} />
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                上一页
              </Button>
              <div className="px-4 py-2 text-sm text-brand-600">
                第 <span className="font-medium text-brand-700">{page}</span> / {totalPages} 页
                <span className="text-brand-400 ml-2">共 {total} 条</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                下一页
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
