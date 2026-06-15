import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { User, UserRole } from '../../shared/types.js';
import UserRepository from '../repositories/UserRepository.js';

const JWT_SECRET = process.env.JWT_SECRET || 'compliance-platform-secret-key';

export interface AuthRequest extends Request {
  user?: User;
  userId?: number;
}

export function auth(req: AuthRequest, res: Response, next: NextFunction): void {
  const token =
    req.cookies?.token ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.replace('Bearer ', '')
      : null) ||
    (req.query.token as string) ||
    null;

  if (!token) {
    res.status(401).json({ code: 401, message: '未登录', data: null });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ code: 401, message: '登录已过期，请重新登录', data: null });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ code: 401, message: '未登录', data: null });
      return;
    }

    const user = UserRepository.findById(userId);
    if (!user) {
      res.status(401).json({ code: 401, message: '用户不存在', data: null });
      return;
    }

    if (!roles.includes(user.role)) {
      res.status(403).json({ code: 403, message: '权限不足', data: null });
      return;
    }

    req.user = user;
    next();
  };
}
