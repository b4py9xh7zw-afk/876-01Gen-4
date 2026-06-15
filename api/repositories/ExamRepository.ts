import { getDb } from '../db/index.js';
import type {
  ExamListItem,
  ExamDetail,
  ExamQuestion,
  ExamCategory,
  ExamStatus,
  ExamUserStatus,
  LearningMaterial,
} from '../../shared/types.js';
import { CATEGORY_MAP } from '../../shared/types.js';

export interface ExamRow {
  id: number;
  title: string;
  category: ExamCategory;
  description: string;
  pass_score: number;
  high_risk_pass_score: number;
  duration_minutes: number;
  start_time: string;
  end_time: string;
  allow_retry: number | boolean;
  max_retries: number;
  published_by: number;
  published_at: string;
  status: ExamStatus;
  published_by_name?: string;
}

export interface ExamAttemptRow {
  id: number;
  user_id: number;
  exam_id: number;
  attempt_number: number;
  answers_json: string | null;
  score: number | null;
  total_score: number | null;
  passed: number | boolean | null;
  started_at: string;
  submitted_at: string | null;
  duration_seconds: number | null;
  ip_address: string | null;
  user_agent: string | null;
}

function mapRowToExamListItem(
  row: ExamRow,
  totalQuestions: number,
  totalScore: number,
  userStatus: ExamUserStatus,
  userScore: number | null,
  userAttempts: number
): ExamListItem {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    categoryName: CATEGORY_MAP[row.category] || row.category,
    description: row.description,
    passScore: row.pass_score,
    highRiskPassScore: row.high_risk_pass_score,
    duration: row.duration_minutes,
    totalQuestions,
    totalScore,
    startTime: row.start_time,
    endTime: row.end_time,
    allowRetry: Boolean(row.allow_retry),
    maxRetries: row.max_retries,
    publishedBy: row.published_by_name || '',
    publishedAt: row.published_at,
    userStatus,
    userScore,
    userAttempts,
  };
}

class ExamRepository {
  findExamListForUser(
    userId: number,
    query?: {
      keyword?: string;
      category?: string;
      userStatus?: string;
      page?: number;
      pageSize?: number;
    }
  ): { list: ExamListItem[]; total: number } {
    const db = getDb();
    const conditions: string[] = ["e.status = 'published'"];
    const params: unknown[] = [];

    if (query?.keyword) {
      conditions.push('e.title LIKE ?');
      params.push(`%${query.keyword}%`);
    }
    if (query?.category) {
      conditions.push('e.category = ?');
      params.push(query.category);
    }

    const whereSql = `WHERE ${conditions.join(' AND ')}`;

    const countRow = db
      .prepare(`SELECT COUNT(*) as total FROM exams e ${whereSql}`)
      .get(...params) as { total: number };

    const page = query?.page ?? 1;
    const pageSize = query?.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const rows = db
      .prepare(
        `SELECT e.*, u.real_name as published_by_name
         FROM exams e
         LEFT JOIN users u ON e.published_by = u.id
         ${whereSql}
         ORDER BY e.published_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(...params, pageSize, offset) as ExamRow[];

    const list: ExamListItem[] = [];
    for (const row of rows) {
      const { totalQuestions, totalScore } = this.getExamStats(row.id);
      const { userStatus, userScore, userAttempts } = this.getUserExamStatus(userId, row.id);

      if (query?.userStatus && query.userStatus !== userStatus) {
        continue;
      }

      list.push(
        mapRowToExamListItem(row, totalQuestions, totalScore, userStatus, userScore, userAttempts)
      );
    }

    return { list, total: countRow.total };
  }

  getExamStats(examId: number): { totalQuestions: number; totalScore: number } {
    const db = getDb();
    const row = db
      .prepare(
        `SELECT COUNT(*) as total_questions, COALESCE(SUM(q.score), 0) as total_score
         FROM exam_questions eq
         LEFT JOIN questions q ON eq.question_id = q.id
         WHERE eq.exam_id = ?`
      )
      .get(examId) as { total_questions: number; total_score: number };
    return {
      totalQuestions: row.total_questions,
      totalScore: row.total_score,
    };
  }

  getUserExamStatus(
    userId: number,
    examId: number
  ): { userStatus: ExamUserStatus; userScore: number | null; userAttempts: number } {
    const db = getDb();
    const examRow = db.prepare('SELECT * FROM exams WHERE id = ?').get(examId) as ExamRow | undefined;
    if (!examRow) {
      return { userStatus: 'not_started', userScore: null, userAttempts: 0 };
    }

    const attempts = db
      .prepare(
        'SELECT * FROM exam_attempts WHERE user_id = ? AND exam_id = ? ORDER BY attempt_number DESC'
      )
      .all(userId, examId) as ExamAttemptRow[];

    const userAttempts = attempts.length;

    const now = new Date();
    if (now > new Date(examRow.end_time)) {
      const latestAttempt = attempts[0];
      if (latestAttempt && latestAttempt.submitted_at) {
        const passed = Boolean(latestAttempt.passed);
        return {
          userStatus: passed ? 'passed' : 'failed',
          userScore: latestAttempt.score,
          userAttempts,
        };
      }
      return { userStatus: 'expired', userScore: null, userAttempts };
    }

    const latestAttempt = attempts[0];
    if (!latestAttempt) {
      return { userStatus: 'not_started', userScore: null, userAttempts };
    }

    if (!latestAttempt.submitted_at) {
      return { userStatus: 'in_progress', userScore: null, userAttempts };
    }

    const passed = Boolean(latestAttempt.passed);
    if (passed) {
      return {
        userStatus: 'passed',
        userScore: latestAttempt.score,
        userAttempts,
      };
    }

    if (Boolean(examRow.allow_retry) && userAttempts < examRow.max_retries) {
      return {
        userStatus: 'failed',
        userScore: latestAttempt.score,
        userAttempts,
      };
    }

    return {
      userStatus: 'failed',
      userScore: latestAttempt.score,
      userAttempts,
    };
  }

  findById(examId: number): ExamRow | null {
    const db = getDb();
    const row = db
      .prepare(
        `SELECT e.*, u.real_name as published_by_name
         FROM exams e
         LEFT JOIN users u ON e.published_by = u.id
         WHERE e.id = ?`
      )
      .get(examId) as ExamRow | undefined;
    return row ?? null;
  }

  getExamDetail(userId: number, examId: number): ExamDetail | null {
    const examRow = this.findById(examId);
    if (!examRow) return null;

    const { totalQuestions, totalScore } = this.getExamStats(examId);
    const { userStatus, userScore, userAttempts } = this.getUserExamStatus(userId, examId);
    const listItem = mapRowToExamListItem(
      examRow,
      totalQuestions,
      totalScore,
      userStatus,
      userScore,
      userAttempts
    );

    const materials = this.getExamMaterials(examId);

    return {
      ...listItem,
      learningMaterials: materials,
    };
  }

  getExamMaterials(examId: number): LearningMaterial[] {
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT lm.* FROM learning_materials lm
         INNER JOIN exam_materials em ON lm.id = em.material_id
         WHERE em.exam_id = ?
         ORDER BY lm.id`
      )
      .all(examId) as Array<{
      id: number;
      title: string;
      type: 'pdf' | 'doc' | 'text';
      content?: string;
    }>;
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      type: r.type,
      content: r.content,
    }));
  }

  getExamQuestions(examId: number): ExamQuestion[] {
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT q.* FROM questions q
         INNER JOIN exam_questions eq ON q.id = eq.question_id
         WHERE eq.exam_id = ?
         ORDER BY eq.order_num, q.id`
      )
      .all(examId) as Array<{
      id: number;
      type: ExamQuestion['type'];
      content: string;
      score: number;
      options_json: string;
    }>;
    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      content: r.content,
      score: r.score,
      options: JSON.parse(r.options_json),
    }));
  }

  findAllAdmin(query?: {
    keyword?: string;
    category?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }): { list: ExamDetail[]; total: number } {
    const db = getDb();
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (query?.keyword) {
      conditions.push('title LIKE ?');
      params.push(`%${query.keyword}%`);
    }
    if (query?.category) {
      conditions.push('category = ?');
      params.push(query.category);
    }
    if (query?.status) {
      conditions.push('status = ?');
      params.push(query.status);
    }

    const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = db
      .prepare(`SELECT COUNT(*) as total FROM exams ${whereSql}`)
      .get(...params) as { total: number };

    const page = query?.page ?? 1;
    const pageSize = query?.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const rows = db
      .prepare(
        `SELECT e.*, u.real_name as published_by_name
         FROM exams e
         LEFT JOIN users u ON e.published_by = u.id
         ${whereSql}
         ORDER BY e.published_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(...params, pageSize, offset) as ExamRow[];

    const list: ExamDetail[] = [];
    for (const row of rows) {
      const { totalQuestions, totalScore } = this.getExamStats(row.id);
      const materials = this.getExamMaterials(row.id);
      const listItem = mapRowToExamListItem(
        row,
        totalQuestions,
        totalScore,
        'not_started',
        null,
        0
      );
      list.push({ ...listItem, learningMaterials: materials });
    }

    return { list, total: countRow.total };
  }

  createExam(data: {
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
    publishedBy: number;
    status: ExamStatus;
    questionIds: number[];
    materialIds: number[];
  }): number {
    const db = getDb();
    const tx = db.transaction(() => {
      const info = db
        .prepare(
          `INSERT INTO exams (title, category, description, pass_score, high_risk_pass_score,
           duration_minutes, start_time, end_time, allow_retry, max_retries, published_by, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          data.title,
          data.category,
          data.description,
          data.passScore,
          data.highRiskPassScore,
          data.durationMinutes,
          data.startTime,
          data.endTime,
          data.allowRetry ? 1 : 0,
          data.maxRetries,
          data.publishedBy,
          data.status
        );
      const examId = Number(info.lastInsertRowid);

      const insertQuestion = db.prepare(
        'INSERT INTO exam_questions (exam_id, question_id, order_num) VALUES (?, ?, ?)'
      );
      data.questionIds.forEach((qid, idx) => {
        insertQuestion.run(examId, qid, idx + 1);
      });

      const insertMaterial = db.prepare(
        'INSERT INTO exam_materials (exam_id, material_id) VALUES (?, ?)'
      );
      data.materialIds.forEach((mid) => {
        insertMaterial.run(examId, mid);
      });

      return examId;
    });
    return tx();
  }

  updateExam(
    examId: number,
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
    const db = getDb();
    const tx = db.transaction(() => {
      const fields: string[] = [];
      const params: unknown[] = [];

      if (data.title !== undefined) {
        fields.push('title = ?');
        params.push(data.title);
      }
      if (data.category !== undefined) {
        fields.push('category = ?');
        params.push(data.category);
      }
      if (data.description !== undefined) {
        fields.push('description = ?');
        params.push(data.description);
      }
      if (data.passScore !== undefined) {
        fields.push('pass_score = ?');
        params.push(data.passScore);
      }
      if (data.highRiskPassScore !== undefined) {
        fields.push('high_risk_pass_score = ?');
        params.push(data.highRiskPassScore);
      }
      if (data.durationMinutes !== undefined) {
        fields.push('duration_minutes = ?');
        params.push(data.durationMinutes);
      }
      if (data.startTime !== undefined) {
        fields.push('start_time = ?');
        params.push(data.startTime);
      }
      if (data.endTime !== undefined) {
        fields.push('end_time = ?');
        params.push(data.endTime);
      }
      if (data.allowRetry !== undefined) {
        fields.push('allow_retry = ?');
        params.push(data.allowRetry ? 1 : 0);
      }
      if (data.maxRetries !== undefined) {
        fields.push('max_retries = ?');
        params.push(data.maxRetries);
      }
      if (data.status !== undefined) {
        fields.push('status = ?');
        params.push(data.status);
      }
      if (fields.length > 0) {
        fields.push('updated_at = CURRENT_TIMESTAMP');
        params.push(examId);
        db.prepare(`UPDATE exams SET ${fields.join(', ')} WHERE id = ?`).run(...params);
      }

      if (data.questionIds !== undefined) {
        db.prepare('DELETE FROM exam_questions WHERE exam_id = ?').run(examId);
        const insertQuestion = db.prepare(
          'INSERT INTO exam_questions (exam_id, question_id, order_num) VALUES (?, ?, ?)'
        );
        data.questionIds.forEach((qid, idx) => {
          insertQuestion.run(examId, qid, idx + 1);
        });
      }

      if (data.materialIds !== undefined) {
        db.prepare('DELETE FROM exam_materials WHERE exam_id = ?').run(examId);
        const insertMaterial = db.prepare(
          'INSERT INTO exam_materials (exam_id, material_id) VALUES (?, ?)'
        );
        data.materialIds.forEach((mid) => {
          insertMaterial.run(examId, mid);
        });
      }
    });
    tx();
  }

  createAttempt(data: {
    userId: number;
    examId: number;
    attemptNumber: number;
    startedAt: string;
  }): number {
    const db = getDb();
    const info = db
      .prepare(
        `INSERT INTO exam_attempts (user_id, exam_id, attempt_number, started_at)
         VALUES (?, ?, ?, ?)`
      )
      .run(data.userId, data.examId, data.attemptNumber, data.startedAt);
    return Number(info.lastInsertRowid);
  }

  updateAttempt(
    attemptId: number,
    data: {
      answersJson: string;
      score: number;
      totalScore: number;
      passed: boolean;
      submittedAt: string;
      durationSeconds: number;
      ipAddress: string | null;
      userAgent: string | null;
    }
  ): void {
    const db = getDb();
    db.prepare(
      `UPDATE exam_attempts
       SET answers_json = ?, score = ?, total_score = ?, passed = ?,
           submitted_at = ?, duration_seconds = ?, ip_address = ?, user_agent = ?
       WHERE id = ?`
    ).run(
      data.answersJson,
      data.score,
      data.totalScore,
      data.passed ? 1 : 0,
      data.submittedAt,
      data.durationSeconds,
      data.ipAddress,
      data.userAgent,
      attemptId
    );
  }

  getUserAttempts(userId: number, examId: number): ExamAttemptRow[] {
    const db = getDb();
    return db
      .prepare(
        'SELECT * FROM exam_attempts WHERE user_id = ? AND exam_id = ? ORDER BY attempt_number DESC'
      )
      .all(userId, examId) as ExamAttemptRow[];
  }

  findAttemptById(attemptId: number): ExamAttemptRow | null {
    const db = getDb();
    const row = db
      .prepare('SELECT * FROM exam_attempts WHERE id = ?')
      .get(attemptId) as ExamAttemptRow | undefined;
    return row ?? null;
  }

  createLearningRecord(data: {
    attemptId: number;
    userId: number;
    examId: number;
  }): number {
    const db = getDb();
    const info = db
      .prepare(
        `INSERT OR IGNORE INTO learning_records (attempt_id, user_id, exam_id)
         VALUES (?, ?, ?)`
      )
      .run(data.attemptId, data.userId, data.examId);
    if (info.changes > 0) {
      return Number(info.lastInsertRowid);
    }
    const row = db
      .prepare('SELECT id FROM learning_records WHERE attempt_id = ?')
      .get(data.attemptId) as { id: number } | undefined;
    return row?.id ?? 0;
  }
}

export default new ExamRepository();
