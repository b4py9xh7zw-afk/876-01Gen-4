import { getDb } from '../db/index.js';
import type {
  LearningRecord,
  LearningRecordDetail,
  ReportSummary,
} from '../../shared/types.js';
import { CATEGORY_MAP } from '../../shared/types.js';

export interface LearningRecordRow {
  id: number;
  attempt_id: number;
  user_id: number;
  username: string;
  real_name: string;
  department: string;
  position_name: string;
  is_high_risk_position: number | boolean;
  exam_id: number;
  exam_title: string;
  exam_category: string;
  score: number | null;
  total_score: number | null;
  pass_score: number;
  passed: number | boolean | null;
  started_at: string;
  submitted_at: string | null;
  duration_seconds: number | null;
  signed_at: string | null;
  signature_data: string | null;
  ip_address: string | null;
  user_agent: string | null;
  attempt_number: number;
}

function mapRowToLearningRecord(row: LearningRecordRow): LearningRecord {
  return {
    id: row.id,
    attemptId: row.attempt_id,
    userId: row.user_id,
    username: row.username,
    realName: row.real_name,
    department: row.department,
    positionName: row.position_name,
    isHighRiskPosition: Boolean(row.is_high_risk_position),
    examId: row.exam_id,
    examTitle: row.exam_title,
    examCategory: row.exam_category,
    examCategoryName: CATEGORY_MAP[row.exam_category as keyof typeof CATEGORY_MAP] || row.exam_category,
    score: row.score ?? 0,
    totalScore: row.total_score ?? 0,
    passScore: row.pass_score,
    passed: Boolean(row.passed),
    startedAt: row.started_at,
    submittedAt: row.submitted_at ?? '',
    durationSeconds: row.duration_seconds ?? 0,
    signedAt: row.signed_at,
    signature: row.signature_data,
    ipAddress: row.ip_address ?? '',
    userAgent: row.user_agent ?? '',
    attemptNumber: row.attempt_number,
  };
}

class RecordRepository {
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
    currentUser: { id: number; role: string; department: string }
  ): { list: LearningRecord[]; total: number } {
    const db = getDb();
    const conditions: string[] = ['ea.submitted_at IS NOT NULL'];
    const params: unknown[] = [];

    if (currentUser.role === 'employee') {
      conditions.push('ea.user_id = ?');
      params.push(currentUser.id);
    } else if (currentUser.role === 'dept_manager') {
      conditions.push('u.department = ?');
      params.push(currentUser.department);
    }

    if (query.keyword) {
      conditions.push('(u.real_name LIKE ? OR e.title LIKE ?)');
      params.push(`%${query.keyword}%`, `%${query.keyword}%`);
    }
    if (query.department) {
      conditions.push('u.department = ?');
      params.push(query.department);
    }
    if (query.examCategory) {
      conditions.push('e.category = ?');
      params.push(query.examCategory);
    }
    if (query.passed !== undefined) {
      conditions.push('ea.passed = ?');
      params.push(query.passed ? 1 : 0);
    }
    if (query.signed !== undefined) {
      if (query.signed) {
        conditions.push('lr.signed_at IS NOT NULL');
      } else {
        conditions.push('lr.signed_at IS NULL');
      }
    }
    if (query.startDate) {
      conditions.push('ea.submitted_at >= ?');
      params.push(query.startDate);
    }
    if (query.endDate) {
      conditions.push('ea.submitted_at <= ?');
      params.push(query.endDate);
    }

    const whereSql = `WHERE ${conditions.join(' AND ')}`;

    const baseFrom = `
      FROM learning_records lr
      INNER JOIN exam_attempts ea ON lr.attempt_id = ea.id
      INNER JOIN users u ON ea.user_id = u.id
      LEFT JOIN positions p ON u.position_id = p.id
      INNER JOIN exams e ON ea.exam_id = e.id
    `;

    const countRow = db
      .prepare(`SELECT COUNT(*) as total ${baseFrom} ${whereSql}`)
      .get(...params) as { total: number };

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const rows = db
      .prepare(
        `SELECT lr.id, lr.attempt_id, lr.signed_at, lr.signature_data,
                ea.user_id, ea.exam_id, ea.score, ea.total_score, ea.passed,
                ea.started_at, ea.submitted_at, ea.duration_seconds, ea.ip_address, ea.user_agent, ea.attempt_number,
                u.username, u.real_name, u.department,
                COALESCE(p.name, '') as position_name,
                COALESCE(p.is_high_risk, 0) as is_high_risk_position,
                e.title as exam_title, e.category as exam_category, e.pass_score
         ${baseFrom}
         ${whereSql}
         ORDER BY ea.submitted_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(...params, pageSize, offset) as LearningRecordRow[];

    return {
      list: rows.map(mapRowToLearningRecord),
      total: countRow.total,
    };
  }

  getRecordDetail(
    id: number,
    currentUser: { id: number; role: string; department: string }
  ): LearningRecordDetail | null {
    const db = getDb();
    const row = db
      .prepare(
        `SELECT lr.id, lr.attempt_id, lr.signed_at, lr.signature_data,
                ea.user_id, ea.exam_id, ea.score, ea.total_score, ea.passed,
                ea.started_at, ea.submitted_at, ea.duration_seconds, ea.ip_address, ea.user_agent, ea.attempt_number,
                u.username, u.real_name, u.department,
                COALESCE(p.name, '') as position_name,
                COALESCE(p.is_high_risk, 0) as is_high_risk_position,
                e.title as exam_title, e.category as exam_category, e.pass_score
         FROM learning_records lr
         INNER JOIN exam_attempts ea ON lr.attempt_id = ea.id
         INNER JOIN users u ON ea.user_id = u.id
         LEFT JOIN positions p ON u.position_id = p.id
         INNER JOIN exams e ON ea.exam_id = e.id
         WHERE lr.id = ?`
      )
      .get(id) as LearningRecordRow | undefined;

    if (!row) return null;

    const record = mapRowToLearningRecord(row);

    if (currentUser.role === 'employee' && record.userId !== currentUser.id) {
      return null;
    }
    if (currentUser.role === 'dept_manager' && record.department !== currentUser.department) {
      return null;
    }

    const answers = row as LearningRecordRow & { answers_json?: string };
    const attemptRow = db
      .prepare('SELECT answers_json FROM exam_attempts WHERE id = ?')
      .get(row.attempt_id) as { answers_json: string } | undefined;
    const userAnswersMap: Record<number, string | string[]> = {};
    if (attemptRow?.answers_json) {
      try {
        const parsed = JSON.parse(attemptRow.answers_json);
        if (parsed && typeof parsed === 'object') {
          Object.assign(userAnswersMap, parsed);
        }
      } catch {
        // ignore
      }
    }

    const questionRows = db
      .prepare(
        `SELECT q.id, q.type, q.content, q.options_json, q.correct_answer, q.score
         FROM exam_questions eq
         INNER JOIN questions q ON eq.question_id = q.id
         WHERE eq.exam_id = ?
         ORDER BY eq.order_num, q.id`
      )
      .all(row.exam_id) as Array<{
      id: number;
      type: string;
      content: string;
      options_json: string;
      correct_answer: string;
      score: number;
    }>;

    const answerDetails = questionRows.map((q) => {
      const options = JSON.parse(q.options_json);
      let correctAnswer: string | string[];
      try {
        correctAnswer = JSON.parse(q.correct_answer);
      } catch {
        correctAnswer = q.correct_answer;
      }
      const userAnswer = userAnswersMap[q.id] ?? (q.type === 'multiple' ? [] : '');

      let correct = false;
      if (q.type === 'multiple' && Array.isArray(correctAnswer) && Array.isArray(userAnswer)) {
        const sortedCorrect = [...correctAnswer].sort();
        const sortedUser = [...userAnswer].sort();
        correct =
          sortedCorrect.length === sortedUser.length &&
          sortedCorrect.every((v, i) => v === sortedUser[i]);
      } else {
        correct = userAnswer === correctAnswer;
      }

      return {
        questionId: q.id,
        questionContent: q.content,
        questionType: q.type,
        correct,
        userAnswer,
        correctAnswer,
        options,
        score: q.score,
        userScore: correct ? q.score : 0,
      };
    });

    return {
      ...record,
      answerDetails,
    };
  }

  signRecord(
    id: number,
    userId: number,
    signatureData: string,
    declarationRead: boolean
  ): LearningRecord | null {
    const db = getDb();
    const row = db
      .prepare(
        `SELECT lr.*, ea.user_id FROM learning_records lr
         INNER JOIN exam_attempts ea ON lr.attempt_id = ea.id
         WHERE lr.id = ?`
      )
      .get(id) as (LearningRecordRow & { user_id: number }) | undefined;

    if (!row) return null;
    if (row.user_id !== userId) return null;

    const signedAt = new Date().toISOString();
    const signatureToken = Buffer.from(
      `${id}-${userId}-${Date.now()}-${Math.random().toString(36).slice(2)}`
    ).toString('base64');

    db.prepare(
      `UPDATE learning_records
       SET signature_data = ?, signed_at = ?, signature_token = ?
       WHERE id = ?`
    ).run(signatureData, signedAt, signatureToken, id);

    return this.getRecords(
      { page: 1, pageSize: 1 },
      { id: userId, role: 'employee', department: '' }
    ).list.find((r) => r.id === id) || null;
  }

  getReportSummary(): ReportSummary {
    const db = getDb();

    const totalExamsRow = db
      .prepare("SELECT COUNT(*) as total FROM exams WHERE status = 'published'")
      .get() as { total: number };

    const participantsRow = db
      .prepare('SELECT COUNT(DISTINCT user_id) as total FROM exam_attempts WHERE submitted_at IS NOT NULL')
      .get() as { total: number };

    const allPublishedExams = db
      .prepare("SELECT id FROM exams WHERE status = 'published'")
      .all() as Array<{ id: number }>;

    let totalTargetUsers = 0;
    let totalCompleted = 0;
    let totalPassed = 0;

    for (const exam of allPublishedExams) {
      const targetRow = db
        .prepare(
          `SELECT COUNT(*) as total FROM users u
           WHERE u.status = 'active' AND u.role IN ('employee', 'dept_manager')
           AND EXISTS (
             SELECT 1 FROM exam_targets et
             WHERE et.exam_id = ?
             AND (et.target_type = 'department' AND (et.target_value = 'all' OR et.target_value = u.department))
             OR (et.target_type = 'position' AND u.position_id = CAST(et.target_value AS INTEGER))
           )`
        )
        .get(exam.id) as { total: number };
      totalTargetUsers += targetRow.total;

      const completedRow = db
        .prepare(
          'SELECT COUNT(DISTINCT user_id) as total FROM exam_attempts WHERE exam_id = ? AND submitted_at IS NOT NULL'
        )
        .get(exam.id) as { total: number };
      totalCompleted += completedRow.total;

      const passedRow = db
        .prepare(
          "SELECT COUNT(DISTINCT user_id) as total FROM exam_attempts WHERE exam_id = ? AND passed = 1"
        )
        .get(exam.id) as { total: number };
      totalPassed += passedRow.total;
    }

    const completionRate =
      totalTargetUsers > 0 ? Math.round((totalCompleted / totalTargetUsers) * 100) / 100 : 0;
    const passRate = totalCompleted > 0 ? Math.round((totalPassed / totalCompleted) * 100) / 100 : 0;

    const departments = db
      .prepare("SELECT DISTINCT department FROM users WHERE status = 'active' AND department IS NOT NULL")
      .all() as Array<{ department: string }>;

    const byDepartment = departments.map((d) => {
      const deptTotalRow = db
        .prepare(
          `SELECT COUNT(DISTINCT u.id) as total
           FROM users u
           WHERE u.department = ? AND u.status = 'active' AND u.role IN ('employee', 'dept_manager')`
        )
        .get(d.department) as { total: number };

      const deptCompletedRow = db
        .prepare(
          `SELECT COUNT(DISTINCT ea.user_id) as total
           FROM exam_attempts ea
           INNER JOIN users u ON ea.user_id = u.id
           WHERE u.department = ? AND ea.submitted_at IS NOT NULL`
        )
        .get(d.department) as { total: number };

      const deptPassedRow = db
        .prepare(
          `SELECT COUNT(DISTINCT ea.user_id) as total
           FROM exam_attempts ea
           INNER JOIN users u ON ea.user_id = u.id
           WHERE u.department = ? AND ea.passed = 1`
        )
        .get(d.department) as { total: number };

      return {
        name: d.department,
        total: deptTotalRow.total,
        completed: deptCompletedRow.total,
        passed: deptPassedRow.total,
      };
    });

    const categories = ['anti_fraud', 'data_security', 'procurement', 'other'];
    const byCategory = categories.map((cat) => {
      const catTotalRow = db
        .prepare(
          `SELECT COUNT(DISTINCT u.id) as total
           FROM users u
           INNER JOIN exam_targets et ON (
             (et.target_type = 'department' AND (et.target_value = 'all' OR et.target_value = u.department))
             OR (et.target_type = 'position' AND u.position_id = CAST(et.target_value AS INTEGER))
           )
           INNER JOIN exams e ON et.exam_id = e.id
           WHERE e.category = ? AND e.status = 'published' AND u.status = 'active'
           AND u.role IN ('employee', 'dept_manager')`
        )
        .get(cat) as { total: number };

      const catCompletedRow = db
        .prepare(
          `SELECT COUNT(DISTINCT ea.user_id) as total
           FROM exam_attempts ea
           INNER JOIN exams e ON ea.exam_id = e.id
           WHERE e.category = ? AND ea.submitted_at IS NOT NULL`
        )
        .get(cat) as { total: number };

      const catPassedRow = db
        .prepare(
          `SELECT COUNT(DISTINCT ea.user_id) as total
           FROM exam_attempts ea
           INNER JOIN exams e ON ea.exam_id = e.id
           WHERE e.category = ? AND ea.passed = 1`
        )
        .get(cat) as { total: number };

      return {
        name: CATEGORY_MAP[cat as keyof typeof CATEGORY_MAP] || cat,
        total: catTotalRow.total,
        completed: catCompletedRow.total,
        passed: catPassedRow.total,
      };
    });

    const highRiskTotalRow = db
      .prepare(
        "SELECT COUNT(DISTINCT id) as total FROM users WHERE is_high_risk = 1 AND status = 'active' AND role IN ('employee', 'dept_manager')"
      )
      .get() as { total: number };
    const highRiskPassedRow = db
      .prepare(
        "SELECT COUNT(DISTINCT ea.user_id) as total FROM exam_attempts ea INNER JOIN users u ON ea.user_id = u.id WHERE u.is_high_risk = 1 AND ea.passed = 1"
      )
      .get() as { total: number };

    const normalTotalRow = db
      .prepare(
        "SELECT COUNT(DISTINCT id) as total FROM users WHERE is_high_risk = 0 AND status = 'active' AND role IN ('employee', 'dept_manager')"
      )
      .get() as { total: number };
    const normalPassedRow = db
      .prepare(
        "SELECT COUNT(DISTINCT ea.user_id) as total FROM exam_attempts ea INNER JOIN users u ON ea.user_id = u.id WHERE u.is_high_risk = 0 AND ea.passed = 1"
      )
      .get() as { total: number };

    const last30Days: Array<{ date: string; completed: number; passed: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      const completedRow = db
        .prepare(
          'SELECT COUNT(*) as total FROM exam_attempts WHERE DATE(submitted_at) = ?'
        )
        .get(dateStr) as { total: number };
      const passedRow = db
        .prepare(
          "SELECT COUNT(*) as total FROM exam_attempts WHERE DATE(submitted_at) = ? AND passed = 1"
        )
        .get(dateStr) as { total: number };
      last30Days.push({
        date: dateStr,
        completed: completedRow.total,
        passed: passedRow.total,
      });
    }

    return {
      totalExams: totalExamsRow.total,
      totalParticipants: participantsRow.total,
      completionRate,
      passRate,
      byDepartment,
      byCategory,
      byRiskLevel: {
        highRisk: { total: highRiskTotalRow.total, passed: highRiskPassedRow.total },
        normal: { total: normalTotalRow.total, passed: normalPassedRow.total },
      },
      trend: last30Days,
    };
  }
}

export default new RecordRepository();
