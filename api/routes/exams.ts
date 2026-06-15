import { Router, type Response } from 'express';
import ExamService from '../services/ExamService.js';
import { auth, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const { keyword, category, userStatus, page, pageSize } = req.query;
    const result = ExamService.getExamList(userId, {
      keyword: keyword as string | undefined,
      category: category as string | undefined,
      userStatus: userStatus as string | undefined,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
    res.json({ code: 0, message: '成功', data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取测验列表失败';
    res.status(500).json({ code: 500, message, data: null });
  }
});

router.get('/:id', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const examId = Number(req.params.id);
    if (isNaN(examId)) {
      res.status(400).json({ code: 400, message: '无效的测验ID', data: null });
      return;
    }
    const result = ExamService.getExamDetail(userId, examId);
    if (!result) {
      res.status(404).json({ code: 404, message: '测验不存在', data: null });
      return;
    }
    res.json({ code: 0, message: '成功', data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取测验详情失败';
    res.status(500).json({ code: 500, message, data: null });
  }
});

router.get('/:id/questions', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const examId = Number(req.params.id);
    if (isNaN(examId)) {
      res.status(400).json({ code: 400, message: '无效的测验ID', data: null });
      return;
    }
    const result = ExamService.getExamQuestions(userId, examId);
    res.json({ code: 0, message: '成功', data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取题目失败';
    res.status(400).json({ code: 400, message, data: null });
  }
});

router.post('/:id/submit', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const examId = Number(req.params.id);
    if (isNaN(examId)) {
      res.status(400).json({ code: 400, message: '无效的测验ID', data: null });
      return;
    }
    const { answers, startedAt } = req.body;
    const ip =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      '';
    const userAgent = req.headers['user-agent'] || '';
    const result = ExamService.submitExam(
      userId,
      examId,
      { answers, startedAt },
      { ip, userAgent }
    );
    res.json({ code: 0, message: '提交成功', data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : '提交失败';
    res.status(400).json({ code: 400, message, data: null });
  }
});

export default router;
