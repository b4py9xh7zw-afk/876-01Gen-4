import { useNavigate } from 'react-router-dom';
import {
  Clock,
  HelpCircle,
  Target,
  AlertTriangle,
  Play,
  FileText,
  ArrowRight,
  Ban,
} from 'lucide-react';
import type { ExamListItem, ExamCategory } from '@shared/types';
import { Card, CardContent, CardFooter } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { getStatusName, getCategoryName } from '@/utils/format';
import { cn } from '@/lib/utils';

interface ExamCardProps {
  exam: ExamListItem;
}

const categoryColors: Record<ExamCategory, string> = {
  anti_fraud: 'bg-red-100 text-red-700',
  data_security: 'bg-blue-100 text-blue-700',
  procurement: 'bg-purple-100 text-purple-700',
  other: 'bg-gray-100 text-gray-700',
};

export default function ExamCard({ exam }: ExamCardProps) {
  const navigate = useNavigate();
  const statusInfo = getStatusName(exam.userStatus);

  const handleAction = () => {
    navigate(`/exams/${exam.id}`);
  };

  const getActionButton = () => {
    switch (exam.userStatus) {
      case 'not_started':
        return (
          <Button variant="gold" onClick={handleAction} className="w-full">
            <Play className="w-4 h-4" />
            开始答题
          </Button>
        );
      case 'in_progress':
        return (
          <Button variant="primary" onClick={handleAction} className="w-full">
            <ArrowRight className="w-4 h-4" />
            继续答题
          </Button>
        );
      case 'passed':
      case 'failed':
        return (
          <Button variant="secondary" onClick={handleAction} className="w-full">
            <FileText className="w-4 h-4" />
            查看成绩
          </Button>
        );
      case 'expired':
        return (
          <Button variant="secondary" onClick={handleAction} disabled className="w-full">
            <Ban className="w-4 h-4" />
            已过期
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <Card hoverable className="flex flex-col h-full animate-fade-in">
      <CardContent className="flex-1 flex flex-col pt-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <Badge className={categoryColors[exam.category]}>
            {getCategoryName(exam.category)}
          </Badge>
          {exam.highRiskPassScore > exam.passScore && (
            <Badge variant="danger" className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              高风险岗位
            </Badge>
          )}
        </div>

        <h3 className="font-serif text-xl font-semibold text-brand-700 mb-2 line-clamp-1">
          {exam.title}
        </h3>

        <p className="text-sm text-brand-400 mb-4 line-clamp-2 flex-1">
          {exam.description}
        </p>

        <div className="grid grid-cols-3 gap-2 mb-4 pt-4 border-t border-brand-100">
          <div className="flex flex-col items-center text-center">
            <Clock className="w-4 h-4 text-brand-400 mb-1" />
            <span className="text-lg font-semibold text-brand-700">{exam.duration}</span>
            <span className="text-xs text-brand-400">分钟</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <HelpCircle className="w-4 h-4 text-brand-400 mb-1" />
            <span className="text-lg font-semibold text-brand-700">{exam.totalQuestions}</span>
            <span className="text-xs text-brand-400">题目</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <Target className="w-4 h-4 text-brand-400 mb-1" />
            <span className="text-lg font-semibold text-brand-700">{exam.passScore}</span>
            <span className="text-xs text-brand-400">及格分</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', statusInfo.color)}>
            {statusInfo.name}
          </span>
          {exam.userScore !== null && (
            <div className="text-right">
              <span className="text-xs text-brand-400">得分</span>
              <span className="ml-2 text-lg font-bold text-gold-600">
                {exam.userScore}
                <span className="text-sm font-normal text-brand-400">/{exam.totalScore}</span>
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter>
        {getActionButton()}
      </CardFooter>
    </Card>
  );
}
