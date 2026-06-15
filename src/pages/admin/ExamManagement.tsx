import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/UI';
import api from '@/services/api';
import { formatDateTime, getCategoryName } from '@/utils/format';
import type { ExamListItem, ExamCategory, ExamStatus } from '@shared/types';

const EXAM_STATUS_MAP: Record<ExamStatus, { label: string; variant: 'default' | 'success' | 'warning' }> = {
  draft: { label: '草稿', variant: 'default' },
  published: { label: '已发布', variant: 'success' },
  archived: { label: '已归档', variant: 'warning' },
};

export default function ExamManagement() {
  const [exams, setExams] = useState<ExamListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [keyword, setKeyword] = useState('');

  const fetchExams = async () => {
    setLoading(true);
    try {
      const result = await api.admin.getExams({
        page,
        pageSize,
        keyword: keyword || undefined,
      });
      setExams(result.list);
      setTotal(result.total);
    } catch (error) {
      console.error('获取测验列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    fetchExams();
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-brand-700 mb-2">测验管理</h1>
          <p className="text-brand-400">创建和管理合规测评测验</p>
        </div>
        <Button variant="gold">
          <Plus className="w-4 h-4" />
          新建测验
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-gold-500" />
            搜索测验
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
              <input
                type="text"
                placeholder="搜索测验标题..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 h-10 rounded-lg border border-brand-200 bg-white text-sm text-brand-700 placeholder-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
              />
            </div>
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
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">标题</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">分类</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">题目数</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">及格分</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">发布时间</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">状态</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-brand-400">
                      加载中...
                    </td>
                  </tr>
                ) : exams.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-brand-400">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      暂无测验数据
                    </td>
                  </tr>
                ) : (
                  exams.map((exam) => {
                    const status = EXAM_STATUS_MAP[exam.userStatus as ExamStatus] || EXAM_STATUS_MAP.draft;
                    return (
                      <tr key={exam.id} className="border-b border-brand-50 hover:bg-brand-50/50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center">
                              <FileText className="w-4 h-4 text-brand-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-brand-700">{exam.title}</p>
                              <p className="text-xs text-brand-400 truncate max-w-xs">
                                {exam.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="default">
                            {exam.categoryName || getCategoryName(exam.category as ExamCategory)}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-sm text-brand-600">
                          {exam.totalQuestions} 题
                        </td>
                        <td className="py-4 px-4 text-sm text-brand-600">
                          {exam.passScore} 分
                        </td>
                        <td className="py-4 px-4 text-sm text-brand-600">
                          {exam.publishedAt ? formatDateTime(exam.publishedAt) : '-'}
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                              详情
                            </Button>
                            <Button variant="secondary" size="sm">
                              <Edit className="w-4 h-4" />
                              编辑
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
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
