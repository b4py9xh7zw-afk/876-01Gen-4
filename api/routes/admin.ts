import { Router, type Response } from 'express';
import AdminService from '../services/AdminService.js';
import { auth, requireRole, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.use(auth, requireRole('super_admin', 'compliance_officer'));

router.get('/questions', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { keyword, category, type, difficulty, page, pageSize } = req.query;
    const result = AdminService.getQuestions({
      keyword: keyword as string | undefined,
      category: category as string | undefined,
      type: type as string | undefined,
      difficulty: difficulty as string | undefined,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
    res.json({ code: 0, message: '成功', data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取题目列表失败';
    res.status(500).json({ code: 500, message, data: null });
  }
});

router.post('/questions', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const createdBy = req.userId!;
    const result = AdminService.createQuestion(req.body, createdBy);
    res.json({ code: 0, message: '创建成功', data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : '创建题目失败';
    res.status(400).json({ code: 400, message, data: null });
  }
});

router.put('/questions/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ code: 400, message: '无效的题目ID', data: null });
      return;
    }
    const result = AdminService.updateQuestion(id, req.body);
    res.json({ code: 0, message: '更新成功', data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : '更新题目失败';
    res.status(400).json({ code: 400, message, data: null });
  }
});

router.delete('/questions/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ code: 400, message: '无效的题目ID', data: null });
      return;
    }
    const result = AdminService.deleteQuestion(id);
    res.json({ code: 0, message: '删除成功', data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : '删除题目失败';
    res.status(400).json({ code: 400, message, data: null });
  }
});

router.get('/exams', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { keyword, category, status, page, pageSize } = req.query;
    const result = AdminService.getExamsAdmin({
      keyword: keyword as string | undefined,
      category: category as string | undefined,
      status: status as string | undefined,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
    res.json({ code: 0, message: '成功', data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取测验列表失败';
    res.status(500).json({ code: 500, message, data: null });
  }
});

router.post('/exams', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const publishedBy = req.userId!;
    const result = AdminService.createExam(req.body, publishedBy);
    res.json({ code: 0, message: '创建成功', data: { id: result } });
  } catch (err) {
    const message = err instanceof Error ? err.message : '创建测验失败';
    res.status(400).json({ code: 400, message, data: null });
  }
});

router.put('/exams/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ code: 400, message: '无效的测验ID', data: null });
      return;
    }
    AdminService.updateExam(id, req.body);
    res.json({ code: 0, message: '更新成功', data: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : '更新测验失败';
    res.status(400).json({ code: 400, message, data: null });
  }
});

router.get('/users', requireRole('super_admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { keyword, role, department, page, pageSize } = req.query;
    const result = AdminService.getUsers({
      keyword: keyword as string | undefined,
      role: role as string | undefined,
      department: department as string | undefined,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
    res.json({ code: 0, message: '成功', data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取用户列表失败';
    res.status(500).json({ code: 500, message, data: null });
  }
});

router.post('/users', requireRole('super_admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = AdminService.createUser(req.body);
    res.json({ code: 0, message: '创建成功', data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : '创建用户失败';
    res.status(400).json({ code: 400, message, data: null });
  }
});

router.put('/users/:id', requireRole('super_admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ code: 400, message: '无效的用户ID', data: null });
      return;
    }
    const result = AdminService.updateUser(id, req.body);
    res.json({ code: 0, message: '更新成功', data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : '更新用户失败';
    res.status(400).json({ code: 400, message, data: null });
  }
});

router.get('/positions', requireRole('super_admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = AdminService.getPositions();
    res.json({ code: 0, message: '成功', data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取职位列表失败';
    res.status(500).json({ code: 500, message, data: null });
  }
});

router.post('/positions', requireRole('super_admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = AdminService.createPosition(req.body);
    res.json({ code: 0, message: '创建成功', data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : '创建职位失败';
    res.status(400).json({ code: 400, message, data: null });
  }
});

router.put('/positions/:id', requireRole('super_admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ code: 400, message: '无效的职位ID', data: null });
      return;
    }
    const result = AdminService.updatePosition(id, req.body);
    res.json({ code: 0, message: '更新成功', data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : '更新职位失败';
    res.status(400).json({ code: 400, message, data: null });
  }
});

router.get('/reports/summary', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = AdminService.getReportSummary();
    res.json({ code: 0, message: '成功', data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取报表汇总失败';
    res.status(500).json({ code: 500, message, data: null });
  }
});

export default router;
