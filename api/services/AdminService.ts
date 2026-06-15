import bcrypt from 'bcryptjs';
import QuestionRepository from '../repositories/QuestionRepository.js';
import ExamRepository from '../repositories/ExamRepository.js';
import UserRepository from '../repositories/UserRepository.js';
import PositionRepository from '../repositories/PositionRepository.js';
import RecordRepository from '../repositories/RecordRepository.js';
import type {
  Question,
  ExamDetail,
  User,
  Position,
  ReportSummary,
  ExamCategory,
  ExamStatus,
  QuestionType,
  QuestionDifficulty,
  UserRole,
} from '../../shared/types.js';

class AdminService {
  getQuestions(query?: {
    keyword?: string;
    category?: string;
    type?: string;
    difficulty?: string;
    page?: number;
    pageSize?: number;
  }): { list: Question[]; total: number } {
    return QuestionRepository.findAll(query);
  }

  createQuestion(
    data: {
      type: QuestionType;
      category: string;
      content: string;
      options: Array<{ key: string; value: string }>;
      correctAnswer: string | string[];
      score: number;
      difficulty: QuestionDifficulty;
    },
    createdBy: number
  ): Question {
    if (!data.content) {
      throw new Error('题目内容不能为空');
    }
    if (!data.options || data.options.length < 2) {
      throw new Error('选项不能为空且至少2个');
    }
    if (!data.correctAnswer || (Array.isArray(data.correctAnswer) && data.correctAnswer.length === 0)) {
      throw new Error('正确答案不能为空');
    }
    return QuestionRepository.create({ ...data, createdBy });
  }

  updateQuestion(
    id: number,
    data: Partial<{
      type: QuestionType;
      category: string;
      content: string;
      options: Array<{ key: string; value: string }>;
      correctAnswer: string | string[];
      score: number;
      difficulty: QuestionDifficulty;
    }>
  ): Question | null {
    const existing = QuestionRepository.findById(id);
    if (!existing) {
      throw new Error('题目不存在');
    }
    return QuestionRepository.update(id, data);
  }

  deleteQuestion(id: number): boolean {
    const existing = QuestionRepository.findById(id);
    if (!existing) {
      throw new Error('题目不存在');
    }
    return QuestionRepository.delete(id);
  }

  getExamsAdmin(query?: {
    keyword?: string;
    category?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }): { list: ExamDetail[]; total: number } {
    return ExamRepository.findAllAdmin(query);
  }

  createExam(
    data: {
      title: string;
      category: ExamCategory;
      description: string;
      passScore: number;
      highRiskPassScore: number;
      durationMinutes: number;
      startTime: string;
      endTime: string;
      allowRetry: boolean;
      maxRetries: number;
      status: ExamStatus;
      questionIds: number[];
      materialIds: number[];
    },
    publishedBy: number
  ): number {
    if (!data.title) {
      throw new Error('测验标题不能为空');
    }
    if (!data.questionIds || data.questionIds.length === 0) {
      throw new Error('请至少选择一道题目');
    }
    if (new Date(data.startTime) >= new Date(data.endTime)) {
      throw new Error('开始时间必须早于结束时间');
    }
    return ExamRepository.createExam({ ...data, publishedBy });
  }

  updateExam(
    id: number,
    data: Partial<{
      title: string;
      category: ExamCategory;
      description: string;
      passScore: number;
      highRiskPassScore: number;
      durationMinutes: number;
      startTime: string;
      endTime: string;
      allowRetry: boolean;
      maxRetries: number;
      status: ExamStatus;
      questionIds: number[];
      materialIds: number[];
    }>
  ): void {
    const existing = ExamRepository.findById(id);
    if (!existing) {
      throw new Error('测验不存在');
    }
    ExamRepository.updateExam(id, data);
  }

  getUsers(query?: {
    keyword?: string;
    role?: string;
    department?: string;
    page?: number;
    pageSize?: number;
  }): { list: User[]; total: number } {
    return UserRepository.findAll(query);
  }

  createUser(data: {
    username: string;
    password: string;
    realName: string;
    role: UserRole;
    department: string;
    positionId: number | null;
    isHighRisk: boolean;
    status: 'active' | 'disabled';
  }): User {
    if (!data.username || !data.password || !data.realName) {
      throw new Error('用户名、密码、姓名不能为空');
    }
    const existing = UserRepository.findByUsername(data.username);
    if (existing) {
      throw new Error('用户名已存在');
    }
    const passwordHash = bcrypt.hashSync(data.password, 10);
    return UserRepository.create({
      username: data.username,
      passwordHash,
      realName: data.realName,
      role: data.role,
      department: data.department,
      positionId: data.positionId,
      isHighRisk: data.isHighRisk,
      status: data.status,
    });
  }

  updateUser(
    id: number,
    data: Partial<{
      realName: string;
      role: UserRole;
      department: string;
      positionId: number | null;
      isHighRisk: boolean;
      status: 'active' | 'disabled';
      password: string;
    }>
  ): User | null {
    const existing = UserRepository.findById(id);
    if (!existing) {
      throw new Error('用户不存在');
    }
    const updateData: Partial<{
      realName: string;
      role: UserRole;
      department: string;
      positionId: number | null;
      isHighRisk: boolean;
      status: 'active' | 'disabled';
      passwordHash: string;
    }> = { ...data };
    if (data.password) {
      updateData.passwordHash = bcrypt.hashSync(data.password, 10);
      delete (updateData as { password?: string }).password;
    }
    return UserRepository.update(id, updateData);
  }

  getPositions(): Position[] {
    return PositionRepository.findAll();
  }

  createPosition(data: {
    name: string;
    department: string;
    isHighRisk: boolean;
    requiredPassScore: number;
  }): Position {
    if (!data.name || !data.department) {
      throw new Error('职位名称和部门不能为空');
    }
    return PositionRepository.create(data);
  }

  updatePosition(
    id: number,
    data: Partial<{
      name: string;
      department: string;
      isHighRisk: boolean;
      requiredPassScore: number;
    }>
  ): Position | null {
    const existing = PositionRepository.findById(id);
    if (!existing) {
      throw new Error('职位不存在');
    }
    return PositionRepository.update(id, data);
  }

  getReportSummary(): ReportSummary {
    return RecordRepository.getReportSummary();
  }
}

export default new AdminService();
