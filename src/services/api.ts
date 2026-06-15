import type {
  User,
  ExamListItem,
  ExamDetail,
  ExamQuestion,
  SubmitExamResponse,
  LearningRecord,
  LearningRecordDetail,
  ExamCategory,
  ExamUserStatus,
  ExamStatus,
  QuestionType,
  QuestionDifficulty,
  Question,
  Position,
  ReportSummary,
} from '@shared/types';

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

interface PaginatedResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

interface LoginResponse {
  user: User;
  token: string;
}

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const mergedOptions: RequestInit = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {}),
    },
  };

  const response = await fetch(url, mergedOptions);
  const result = (await response.json()) as ApiResponse<T>;

  if (result.code !== 0) {
    throw new Error(result.message || '请求失败');
  }

  return result.data;
}

export const auth = {
  login(username: string, password: string): Promise<LoginResponse> {
    return request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  logout(): Promise<null> {
    return request<null>('/api/auth/logout', {
      method: 'POST',
    });
  },

  me(): Promise<User> {
    return request<User>('/api/auth/me');
  },
};

interface ExamListParams {
  keyword?: string;
  category?: ExamCategory;
  userStatus?: ExamUserStatus;
  page?: number;
  pageSize?: number;
}

export const exams = {
  getList(params: ExamListParams): Promise<PaginatedResult<ExamListItem>> {
    const query = new URLSearchParams();
    if (params.keyword) query.set('keyword', params.keyword);
    if (params.category) query.set('category', params.category);
    if (params.userStatus) query.set('userStatus', params.userStatus);
    if (params.page) query.set('page', String(params.page));
    if (params.pageSize) query.set('pageSize', String(params.pageSize));
    const url = query.toString() ? `/api/exams?${query.toString()}` : '/api/exams';
    return request<PaginatedResult<ExamListItem>>(url);
  },

  getDetail(id: number): Promise<ExamDetail> {
    return request<ExamDetail>(`/api/exams/${id}`);
  },

  getQuestions(id: number): Promise<ExamQuestion[]> {
    return request<ExamQuestion[]>(`/api/exams/${id}/questions`);
  },

  submit(
    id: number,
    data: { answers: Record<number, string | string[]>; startedAt: string }
  ): Promise<SubmitExamResponse> {
    return request<SubmitExamResponse>(`/api/exams/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

interface RecordListParams {
  keyword?: string;
  department?: string;
  examCategory?: ExamCategory;
  passed?: boolean;
  signed?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export const records = {
  getList(params: RecordListParams): Promise<PaginatedResult<LearningRecord>> {
    const query = new URLSearchParams();
    if (params.keyword) query.set('keyword', params.keyword);
    if (params.department) query.set('department', params.department);
    if (params.examCategory) query.set('examCategory', params.examCategory);
    if (params.passed !== undefined) query.set('passed', String(params.passed));
    if (params.signed !== undefined) query.set('signed', String(params.signed));
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.page) query.set('page', String(params.page));
    if (params.pageSize) query.set('pageSize', String(params.pageSize));
    const url = query.toString() ? `/api/records?${query.toString()}` : '/api/records';
    return request<PaginatedResult<LearningRecord>>(url);
  },

  getDetail(id: number): Promise<LearningRecordDetail> {
    return request<LearningRecordDetail>(`/api/records/${id}`);
  },

  sign(id: number, signatureData: { signatureData: string; declarationRead: boolean }): Promise<LearningRecord> {
    return request<LearningRecord>(`/api/records/${id}/sign`, {
      method: 'POST',
      body: JSON.stringify(signatureData),
    });
  },
};

interface AdminQuestionListParams {
  keyword?: string;
  category?: string;
  type?: QuestionType;
  difficulty?: QuestionDifficulty;
  page?: number;
  pageSize?: number;
}

interface AdminExamListParams {
  keyword?: string;
  category?: ExamCategory;
  status?: ExamStatus;
  page?: number;
  pageSize?: number;
}

interface AdminUserListParams {
  keyword?: string;
  role?: string;
  department?: string;
  page?: number;
  pageSize?: number;
}

export const admin = {
  getQuestions(params: AdminQuestionListParams): Promise<PaginatedResult<Question>> {
    const query = new URLSearchParams();
    if (params.keyword) query.set('keyword', params.keyword);
    if (params.category) query.set('category', params.category);
    if (params.type) query.set('type', params.type);
    if (params.difficulty) query.set('difficulty', params.difficulty);
    if (params.page) query.set('page', String(params.page));
    if (params.pageSize) query.set('pageSize', String(params.pageSize));
    const url = query.toString() ? `/api/admin/questions?${query.toString()}` : '/api/admin/questions';
    return request<PaginatedResult<Question>>(url);
  },

  createQuestion(data: Partial<Question> & { correctAnswer: string | string[] }): Promise<Question> {
    return request<Question>('/api/admin/questions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateQuestion(id: number, data: Partial<Question>): Promise<Question> {
    return request<Question>(`/api/admin/questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteQuestion(id: number): Promise<null> {
    return request<null>(`/api/admin/questions/${id}`, {
      method: 'DELETE',
    });
  },

  getExams(params: AdminExamListParams): Promise<PaginatedResult<ExamListItem>> {
    const query = new URLSearchParams();
    if (params.keyword) query.set('keyword', params.keyword);
    if (params.category) query.set('category', params.category);
    if (params.status) query.set('status', params.status);
    if (params.page) query.set('page', String(params.page));
    if (params.pageSize) query.set('pageSize', String(params.pageSize));
    const url = query.toString() ? `/api/admin/exams?${query.toString()}` : '/api/admin/exams';
    return request<PaginatedResult<ExamListItem>>(url);
  },

  createExam(data: unknown): Promise<{ id: number }> {
    return request<{ id: number }>('/api/admin/exams', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateExam(id: number, data: unknown): Promise<null> {
    return request<null>(`/api/admin/exams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getUsers(params: AdminUserListParams): Promise<PaginatedResult<User>> {
    const query = new URLSearchParams();
    if (params.keyword) query.set('keyword', params.keyword);
    if (params.role) query.set('role', params.role);
    if (params.department) query.set('department', params.department);
    if (params.page) query.set('page', String(params.page));
    if (params.pageSize) query.set('pageSize', String(params.pageSize));
    const url = query.toString() ? `/api/admin/users?${query.toString()}` : '/api/admin/users';
    return request<PaginatedResult<User>>(url);
  },

  createUser(data: Partial<User> & { password: string }): Promise<User> {
    return request<User>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateUser(id: number, data: Partial<User>): Promise<User> {
    return request<User>(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getPositions(): Promise<Position[]> {
    return request<Position[]>('/api/admin/positions');
  },

  createPosition(data: Partial<Position>): Promise<Position> {
    return request<Position>('/api/admin/positions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updatePosition(id: number, data: Partial<Position>): Promise<Position> {
    return request<Position>(`/api/admin/positions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getReportSummary(): Promise<ReportSummary> {
    return request<ReportSummary>('/api/admin/reports/summary');
  },
};

const api = {
  auth,
  exams,
  records,
  admin,
};

export default api;
