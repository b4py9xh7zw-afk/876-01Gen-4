import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Calendar,
  ChevronDown,
  ChevronUp,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Globe,
  Hash,
  FileCheck,
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/UI';
import api from '@/services/api';
import { formatDateTime, formatDuration, getCategoryName } from '@/utils/format';
import type { LearningRecord, ExamCategory } from '@shared/types';

interface Filters {
  keyword: string;
  examCategory: ExamCategory | '';
  passed: '' | 'true' | 'false';
  startDate: string;
  endDate: string;
}

export default function LearningRecords() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<LearningRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [filters, setFilters] = useState<Filters>({
    keyword: '',
    examCategory: '',
    passed: '',
    startDate: '',
    endDate: '',
  });

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params: Parameters<typeof api.records.getList>[0] = {
        page,
        pageSize,
      };
      if (filters.keyword) params.keyword = filters.keyword;
      if (filters.examCategory) params.examCategory = filters.examCategory;
      if (filters.passed !== '') params.passed = filters.passed === 'true';
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const result = await api.records.getList(params);
      setRecords(result.list);
      setTotal(result.total);
    } catch (error) {
      console.error('获取学习记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    fetchRecords();
  };

  const handleReset = () => {
    setFilters({
      keyword: '',
      examCategory: '',
      passed: '',
      startDate: '',
      endDate: '',
    });
    setPage(1);
  };

  const toggleRow = (id: number) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedRows(newSet);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-brand-700 mb-2">学习记录中心</h1>
        <p className="text-brand-400">查看和管理所有测验学习记录</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gold-500" />
            筛选条件
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-brand-600 mb-1.5">关键词搜索</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
                <input
                  type="text"
                  placeholder="搜索测验名称、员工姓名..."
                  value={filters.keyword}
                  onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                  className="w-full pl-10 pr-4 h-10 rounded-lg border border-brand-200 bg-white text-sm text-brand-700 placeholder-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-600 mb-1.5">测验分类</label>
              <select
                value={filters.examCategory}
                onChange={(e) => setFilters({ ...filters, examCategory: e.target.value as ExamCategory | '' })}
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
              <label className="block text-sm font-medium text-brand-600 mb-1.5">通过状态</label>
              <select
                value={filters.passed}
                onChange={(e) => setFilters({ ...filters, passed: e.target.value as '' | 'true' | 'false' })}
                className="w-full px-4 h-10 rounded-lg border border-brand-200 bg-white text-sm text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
              >
                <option value="">全部状态</option>
                <option value="true">已通过</option>
                <option value="false">未通过</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-600 mb-1.5">开始日期</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full pl-10 pr-4 h-10 rounded-lg border border-brand-200 bg-white text-sm text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-600 mb-1.5">结束日期</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400" />
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full pl-10 pr-4 h-10 rounded-lg border border-brand-200 bg-white text-sm text-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={handleReset}>
              重置
            </Button>
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4" />
              查询
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider w-12"></th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">序号</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">测验名称</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">分类</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">得分/总分</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">是否通过</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">答题时长</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">提交时间</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">签署状态</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">IP地址</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-brand-400">
                      加载中...
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-brand-400">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  records.map((record, index) => (
                    <>
                      <tr
                        key={record.id}
                        className="border-b border-brand-50 hover:bg-brand-50/50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <button
                            onClick={() => toggleRow(record.id)}
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-brand-100 text-brand-500"
                          >
                            {expandedRows.has(record.id) ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="py-4 px-4 text-sm text-brand-600">
                          {(page - 1) * pageSize + index + 1}
                        </td>
                        <td className="py-4 px-4 text-sm text-brand-700 font-medium">
                          {record.examTitle}
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="default">
                            {record.examCategoryName || getCategoryName(record.examCategory as ExamCategory)}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-sm text-brand-700 font-medium">
                          <span className={record.score >= record.passScore ? 'text-green-600' : 'text-red-600'}>
                            {record.score}
                          </span>
                          <span className="text-brand-400"> / {record.totalScore}</span>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant={record.passed ? 'success' : 'danger'}>
                            {record.passed ? '已通过' : '未通过'}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-sm text-brand-600">
                          {formatDuration(record.durationSeconds)}
                        </td>
                        <td className="py-4 px-4 text-sm text-brand-600">
                          {formatDateTime(record.submittedAt)}
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant={record.signature ? 'gold' : 'warning'}>
                            {record.signature ? '已签署' : '未签署'}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-sm text-brand-600 font-mono">
                          {record.ipAddress}
                        </td>
                        <td className="py-4 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/records/${record.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                            详情
                          </Button>
                        </td>
                      </tr>
                      {expandedRows.has(record.id) && (
                        <tr className="bg-brand-50/30">
                          <td colSpan={11} className="py-6 px-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                              <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-brand-700 flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-gold-500" />
                                  答题信息
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-brand-400">开始时间</span>
                                    <span className="text-brand-700">{formatDateTime(record.startedAt)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-brand-400">提交时间</span>
                                    <span className="text-brand-700">{formatDateTime(record.submittedAt)}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-brand-400">第几次答题</span>
                                    <span className="text-brand-700">第 {record.attemptNumber} 次</span>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-brand-700 flex items-center gap-2">
                                  <Globe className="w-4 h-4 text-gold-500" />
                                  环境信息
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-brand-400">IP地址</span>
                                    <span className="text-brand-700 font-mono">{record.ipAddress}</span>
                                  </div>
                                  <div className="flex justify-between max-w-full">
                                    <span className="text-brand-400 shrink-0">浏览器</span>
                                    <span className="text-brand-700 truncate ml-2" title={record.userAgent}>
                                      {record.userAgent?.slice(0, 30)}...
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-3 lg:col-span-2">
                                <h4 className="text-sm font-semibold text-brand-700 flex items-center gap-2">
                                  <FileCheck className="w-4 h-4 text-gold-500" />
                                  签署信息
                                </h4>
                                {record.signature ? (
                                  <div className="flex items-start gap-4">
                                    <div className="w-24 h-16 rounded-lg border border-gold-300 bg-white p-2 flex items-center justify-center">
                                      <img
                                        src={record.signature}
                                        alt="签名"
                                        className="max-w-full max-h-full object-contain"
                                      />
                                    </div>
                                    <div className="space-y-2 text-sm flex-1">
                                      <div className="flex justify-between">
                                        <span className="text-brand-400">签署时间</span>
                                        <span className="text-brand-700">
                                          {record.signedAt ? formatDateTime(record.signedAt) : '-'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm text-brand-400">暂未签署</p>
                                )}
                              </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-brand-100 flex justify-end">
                              <Button
                                variant="gold"
                                size="sm"
                                onClick={() => navigate(`/records/${record.id}`)}
                              >
                                <Eye className="w-4 h-4" />
                                查看答题明细
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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
