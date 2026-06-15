import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Secret, SignOptions } from 'jsonwebtoken';
import UserRepository from '../repositories/UserRepository.js';
import type { User } from '../../shared/types.js';

const JWT_SECRET: Secret = (process.env.JWT_SECRET as Secret) || 'compliance-platform-secret-key';
const JWT_EXPIRES_IN: SignOptions['expiresIn'] = '7d';

class AuthService {
  async login(
    username: string,
    password: string
  ): Promise<{ user: User; token: string }> {
    if (!username || !password) {
      throw new Error('用户名和密码不能为空');
    }

    const userWithPass = UserRepository.findByUsername(username);
    if (!userWithPass) {
      throw new Error('用户名或密码错误');
    }

    if (userWithPass.status === 'disabled') {
      throw new Error('账号已被禁用，请联系管理员');
    }

    const isValid = await bcrypt.compare(password, userWithPass.passwordHash);
    if (!isValid) {
      throw new Error('用户名或密码错误');
    }

    const token = jwt.sign({ userId: userWithPass.id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    const { passwordHash: _ignored, ...user } = userWithPass;
    return { user, token };
  }

  getCurrentUser(userId: number): User | null {
    return UserRepository.findById(userId);
  }
}

export default new AuthService();
