export type UserRole =
  | "super_admin"
  | "compliance_officer"
  | "dept_manager"
  | "employee";

export interface User {
  id: number;
  username: string;
  realName: string;
  role: UserRole;
  department: string;
  positionId: number | null;
  positionName?: string | null;
  isHighRisk: boolean;
  status: "active" | "disabled";
}

export interface Position {
  id: number;
  name: string;
  department: string;
  isHighRisk: boolean;
  requiredPassScore: number;
}

export type ExamCategory = "anti_fraud" | "data_security" | "procurement" | "other";
export type ExamStatus = "draft" | "published" | "archived";
export type ExamUserStatus =
  | "not_started"
  | "in_progress"
  | "passed"
  | "failed"
  | "expired";

export interface ExamListItem {
  id: number;
  title: string;
  category: ExamCategory;
  categoryName: string;
  description: string;
  passScore: number;
  highRiskPassScore: number;
  duration: number;
  totalQuestions: number;
  totalScore: number;
  startTime: string;
  endTime: string;
  allowRetry: boolean;
  maxRetries: number;
  publishedBy: string;
  publishedAt: string;
  userStatus: ExamUserStatus;
  userScore: number | null;
  userAttempts: number;
}

export interface LearningMaterial {
  id: number;
  title: string;
  type: "pdf" | "doc" | "text";
  content?: string;
}

export interface ExamDetail extends ExamListItem {
  learningMaterials: LearningMaterial[];
}

export type QuestionType = "single" | "multiple" | "judge";
export type QuestionDifficulty = "easy" | "medium" | "hard";

export interface ExamQuestion {
  id: number;
  type: QuestionType;
  content: string;
  score: number;
  options: Array<{ key: string; value: string }>;
}

export interface Question {
  id: number;
  type: QuestionType;
  category: string;
  content: string;
  options: Array<{ key: string; value: string }>;
  correctAnswer: string | string[];
  score: number;
  difficulty: QuestionDifficulty;
  createdAt: string;
}

export interface AnswerDetail {
  questionId: number;
  correct: boolean;
  userAnswer: string | string[];
  correctAnswer: string | string[];
  score: number;
  userScore: number;
}

export interface SubmitExamResponse {
  attemptId: number;
  score: number;
  totalScore: number;
  passScore: number;
  passed: boolean;
  correctCount: number;
  totalQuestions: number;
  details: AnswerDetail[];
  submittedAt: string;
  canRetry: boolean;
  remainingRetries: number;
}

export interface LearningRecord {
  id: number;
  attemptId: number;
  userId: number;
  username: string;
  realName: string;
  department: string;
  positionName: string;
  isHighRiskPosition: boolean;
  examId: number;
  examTitle: string;
  examCategory: string;
  examCategoryName: string;
  score: number;
  totalScore: number;
  passScore: number;
  passed: boolean;
  startedAt: string;
  submittedAt: string;
  durationSeconds: number;
  signedAt: string | null;
  signature: string | null;
  ipAddress: string;
  userAgent: string;
  attemptNumber: number;
}

export interface LearningRecordDetail extends LearningRecord {
  answerDetails: Array<{
    questionId: number;
    questionContent: string;
    questionType: string;
    correct: boolean;
    userAnswer: string | string[];
    correctAnswer: string | string[];
    options: Array<{ key: string; value: string }>;
    score: number;
    userScore: number;
  }>;
}

export interface ReportSummary {
  totalExams: number;
  totalParticipants: number;
  completionRate: number;
  passRate: number;
  byDepartment: Array<{
    name: string;
    total: number;
    completed: number;
    passed: number;
  }>;
  byCategory: Array<{
    name: string;
    total: number;
    completed: number;
    passed: number;
  }>;
  byRiskLevel: {
    highRisk: { total: number; passed: number };
    normal: { total: number; passed: number };
  };
  trend: Array<{ date: string; completed: number; passed: number }>;
}

export const CATEGORY_MAP: Record<ExamCategory, string> = {
  anti_fraud: "反舞弊",
  data_security: "数据安全",
  procurement: "采购红线",
  other: "其他合规",
};

export const ROLE_MAP: Record<UserRole, string> = {
  super_admin: "超级管理员",
  compliance_officer: "合规管理员",
  dept_manager: "部门管理员",
  employee: "普通员工",
};
