import { getDb } from '../db/index.js';
import type { Question, QuestionType, QuestionDifficulty } from '../../shared/types.js';

export interface QuestionRow {
  id: number;
  type: QuestionType;
  category: string;
  content: string;
  options_json: string;
  correct_answer: string;
  score: number;
  difficulty: QuestionDifficulty;
  created_at: string;
}

function mapRowToQuestion(row: QuestionRow): Question {
  let correctAnswer: string | string[];
  try {
    correctAnswer = JSON.parse(row.correct_answer);
  } catch {
    correctAnswer = row.correct_answer;
  }
  return {
    id: row.id,
    type: row.type,
    category: row.category,
    content: row.content,
    options: JSON.parse(row.options_json),
    correctAnswer,
    score: row.score,
    difficulty: row.difficulty,
    createdAt: row.created_at,
  };
}

class QuestionRepository {
  findAll(query?: {
    keyword?: string;
    category?: string;
    type?: string;
    difficulty?: string;
    page?: number;
    pageSize?: number;
  }): { list: Question[]; total: number } {
    const db = getDb();
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (query?.keyword) {
      conditions.push('content LIKE ?');
      params.push(`%${query.keyword}%`);
    }
    if (query?.category) {
      conditions.push('category = ?');
      params.push(query.category);
    }
    if (query?.type) {
      conditions.push('type = ?');
      params.push(query.type);
    }
    if (query?.difficulty) {
      conditions.push('difficulty = ?');
      params.push(query.difficulty);
    }

    const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = db
      .prepare(`SELECT COUNT(*) as total FROM questions ${whereSql}`)
      .get(...params) as { total: number };

    const page = query?.page ?? 1;
    const pageSize = query?.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const rows = db
      .prepare(
        `SELECT * FROM questions ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`
      )
      .all(...params, pageSize, offset) as QuestionRow[];

    return {
      list: rows.map(mapRowToQuestion),
      total: countRow.total,
    };
  }

  findById(id: number): Question | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM questions WHERE id = ?').get(id) as QuestionRow | undefined;
    return row ? mapRowToQuestion(row) : null;
  }

  findByIds(ids: number[]): Question[] {
    if (ids.length === 0) return [];
    const db = getDb();
    const placeholders = ids.map(() => '?').join(',');
    const rows = db
      .prepare(`SELECT * FROM questions WHERE id IN (${placeholders})`)
      .all(...ids) as QuestionRow[];
    return rows.map(mapRowToQuestion);
  }

  create(data: {
    type: QuestionType;
    category: string;
    content: string;
    options: Array<{ key: string; value: string }>;
    correctAnswer: string | string[];
    score: number;
    difficulty: QuestionDifficulty;
    createdBy: number;
  }): Question {
    const db = getDb();
    const info = db
      .prepare(
        `INSERT INTO questions (type, category, content, options_json, correct_answer, score, difficulty, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        data.type,
        data.category,
        data.content,
        JSON.stringify(data.options),
        typeof data.correctAnswer === 'string' ? data.correctAnswer : JSON.stringify(data.correctAnswer),
        data.score,
        data.difficulty,
        data.createdBy
      );
    const question = this.findById(Number(info.lastInsertRowid));
    if (!question) throw new Error('创建题目失败');
    return question;
  }

  update(
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
    const db = getDb();
    const fields: string[] = [];
    const params: unknown[] = [];

    if (data.type !== undefined) {
      fields.push('type = ?');
      params.push(data.type);
    }
    if (data.category !== undefined) {
      fields.push('category = ?');
      params.push(data.category);
    }
    if (data.content !== undefined) {
      fields.push('content = ?');
      params.push(data.content);
    }
    if (data.options !== undefined) {
      fields.push('options_json = ?');
      params.push(JSON.stringify(data.options));
    }
    if (data.correctAnswer !== undefined) {
      fields.push('correct_answer = ?');
      params.push(
        typeof data.correctAnswer === 'string' ? data.correctAnswer : JSON.stringify(data.correctAnswer)
      );
    }
    if (data.score !== undefined) {
      fields.push('score = ?');
      params.push(data.score);
    }
    if (data.difficulty !== undefined) {
      fields.push('difficulty = ?');
      params.push(data.difficulty);
    }
    params.push(id);

    db.prepare(`UPDATE questions SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    return this.findById(id);
  }

  delete(id: number): boolean {
    const db = getDb();
    const info = db.prepare('DELETE FROM questions WHERE id = ?').run(id);
    return info.changes > 0;
  }
}

export default new QuestionRepository();
