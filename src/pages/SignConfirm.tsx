import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Eraser,
  CheckCircle2,
  ShieldCheck,
  FileSignature,
  Clock,
  CheckSquare,
  ArrowLeft,
} from 'lucide-react';
import api from '@/services/api';
import { formatDateTime, cn } from '@/utils/format';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/UI';
import { useAuthStore } from '@/stores/authStore';
import type { ExamDetail, LearningRecord } from '@shared/types';

export default function SignConfirmPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const examId = Number(id);
  const user = useAuthStore((s) => s.user);
  const isHighRisk = user?.isHighRisk || false;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [record, setRecord] = useState<LearningRecord | null>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [signing, setSigning] = useState(false);
  const [signSuccess, setSignSuccess] = useState(false);

  const requiredPassScore = isHighRisk && exam?.highRiskPassScore ? exam.highRiskPassScore : (exam?.passScore || 60);

  useEffect(() => {
    if (!examId) return;
    loadData();
  }, [examId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [examData, recordsData] = await Promise.all([
        api.exams.getDetail(examId),
        api.records.getList({ page: 1, pageSize: 100 }),
      ]);
      setExam(examData);
      const matchedRecord = recordsData.list.find(
        (r) => r.examId === examId && r.passed && !r.signedAt
      );
      setRecord(matchedRecord || recordsData.list[0] || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#0F2540';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCanvasPosition = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = useCallback((clientX: number, clientY: number) => {
    isDrawingRef.current = true;
    lastPosRef.current = getCanvasPosition(clientX, clientY);
  }, []);

  const draw = useCallback((clientX: number, clientY: number) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !lastPosRef.current) return;

    const pos = getCanvasPosition(clientX, clientY);
    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPosRef.current = pos;
    setHasSignature(true);
  }, []);

  const stopDrawing = useCallback(() => {
    isDrawingRef.current = false;
    lastPosRef.current = null;
  }, []);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    startDrawing(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    draw(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    stopDrawing();
  };

  const handleMouseLeave = () => {
    stopDrawing();
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    startDrawing(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    draw(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    stopDrawing();
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasSignature(false);
    setSignatureDataUrl('');
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isAtBottom =
      target.scrollHeight - target.scrollTop <= target.clientHeight + 10;
    if (isAtBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleSign = async () => {
    if (!record || signing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    setSignatureDataUrl(dataUrl);
    setSigning(true);

    try {
      await api.records.sign(record.id, {
        signatureData: dataUrl,
        declarationRead: hasScrolledToBottom && agreed,
      });
      setSignSuccess(true);
    } catch (err) {
      console.error('签署失败', err);
    } finally {
      setSigning(false);
    }
  };

  const canSign = hasScrolledToBottom && hasSignature && agreed;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-brand-200 border-t-brand-700 rounded-full" />
      </div>
    );
  }

  if (signSuccess) {
    return (
      <div className="animate-fade-in max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-8">
                <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
                <div className="absolute -top-2 -right-2 w-20 h-20 rounded-full border-4 border-gold-500 opacity-60 animate-pulse-slow" />
                <div className="absolute -bottom-4 -right-4 opacity-30 transform rotate-12">
                  <div className="relative w-24 h-24 rounded-full border-4 border-red-500 flex items-center justify-center">
                    <div className="text-red-600 font-serif font-bold text-xs leading-tight text-center">
                      <div>合</div>
                      <div>规</div>
                      <div>专</div>
                      <div>用</div>
                      <div>章</div>
                    </div>
                  </div>
                </div>
              </div>

              <h2 className="font-serif text-3xl font-bold text-brand-700 mb-2">
                签署成功
              </h2>
              <p className="text-brand-400 mb-8">
                您的学习确认书已成功签署，签署记录已存档
              </p>

              {signatureDataUrl && (
                <div className="mb-8 p-6 border border-gold-200 rounded-xl bg-gold-50/50">
                  <p className="text-sm text-brand-400 mb-3">您的电子签名</p>
                  <img
                    src={signatureDataUrl}
                    alt="电子签名"
                    className="max-h-32 mx-auto"
                  />
                  <p className="text-xs text-brand-400 mt-3">
                    签署时间：{formatDateTime(currentTime)}
                  </p>
                </div>
              )}

              <div className="flex gap-4">
                <Button variant="secondary" onClick={() => navigate('/records')}>
                  <ArrowLeft className="h-5 w-5" />
                  返回学习记录
                </Button>
                <Button variant="gold" onClick={() => navigate('/dashboard')}>
                  返回工作台
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-3xl mx-auto space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold-500" />
          <ShieldCheck className="h-6 w-6 text-gold-500" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold-500" />
        </div>
        <h1 className="font-serif text-4xl font-bold text-brand-700 mb-2">
          学习确认书
        </h1>
        <div className="gold-line w-48 mx-auto mt-4" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-gold-500" />
            合规声明
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            ref={containerRef}
            onScroll={handleScroll}
            className="formal-document max-h-96 overflow-y-auto rounded-lg"
          >
            <h3 className="font-serif text-xl font-semibold text-brand-700 text-center mb-6">
              学习确认书
            </h3>

            <p className="mb-4 text-brand-700">
              本人郑重确认，已认真学习并通过
              <span className="font-semibold text-gold-600">「{exam?.title}」</span>
              相关合规知识培训，考试分数为
              <span className="font-semibold text-gold-600">{record?.score || 0} 分</span>
              （满分 {exam?.totalScore || 100} 分，及格分数 {requiredPassScore} 分）。
            </p>

            <h4 className="font-serif text-lg font-semibold text-brand-700 mt-6 mb-3">
              第一条 遵守承诺
            </h4>
            <p className="mb-3 text-brand-700 leading-relaxed">
              本人承诺严格遵守国家法律法规及公司各项规章制度，自觉履行岗位职责，廉洁从业，不利用职务之便谋取不正当利益。
            </p>

            <h4 className="font-serif text-lg font-semibold text-brand-700 mt-6 mb-3">
              第二条 保密义务
            </h4>
            <p className="mb-3 text-brand-700 leading-relaxed">
              本人承诺严格保守公司商业秘密，不泄露、不传播、不使用公司保密信息，包括但不限于客户信息、技术资料、财务数据、经营策略等。
            </p>

            <h4 className="font-serif text-lg font-semibold text-brand-700 mt-6 mb-3">
              第三条 反舞弊承诺
            </h4>
            <p className="mb-3 text-brand-700 leading-relaxed">
              本人承诺不从事任何舞弊行为，包括但不限于收受贿赂、虚报费用、利益冲突、内幕交易、弄虚作假等损害公司利益的行为。
            </p>

            <h4 className="font-serif text-lg font-semibold text-brand-700 mt-6 mb-3">
              第四条 数据安全
            </h4>
            <p className="mb-3 text-brand-700 leading-relaxed">
              本人承诺严格遵守数据安全管理规定，按照授权范围访问和使用公司数据资源，确保数据安全，防止数据泄露和滥用。
            </p>

            <h4 className="font-serif text-lg font-semibold text-brand-700 mt-6 mb-3">
              第五条 违规责任
            </h4>
            <p className="mb-3 text-brand-700 leading-relaxed">
              本人清楚知晓并同意，如违反上述承诺及公司相关规定，愿意承担相应的纪律处分、经济赔偿直至法律责任。
            </p>

            <h4 className="font-serif text-lg font-semibold text-brand-700 mt-6 mb-3">
              第六条 其他事项
            </h4>
            <p className="mb-6 text-brand-700 leading-relaxed">
              本确认书自本人签署之日起生效，作为本人任职期间合规承诺的有效文件。本人确认已充分理解以上所有条款内容。
            </p>

            <div className="text-center pt-4 border-t border-gold-200">
              <p className="text-sm text-brand-400">— 文档结束 —</p>
            </div>
          </div>

          {!hasScrolledToBottom && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-amber-600">
              <Clock className="h-4 w-4" />
              请滚动阅读完整声明内容
            </div>
          )}
          {hasScrolledToBottom && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              已阅读完整声明
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-gold-500" />
            电子签名
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm text-brand-400 mb-3">请在下方区域手写签名</p>
            <div className="inline-block border-2 border-dashed border-brand-200 rounded-xl bg-white p-2">
              <canvas
                ref={canvasRef}
                width={400}
                height={200}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="cursor-crosshair"
                style={{ touchAction: 'none' }}
              />
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={clearSignature}
                disabled={!hasSignature}
              >
                <Eraser className="h-4 w-4" />
                清除重签
              </Button>
              {hasSignature && (
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  已签名
                </span>
              )}
            </div>
          </div>

          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-brand-300 text-gold-500 focus:ring-gold-400 cursor-pointer"
            />
            <span className="text-brand-600">
              我已认真阅读并同意以上声明的全部内容，确认以上信息真实有效。
            </span>
          </label>

          <div className="flex items-center gap-2 text-sm text-brand-500">
            <Clock className="h-4 w-4" />
            <span>签署时间：{formatDateTime(currentTime)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-4">
        <Button variant="secondary" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
          返回
        </Button>
        <Button
          variant="gold"
          size="lg"
          onClick={handleSign}
          disabled={!canSign}
          loading={signing}
        >
          <CheckSquare className="h-5 w-5" />
          确认签署
        </Button>
      </div>

      {!canSign && (
        <p className="text-center text-sm text-brand-400">
          请完成以上所有步骤后进行签署
        </p>
      )}
    </div>
  );
}
