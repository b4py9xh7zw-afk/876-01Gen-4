import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  FileText,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Target,
  HelpCircle,
  RotateCcw,
  PenLine,
  BookOpen,
  CheckSquare,
  ListChecks,
  Timer,
  Award,
} from 'lucide-react';
import api from '@/services/api';
import { formatDuration, getCategoryName, cn } from '@/utils/format';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Modal, Badge } from '@/components/UI';
import type { ExamDetail, ExamQuestion, SubmitExamResponse, AnswerDetail } from '@shared/types';

type ViewMode = 'info' | 'exam' | 'result';

export default function ExamDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const examId = Number(id);

  const [mode, setMode] = useState<ViewMode>('info');
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [startedAt, setStartedAt] = useState<string>('');
  const [showAnswerSheet, setShowAnswerSheet] = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitExamResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [expandedMaterial, setExpandedMaterial] = useState<number | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  useEffect(() => {
    if (!examId) return;
    loadExamDetail();
  }, [examId]);

  const loadExamDetail = async () => {
    setLoading(true);
    try {
      const data = await api.exams.getDetail(examId);
      setExam(data);
    } finally {
      setLoading(false);
    }
  };

  const startExam = async () => {
    try {
      const qs = await api.exams.getQuestions(examId);
      setQuestions(qs);
      setAnswers({});
      setCurrentIndex(0);
      setTimeLeft((exam?.duration || 60) * 60);
      setStartedAt(new Date().toISOString());
      setMode('exam');
    } catch (err) {
      console.error('加载题目失败', err);
    }
  };

  useEffect(() => {
    if (mode !== 'exam') return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [mode, timeLeft]);

  const handleSelectAnswer = (questionId: number, optionKey: string, isMultiple: boolean) => {
    setAnswers((prev) => {
      if (isMultiple) {
        const current = (prev[questionId] as string[]) || [];
        if (current.includes(optionKey)) {
          return { ...prev, [questionId]: current.filter((k) => k !== optionKey) };
        }
        return { ...prev, [questionId]: [...current, optionKey] };
      }
      return { ...prev, [questionId]: optionKey };
    });
  };

  const isAnswered = (questionId: number): boolean => {
    const answer = answers[questionId];
    if (!answer) return false;
    if (Array.isArray(answer)) return answer.length > 0;
    return answer.length > 0;
  };

  const answeredCount = questions.filter((q) => isAnswered(q.id)).length;

  const handleSubmit = useCallback(async () => {
    if (!exam || submitting) return;
    setSubmitting(true);
    try {
      const result = await api.exams.submit(examId, { answers, startedAt });
      setSubmitResult(result);
      setMode('result');
    } catch (err) {
      console.error('提交失败', err);
    } finally {
      setSubmitting(false);
      setShowConfirmSubmit(false);
    }
  }, [examId, answers, startedAt, exam, submitting]);

  const renderMarkdown = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-serif text-lg font-semibold text-brand-700 mt-4 mb-2">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h3 key={idx} className="font-serif text-xl font-semibold text-brand-700 mt-6 mb-3">
            {line.replace('## ', '')}
          </h3>
        );
      }
      if (line.startsWith('# ')) {
        return (
          <h2 key={idx} className="font-serif text-2xl font-bold text-brand-700 mt-6 mb-4">
            {line.replace('# ', '')}
          </h2>
        );
      }
      if (line.trim() === '') return <div key={idx} className="h-2" />;
      return (
        <p key={idx} className="text-brand-600 leading-relaxed mb-2">
          {line}
        </p>
      );
    });
  };

  const renderInfoMode = () => {
    if (!exam) return null;
    return (
      <div className="animate-fade-in space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="gold">{getCategoryName(exam.category)}</Badge>
            {exam.allowRetry && <Badge variant="info">允许重考</Badge>}
          </div>
          <h1 className="font-serif text-3xl font-bold text-brand-700 mb-2">{exam.title}</h1>
          <p className="text-brand-400">{exam.description}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-gold-500" />
              考试规则
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RuleItem
                icon={<Target className="h-5 w-5 text-gold-500" />}
                label="及格分数"
                value={`${exam.passScore} 分`}
              />
              <RuleItem
                icon={<Timer className="h-5 w-5 text-gold-500" />}
                label="考试时长"
                value={formatDuration(exam.duration * 60)}
              />
              <RuleItem
                icon={<HelpCircle className="h-5 w-5 text-gold-500" />}
                label="题目数量"
                value={`${exam.totalQuestions} 题`}
              />
              <RuleItem
                icon={<RotateCcw className="h-5 w-5 text-gold-500" />}
                label="重考规则"
                value={exam.allowRetry ? `最多 ${exam.maxRetries} 次` : '不可重考'}
              />
            </div>
            {exam.highRiskPassScore > exam.passScore && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">高风险岗位特殊说明</p>
                  <p className="text-sm text-amber-700 mt-1">
                    高风险岗位人员及格分数为 {exam.highRiskPassScore} 分，请认真作答。
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {exam.learningMaterials && exam.learningMaterials.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-gold-500" />
                学习资料
              </CardTitle>
              <CardDescription>请仔细阅读以下资料后开始答题</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {exam.learningMaterials.map((material) => (
                <div
                  key={material.id}
                  className="border border-brand-100 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedMaterial(expandedMaterial === material.id ? null : material.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-brand-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-brand-400" />
                      <span className="font-medium text-brand-700">{material.title}</span>
                      <Badge variant="default">{material.type.toUpperCase()}</Badge>
                    </div>
                    {expandedMaterial === material.id ? (
                      <ChevronUp className="h-5 w-5 text-brand-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-brand-400" />
                    )}
                  </button>
                  {expandedMaterial === material.id && material.content && (
                    <div className="border-t border-brand-100 p-6 bg-brand-50/50 max-h-96 overflow-y-auto">
                      {renderMarkdown(material.content)}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <Button variant="gold" size="lg" onClick={startExam}>
            <PenLine className="h-5 w-5" />
            开始答题
          </Button>
        </div>
      </div>
    );
  };

  const renderExamMode = () => {
    if (questions.length === 0) return null;
    const currentQuestion = questions[currentIndex];
    const answered = isAnswered(currentQuestion.id);
    const isMultiple = currentQuestion.type === 'multiple';
    const isJudge = currentQuestion.type === 'judge';

    return (
      <div className="animate-fade-in space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <span className="font-serif text-lg text-brand-700">
                  第 {currentIndex + 1} / {questions.length} 题
                </span>
                <Badge variant={isJudge ? 'info' : isMultiple ? 'warning' : 'gold'}>
                  {isJudge ? '判断题' : isMultiple ? '多选题' : '单选题'}
                </Badge>
                <Badge variant="default">{currentQuestion.score} 分</Badge>
              </div>
              <div
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-semibold',
                  timeLeft < 60 ? 'bg-red-50 text-red-600' : 'bg-gold-50 text-gold-600'
                )}
              >
                <Clock className="h-5 w-5" />
                {formatDuration(timeLeft)}
              </div>
            </div>

            <div className="w-full h-2 bg-brand-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-gold transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-8 pb-8">
            <div className="font-serif text-xl md:text-2xl text-brand-700 leading-relaxed mb-8">
              {currentQuestion.content}
            </div>

            <div className="space-y-3">
              {currentQuestion.options.map((option) => {
                let selected = false;
                if (isMultiple) {
                  const arr = (answers[currentQuestion.id] as string[]) || [];
                  selected = arr.includes(option.key);
                } else {
                  selected = answers[currentQuestion.id] === option.key;
                }

                return (
                  <button
                    key={option.key}
                    onClick={() => handleSelectAnswer(currentQuestion.id, option.key, isMultiple)}
                    className={cn(
                      'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left',
                      selected
                        ? 'border-gold-500 bg-gold-50'
                        : 'border-brand-100 hover:border-brand-200 hover:bg-brand-50'
                    )}
                  >
                    <span
                      className={cn(
                        'flex items-center justify-center w-10 h-10 rounded-full font-serif text-lg font-semibold flex-shrink-0',
                        selected
                          ? 'bg-gradient-gold text-white'
                          : 'bg-brand-100 text-brand-500'
                      )}
                    >
                      {option.key}
                    </span>
                    <span
                      className={cn(
                        'text-base',
                        selected ? 'text-gold-700 font-medium' : 'text-brand-600'
                      )}
                    >
                      {option.value}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Button
                variant="secondary"
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="h-5 w-5" />
                上一题
              </Button>

              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={() => setShowAnswerSheet(true)}>
                  <ListChecks className="h-5 w-5" />
                  答题卡 ({answeredCount}/{questions.length})
                </Button>
              </div>

              {currentIndex === questions.length - 1 ? (
                <Button variant="gold" onClick={() => setShowConfirmSubmit(true)}>
                  <CheckSquare className="h-5 w-5" />
                  提交试卷
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                >
                  下一题
                  <ChevronRight className="h-5 w-5" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Modal
          open={showAnswerSheet}
          onClose={() => setShowAnswerSheet(false)}
          title="答题卡"
          description={`已答 ${answeredCount} / ${questions.length} 题`}
          size="lg"
        >
          <div className="grid grid-cols-5 md:grid-cols-8 gap-3">
            {questions.map((q, idx) => {
              const qAnswered = isAnswered(q.id);
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setShowAnswerSheet(false);
                  }}
                  className={cn(
                    'flex items-center justify-center h-12 rounded-lg font-medium transition-all',
                    isCurrent
                      ? 'bg-gradient-gold text-white shadow-gold'
                      : qAnswered
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-brand-50 text-brand-500 hover:bg-brand-100'
                  )}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-6 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-gold" />
              <span className="text-brand-500">当前题</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-100" />
              <span className="text-brand-500">已答</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-brand-50" />
              <span className="text-brand-500">未答</span>
            </div>
          </div>
        </Modal>

        <Modal
          open={showConfirmSubmit}
          onClose={() => setShowConfirmSubmit(false)}
          title="确认提交"
          description={
            answeredCount < questions.length
              ? `还有 ${questions.length - answeredCount} 题未作答，确定要提交吗？`
              : '确定要提交试卷吗？提交后无法修改答案。'
          }
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowConfirmSubmit(false)}>
                继续答题
              </Button>
              <Button variant="gold" onClick={handleSubmit} loading={submitting}>
                确认提交
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <StatRow label="已答题数" value={`${answeredCount} / ${questions.length}`} />
            <StatRow label="未答题数" value={`${questions.length - answeredCount} 题`} />
          </div>
        </Modal>
      </div>
    );
  };

  const renderResultMode = () => {
    if (!submitResult || !exam) return null;
    const wrongCount = submitResult.totalQuestions - submitResult.correctCount;
    const unanswered = questions.length - submitResult.totalQuestions;

    return (
      <div className="animate-fade-in space-y-6">
        <Card>
          <CardContent className="pt-10 pb-10">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-48 h-48 rounded-full bg-gradient-gold opacity-10 animate-pulse-slow" />
                <div className="absolute inset-4 rounded-full bg-gradient-gold flex items-center justify-center">
                  <div className="absolute inset-2 rounded-full bg-white flex flex-col items-center justify-center">
                    <span className="font-serif text-5xl font-bold text-brand-700">
                      {submitResult.score}
                    </span>
                    <span className="text-sm text-brand-400 mt-1">
                      / {submitResult.totalScore} 分
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                {submitResult.passed ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-8 w-8" />
                    <span className="font-serif text-3xl font-bold">恭喜通过</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="h-8 w-8" />
                    <span className="font-serif text-3xl font-bold">未通过</span>
                  </div>
                )}
              </div>

              <p className="text-brand-400 mt-2">
                及格分数：{submitResult.passScore} 分
              </p>

              <div className="grid grid-cols-3 gap-8 mt-8 w-full max-w-md">
                <ResultStat
                  icon={<CheckCircle2 className="h-6 w-6 text-green-600" />}
                  label="正确"
                  value={submitResult.correctCount}
                  color="text-green-600"
                />
                <ResultStat
                  icon={<XCircle className="h-6 w-6 text-red-600" />}
                  label="错误"
                  value={wrongCount}
                  color="text-red-600"
                />
                <ResultStat
                  icon={<HelpCircle className="h-6 w-6 text-brand-400" />}
                  label="未答"
                  value={unanswered}
                  color="text-brand-400"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-gold-500" />
              答题回顾
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {submitResult.details.map((detail: AnswerDetail, idx: number) => {
              const question = questions[idx];
              const isExpanded = expandedQuestion === detail.questionId;
              return (
                <div
                  key={detail.questionId}
                  className={cn(
                    'border rounded-lg overflow-hidden transition-colors',
                    detail.correct ? 'border-green-200' : 'border-red-200'
                  )}
                >
                  <button
                    onClick={() => setExpandedQuestion(isExpanded ? null : detail.questionId)}
                    className={cn(
                      'w-full flex items-center justify-between p-4 text-left transition-colors',
                      detail.correct ? 'hover:bg-green-50' : 'hover:bg-red-50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {detail.correct ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className="font-medium text-brand-700">
                        第 {idx + 1} 题
                      </span>
                      <Badge variant={detail.correct ? 'success' : 'danger'}>
                        {detail.userScore} / {detail.score} 分
                      </Badge>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-brand-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-brand-400" />
                    )}
                  </button>
                  {isExpanded && question && (
                    <div className="border-t border-brand-100 p-4 space-y-4">
                      <p className="font-serif text-base text-brand-700 leading-relaxed">
                        {question.content}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {question.options.map((opt) => {
                          const correctList = Array.isArray(detail.correctAnswer)
                            ? detail.correctAnswer
                            : [detail.correctAnswer];
                          const userList = Array.isArray(detail.userAnswer)
                            ? detail.userAnswer
                            : detail.userAnswer
                            ? [detail.userAnswer]
                            : [];
                          const isCorrectOpt = correctList.includes(opt.key);
                          const isUserOpt = userList.includes(opt.key);

                          return (
                            <div
                              key={opt.key}
                              className={cn(
                                'flex items-center gap-2 p-3 rounded-lg border',
                                isCorrectOpt && isUserOpt
                                  ? 'bg-green-50 border-green-300'
                                  : isCorrectOpt
                                  ? 'bg-green-50 border-green-200'
                                  : isUserOpt
                                  ? 'bg-red-50 border-red-300'
                                  : 'bg-white border-brand-100'
                              )}
                            >
                              <span
                                className={cn(
                                  'flex items-center justify-center w-6 h-6 rounded-full text-sm font-semibold',
                                  isCorrectOpt
                                    ? 'bg-green-600 text-white'
                                    : isUserOpt
                                    ? 'bg-red-500 text-white'
                                    : 'bg-brand-100 text-brand-500'
                                )}
                              >
                                {opt.key}
                              </span>
                              <span className="text-sm text-brand-600">{opt.value}</span>
                              {isCorrectOpt && (
                                <Badge variant="success" className="ml-auto">正确答案</Badge>
                              )}
                              {isUserOpt && !isCorrectOpt && (
                                <Badge variant="danger" className="ml-auto">你的选择</Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4">
          {submitResult.passed ? (
            <Button variant="gold" size="lg" onClick={() => navigate(`/exams/${examId}/sign`)}>
              <PenLine className="h-5 w-5" />
              前往签署学习确认
            </Button>
          ) : submitResult.canRetry ? (
            <Button variant="gold" size="lg" onClick={startExam}>
              <RotateCcw className="h-5 w-5" />
              重新答题（剩余 {submitResult.remainingRetries} 次）
            </Button>
          ) : null}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-brand-200 border-t-brand-700 rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {mode === 'info' && renderInfoMode()}
      {mode === 'exam' && renderExamMode()}
      {mode === 'result' && renderResultMode()}
    </div>
  );
}

function RuleItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-brand-50 rounded-lg">
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-brand-400">{label}</p>
        <p className="font-medium text-brand-700">{value}</p>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-brand-100 last:border-0">
      <span className="text-brand-400">{label}</span>
      <span className="font-medium text-brand-700">{value}</span>
    </div>
  );
}

function ResultStat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center">
      {icon}
      <span className={cn('font-serif text-2xl font-bold mt-2', color)}>{value}</span>
      <span className="text-sm text-brand-400 mt-1">{label}</span>
    </div>
  );
}
