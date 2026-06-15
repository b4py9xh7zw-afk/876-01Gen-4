import RecordRepository from '../repositories/RecordRepository.js';
import UserRepository from '../repositories/UserRepository.js';
import type {
  LearningRecord,
  LearningRecordDetail,
  User,
} from '../../shared/types.js';

class RecordService {
  getRecords(
    query: {
      keyword?: string;
      department?: string;
      examCategory?: string;
      passed?: boolean;
      signed?: boolean;
      startDate?: string;
      endDate?: string;
      page?: number;
      pageSize?: number;
    },
    currentUser: User
  ): { list: LearningRecord[]; total: number } {
    return RecordRepository.getRecords(query, {
      id: currentUser.id,
      role: currentUser.role,
      department: currentUser.department,
    });
  }

  getRecordDetail(
    id: number,
    currentUser: User
  ): LearningRecordDetail | null {
    return RecordRepository.getRecordDetail(id, {
      id: currentUser.id,
      role: currentUser.role,
      department: currentUser.department,
    });
  }

  signRecord(
    id: number,
    userId: number,
    signatureData: string,
    declarationRead: boolean
  ): LearningRecord | null {
    if (!declarationRead) {
      throw new Error('请先阅读并确认合规声明');
    }
    if (!signatureData) {
      throw new Error('签名数据不能为空');
    }
    const user = UserRepository.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }
    return RecordRepository.signRecord(id, userId, signatureData, declarationRead);
  }
}

export default new RecordService();
