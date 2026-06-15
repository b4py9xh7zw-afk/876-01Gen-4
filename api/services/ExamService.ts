import ExamRepository from '../repositories/ExamRepository.js';
import QuestionRepository from '../repositories/QuestionRepository.js';
import UserRepository from '../repositories/UserRepository.js';
import type {
  ExamListItem,
  ExamDetail,
  ExamQuestion,
  SubmitExamResponse,
  AnswerDetail,
} from '../../shared/types.js';

class ExamService {
  getExamList(
    userId: number,
    query?: {
      keyword?: string;
      category?: string;
      userStatus?: string;
      page?: number;
      pageSize?: number;
    }
  ): { list: ExamListItem[]; total: number } {
    return ExamRepository.findExamListForUser(userId, query);
  }

  getExamDetail(userId: number, examId: number): ExamDetail | null {
    return ExamRepository.getExamDetail(userId, examId);
  }

  getExamQuestions(userId: number, examId: number): ExamQuestion[] {
    const exam = ExamRepository.findById(examId);
    if (!exam) {
      throw new Error('测验不存在');
    }
    if (exam.status !== 'published') {
      throw new Error('测验未发布');
    }
    const user = UserRepository.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    const { userStatus } = ExamRepository.getUserExamStatus(userId, examId);
    if (userStatus === 'expired') {
      throw new Error('测验已过期');
    }

    return ExamRepository.getExamQuestions(examId);
  }

  submitExam(
    userId: number,
    examId: number,
    data: {
      answers: Record<number, string | string[]>;
      startedAt?: string;
    },
    reqInfo: {
      ip: string;
      userAgent: string;
    }
  ): SubmitExamResponse {
    const exam = ExamRepository.findById(examId);
    if (!exam) {
      throw new Error('测验不存在');
    }
    if (exam.status !== 'published') {
      throw new Error('测验未发布');
    }

    const now = new Date();
    if (now < new Date(exam.start_time)) {
      throw new Error('测验尚未开始');
    }
    if (now > new Date(exam.end_time)) {
      throw new Error('测验已结束');
    }

    const user = UserRepository.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    const attempts = ExamRepository.getUserAttempts(userId, examId);
    const latestAttempt = attempts[0];
    let attemptId: number;
    let attemptNumber: number;
    let startedAt: string;

    if (latestAttempt && !latestAttempt.submitted_at) {
      attemptId = latestAttempt.id;
      attemptNumber = latestAttempt.attempt_number;
      startedAt = latestAttempt.started_at;
    } else {
      attemptNumber = attempts.length + 1;
      if (attemptNumber > 1) {
        if (!Boolean(exam.allow_retry)) {
          throw new Error('该测验不允许重试');
        }
        if (attemptNumber > exam.max_retries + 1) {
          throw new Error('已达到最大重试次数');
        }
        const lastSubmitted = attempts.find((a) => a.submitted_at);
        if (lastSubmitted && Boolean(lastSubmitted.passed)) {
          throw new Error('您已通过该测验，无需再次提交');
        }
      }
      startedAt = data.startedAt || new Date().toISOString();
      attemptId = ExamRepository.createAttempt({
        userId,
        examId,
        attemptNumber,
        startedAt,
      });
    }

    const questions = QuestionRepository.findByIds(
      ExamRepository.getExamQuestions(examId).map((q) => q.id)
    );

    const details: AnswerDetail[] = [];
    let totalScore = 0;
    let userScore = 0;
    let correctCount = 0;

    for (const q of questions) {
      totalScore += q.score;
      const userAnswer = data.answers[q.id] ?? (q.type === 'multiple' ? [] : '');

      let correct = false;
      if (q.type === 'multiple' && Array.isArray(q.correctAnswer) && Array.isArray(userAnswer)) {
        const sortedCorrect = [...q.correctAnswer].sort();
        const sortedUser = [...userAnswer].sort();
        correct =
          sortedCorrect.length === sortedUser.length &&
          sortedCorrect.every((v, i) => v === sortedUser[i]);
      } else {
        correct = userAnswer === q.correctAnswer;
      }

      const questionScore = correct ? q.score : 0;
      if (correct) correctCount++;
      userScore += questionScore;

      details.push({
        questionId: q.id,
        correct,
        userAnswer,
        correctAnswer: q.correctAnswer,
        score: q.score,
        userScore: questionScore,
      });
    }

    const passScore = user.isHighRisk ? exam.high_risk_pass_score : exam.pass_score;
    const passed = userScore >= passScore;
    const submittedAt = new Date().toISOString();
    const durationSeconds = Math.max(
      0,
      Math.floor((new Date(submittedAt).getTime() - new Date(startedAt).getTime()) / 1000)
    );

    ExamRepository.updateAttempt(attemptId, {
      answersJson: JSON.stringify(data.answers),
      score: userScore,
      totalScore,
      passed,
      submittedAt,
      durationSeconds,
      ipAddress: reqInfo.ip,
      userAgent: reqInfo.userAgent,
    });

    ExamRepository.createLearningRecord({
      attemptId,
      userId,
      examId,
    });

    const remainingRetries = Boolean(exam.allow_retry)
      ? Math.max(0, exam.max_retries - attemptNumber + 1)
      : 0;
    const canRetry = !passed && Boolean(exam.allow_retry) && remainingRetries > 0;

    return {
      attemptId,
      score: userScore,
      totalScore,
      passScore,
      passed,
      correctCount,
      totalQuestions: questions.length,
      details,
      submittedAt,
      canRetry,
      remainingRetries,
    };
  }
}

export default new ExamService();
