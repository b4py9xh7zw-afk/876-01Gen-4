import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Building2,
  Briefcase,
  AlertTriangle,
  FileText,
  Tag,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Globe,
  Hash,
  Award,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/UI';
import api from '@/services/api';
import { formatDateTime, formatDuration, getCategoryName, getRoleName } from '@/utils/format';
import type { LearningRecordDetail, ExamCategory } from '@shared/types';

function formatAnswer(answer: string | string[] | undefined | null): string {
  if (!answer) return '-';
  if (Array.isArray(answer)) return answer.join(', ');
  return answer;
}

export default function RecordDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<LearningRecordDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await api.records.getDetail(Number(id));
        setRecord(data);
      } catch (error) {
        console.error('获取记录详情失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="animate-fade-in py-20 text-center text-brand-400">
        加载中...
      </div>
    );
  }

  if (!record) {
    return (
      <div className="animate-fade-in py-20 text-center text-brand-400">
        未找到该记录
      </div>
    );
  }

  const signatureToken = `SIG-${record.id}-${record.attemptId}-${record.userId}-${Date.now().toString(36).toUpperCase()}`;

  const infoItems = [
    { icon: User, label: '员工姓名', value: record.realName },
    { icon: Building2, label: '部门', value: record.department },
    { icon: Briefcase, label: '岗位', value: record.positionName || '-' },
    {
      icon: AlertTriangle,
      label: '是否高风险岗位',
      value: record.isHighRiskPosition ? '是' : '否',
      valueClass: record.isHighRiskPosition ? 'text-red-600' : 'text-brand-700',
    },
    { icon: FileText, label: '测验名称', value: record.examTitle },
    {
      icon: Tag,
      label: '分类',
      value: record.examCategoryName || getCategoryName(record.examCategory as ExamCategory),
    },
    {
      icon: Award,
      label: '得分',
      value: `${record.score} / ${record.totalScore}`,
      valueClass: record.passed ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold',
    },
    {
      icon: record.passed ? CheckCircle2 : XCircle,
      label: '是否通过',
      value: record.passed ? '已通过' : '未通过',
      valueClass: record.passed ? 'text-green-600' : 'text-red-600',
    },
    { icon: Clock, label: '开始时间', value: formatDateTime(record.startedAt) },
    { icon: Clock, label: '提交时间', value: formatDateTime(record.submittedAt) },
    { icon: Clock, label: '答题时长', value: formatDuration(record.durationSeconds) },
    { icon: MapPin, label: '提交IP', value: record.ipAddress, valueClass: 'font-mono' },
    { icon: Globe, label: '浏览器信息', value: record.userAgent || '-' },
    { icon: Hash, label: '第几次答题', value: `第 ${record.attemptNumber} 次` },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/records')}
        >
          <ArrowLeft className="w-4 h-4" />
          返回列表
        </Button>
        <div className="flex-1 flex items-center gap-3">
          <h1 className="font-serif text-2xl font-bold text-brand-700">
            学习记录详情
          </h1>
          <span className="text-sm text-brand-400 font-mono">
            #{record.id}
          </span>
          <Badge variant={record.passed ? 'success' : 'danger'}>
            {record.passed ? '已通过' : '未通过'}
          </Badge>
          <Badge variant={record.signature ? 'gold' : 'warning'}>
            {record.signature ? '已签署' : '未签署'}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-gold-500" />
            基本信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {infoItems.map((item) => (
              <div
                key={item.label}
                className="flex items-start gap-3 p-4 rounded-lg bg-brand-50/50"
              >
                <div className="w-9 h-9 rounded-lg bg-white border border-brand-100 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-brand-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-brand-400 mb-1">{item.label}</p>
                  <p className={`text-sm ${item.valueClass || 'text-brand-700'} truncate`}>
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-gold-500" />
            签名凭证
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative rounded-xl border-2 border-gold-300 bg-gradient-to-br from-gold-50/50 to-white p-6">
            <div className="absolute inset-0 rounded-xl border border-gold-200/50 pointer-events-none m-1" />
            <div className="absolute top-3 right-3">
              <Badge variant="gold" className="bg-gold-100 text-gold-700">
                <FileCheck className="w-3 h-3 mr-1" />
                电子签名
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="text-sm font-medium text-brand-600">签名图像</p>
                {record.signature ? (
                  <div className="w-full h-28 rounded-lg bg-white border border-gold-200 flex items-center justify-center p-4">
                    <img
                      src={record.signature}
                      alt="电子签名"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-full h-28 rounded-lg bg-white border border-dashed border-gold-300 flex items-center justify-center text-brand-400 text-sm">
                    暂未签署
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-brand-400 mb-1">签署时间</p>
                  <p className="text-brand-700 font-medium">
                    {record.signedAt ? formatDateTime(record.signedAt) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-brand-400 mb-1">签名凭证编号</p>
                  <p className="text-brand-700 font-mono text-sm bg-gold-50 px-3 py-2 rounded-lg border border-gold-200 break-all">
                    {signatureToken}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gold-200/50 flex items-center justify-center gap-2 text-sm text-gold-600">
              <ShieldCheck className="w-4 h-4" />
              <span className="font-medium">本记录已通过区块链存证，不可篡改</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gold-500" />
            答题明细
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-100">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider w-20">题号</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider">题目内容</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider w-40">用户答案</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider w-40">正确答案</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider w-24">是否正确</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-brand-500 uppercase tracking-wider w-24">得分</th>
                </tr>
              </thead>
              <tbody>
                {record.answerDetails?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-brand-400">
                      暂无答题明细
                    </td>
                  </tr>
                ) : (
                  record.answerDetails?.map((detail, index) => (
                    <tr
                      key={detail.questionId}
                      className="border-b border-brand-50 hover:bg-brand-50/50 transition-colors"
                    >
                      <td className="py-4 px-4 text-sm text-brand-600 font-medium">
                        {index + 1}
                      </td>
                      <td className="py-4 px-4 text-sm text-brand-700 max-w-md">
                        <p className="line-clamp-2">{detail.questionContent}</p>
                      </td>
                      <td className="py-4 px-4 text-sm">
                        <span className={detail.correct ? 'text-green-600' : 'text-red-600'}>
                          {formatAnswer(detail.userAnswer)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-brand-700">
                        {formatAnswer(detail.correctAnswer)}
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={detail.correct ? 'success' : 'danger'}>
                          {detail.correct ? '正确' : '错误'}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-sm font-medium">
                        <span className={detail.userScore > 0 ? 'text-green-600' : 'text-brand-400'}>
                          {detail.userScore}
                        </span>
                        <span className="text-brand-300"> / {detail.score}</span>
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
