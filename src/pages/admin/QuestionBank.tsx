import { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Filter,
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Modal } from '@/components/UI';
import api from '@/services/api';
import type { Question, QuestionType, QuestionDifficulty } from '@shared/types';

const QUESTION_TYPE_MAP: Record<QuestionType, string> = {
  single: '单选题',
  multiple: '多选题',
  judge: '判断题',
};

const DIFFICULTY_MAP: Record<QuestionDifficulty, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  easy: { label: '简单', variant: 'success' },
  medium: { label: '中等', variant: 'warning' },
  hard: { label: '困难', variant: 'danger' },
};

export default function QuestionBank() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [filters, setFilters] = useState({
    keyword: '',
    category: '',
    type: '' as QuestionType | '',
    difficulty: '' as QuestionDifficulty | '',
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params: Parameters<typeof api.admin.getQuestions>[0] = {
        page,
        pageSize,
      };
      if (filters.keyword) params.keyword = filters.keyword;
      if (filters.category) params.category = filters.category;
      if (filters.type) params.type = filters.type;
      if (filters.difficulty) params.difficulty = filters.difficulty;

      const result = await api.admin.getQuestions(params);
      setQuestions(result.list);
      setTotal(result.total);
    } catch (error) {
      console.error('获取题目列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    fetchQuestions();
  };

  const handleReset = () => {
    setFilters({
      keyword: '',
      category: '',
      type: '',
      difficulty: '',
    });
    setPage(1);
  };

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await api.admin.deleteQuestion(deletingId);
      setDeleteModalOpen(false);
      setDeletingId(null);
      fetchQuestions();
    } catch (error) {
      console.error('删除题目失败:', error);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-brand-700 mb-2">题库管理</h1>
          <p className="text-brand-400">创建和管理合规测评题目</p>
        </div>
        <Button variant="gold">
          <Plus className="w-4 h-4" />
          新建题目
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-600 mb-1.5">关键词搜索</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
                <input
                  type="text"
                  placeholder="搜索题目内容..."
                  value={filters.keyword}
                  onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                  className="w-full pl-10 pr-4 h-10 rounded-lg border border-brand-200 bg-white text-sm text-brand-700 placeholder-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-600 mb-1.5">分类</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full px-4 h-10 rounded-lg border border-brand-200 bg-white text-sm text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
              >
                <option value="">全部分类</option>
                <option value="anti_fraud">反舞弊</option>
                <option value="data_security">数据安全</option>
                <option value="procurement">采购红线</option>
                <option value="other">其他合规</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-600 mb-1.5">题型</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value as QuestionType | '' })}
                className="w-full px-4 h-10 rounded-lg border border-brand-200 bg-white text-sm text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
              >
                <option value="">全部题型</option>
                <option value="single">单选题</option>
                <option value="multiple">多选题</option>
                <option value="judge">判断题</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-600 mb-1.5">难度</label>
              <select
                value={filters.difficulty}
                onChange={(e) => setFilters({ ...filters, difficulty: e.target.value as QuestionDifficulty | '' })}
                className="w-full px-4 h-10 rounded-lg border border-brand-200 bg-white text-sm text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
              >
                <option value="">全部难度</option>
                <option value="easy">简单</option>
                <option value="medium">中等</option>
                <option value="hard">困难</option>
              </select>
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
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider w-20">题号</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">题目内容</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">题型</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">分类</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">难度</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">分数</th>
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
                ) : questions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-brand-400">
                      <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      暂无题目数据
                    </td>
                  </tr>
                ) : (
                  questions.map((q, index) => {
                    const difficulty = DIFFICULTY_MAP[q.difficulty];
                    return (
                      <tr key={q.id} className="border-b border-brand-50 hover:bg-brand-50/50 transition-colors">
                        <td className="py-4 px-4 text-sm text-brand-600 font-medium">
                          {(page - 1) * pageSize + index + 1}
                        </td>
                        <td className="py-4 px-4 text-sm text-brand-700 max-w-lg">
                          <p className="line-clamp-2">{q.content}</p>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="info">
                            {QUESTION_TYPE_MAP[q.type]}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="default">{q.category}</Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant={difficulty.variant}>{difficulty.label}</Badge>
                        </td>
                        <td className="py-4 px-4 text-sm font-medium text-brand-700">
                          {q.score} 分
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Button variant="secondary" size="sm">
                              <Edit className="w-4 h-4" />
                              编辑
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => handleDeleteClick(q.id)}>
                              <Trash2 className="w-4 h-4" />
                              删除
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

      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <div className="p-6">
          <h3 className="font-serif text-lg font-bold text-brand-700 mb-2">确认删除</h3>
          <p className="text-sm text-brand-500 mb-6">
            确定要删除这道题目吗？此操作不可撤销。
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              取消
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm}>
              确认删除
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
