import { Router, type Response } from 'express';
import AuthService from '../services/AuthService.js';
import { auth, type AuthRequest } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    const result = await AuthService.login(username, password);
    res.cookie('token', result.token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    });
    res.json({ code: 0, message: '登录成功', data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : '登录失败';
    res.status(400).json({ code: 400, message, data: null });
  }
});

router.post('/logout', async (req: AuthRequest, res: Response): Promise<void> => {
  res.clearCookie('token');
  res.json({ code: 0, message: '登出成功', data: null });
});

router.get('/me', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ code: 401, message: '未登录', data: null });
      return;
    }
    const user = AuthService.getCurrentUser(userId);
    if (!user) {
      res.status(404).json({ code: 404, message: '用户不存在', data: null });
      return;
    }
    res.json({ code: 0, message: '成功', data: user });
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取用户信息失败';
    res.status(500).json({ code: 500, message, data: null });
  }
});

export default router;
