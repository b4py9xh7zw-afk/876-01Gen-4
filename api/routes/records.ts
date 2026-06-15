import { Router, type Response } from 'express';
import RecordService from '../services/RecordService.js';
import AuthService from '../services/AuthService.js';
import { auth, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.get('/', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const currentUser = AuthService.getCurrentUser(userId);
    if (!currentUser) {
      res.status(401).json({ code: 401, message: '用户不存在', data: null });
      return;
    }
    const {
      keyword,
      department,
      examCategory,
      passed,
      signed,
      startDate,
      endDate,
      page,
      pageSize,
    } = req.query;
    const result = RecordService.getRecords(
      {
        keyword: keyword as string | undefined,
        department: department as string | undefined,
        examCategory: examCategory as string | undefined,
        passed: passed !== undefined ? passed === 'true' : undefined,
        signed: signed !== undefined ? signed === 'true' : undefined,
        startDate: startDate as string | undefined,
        endDate: endDate as string | undefined,
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
      },
      currentUser
    );
    res.json({ code: 0, message: '成功', data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取学习记录失败';
    res.status(500).json({ code: 500, message, data: null });
  }
});

router.get('/:id', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const currentUser = AuthService.getCurrentUser(userId);
    if (!currentUser) {
      res.status(401).json({ code: 401, message: '用户不存在', data: null });
      return;
    }
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ code: 400, message: '无效的记录ID', data: null });
      return;
    }
    const result = RecordService.getRecordDetail(id, currentUser);
    if (!result) {
      res.status(404).json({ code: 404, message: '记录不存在或无权限查看', data: null });
      return;
    }
    res.json({ code: 0, message: '成功', data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取记录详情失败';
    res.status(500).json({ code: 500, message, data: null });
  }
});

router.post('/:id/sign', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ code: 400, message: '无效的记录ID', data: null });
      return;
    }
    const { signatureData, declarationRead } = req.body;
    const result = RecordService.signRecord(
      id,
      userId,
      signatureData,
      Boolean(declarationRead)
    );
    if (!result) {
      res.status(404).json({ code: 404, message: '记录不存在或无权限签署', data: null });
      return;
    }
    res.json({ code: 0, message: '签署成功', data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : '签署失败';
    res.status(400).json({ code: 400, message, data: null });
  }
});

export default router;
