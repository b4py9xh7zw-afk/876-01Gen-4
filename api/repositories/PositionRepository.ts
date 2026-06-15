import { getDb } from '../db/index.js';
import type { Position } from '../../shared/types.js';

export interface PositionRow {
  id: number;
  name: string;
  department: string;
  is_high_risk: number | boolean;
  required_pass_score: number;
}

function mapRowToPosition(row: PositionRow): Position {
  return {
    id: row.id,
    name: row.name,
    department: row.department,
    isHighRisk: Boolean(row.is_high_risk),
    requiredPassScore: row.required_pass_score,
  };
}

class PositionRepository {
  findAll(): Position[] {
    const db = getDb();
    const rows = db
      .prepare('SELECT * FROM positions ORDER BY id')
      .all() as PositionRow[];
    return rows.map(mapRowToPosition);
  }

  findById(id: number): Position | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM positions WHERE id = ?').get(id) as PositionRow | undefined;
    return row ? mapRowToPosition(row) : null;
  }

  create(data: {
    name: string;
    department: string;
    isHighRisk: boolean;
    requiredPassScore: number;
  }): Position {
    const db = getDb();
    const info = db
      .prepare(
        'INSERT INTO positions (name, department, is_high_risk, required_pass_score) VALUES (?, ?, ?, ?)'
      )
      .run(
        data.name,
        data.department,
        data.isHighRisk ? 1 : 0,
        data.requiredPassScore
      );
    const position = this.findById(Number(info.lastInsertRowid));
    if (!position) throw new Error('创建职位失败');
    return position;
  }

  update(
    id: number,
    data: Partial<{
      name: string;
      department: string;
      isHighRisk: boolean;
      requiredPassScore: number;
    }>
  ): Position | null {
    const db = getDb();
    const fields: string[] = [];
    const params: unknown[] = [];

    if (data.name !== undefined) {
      fields.push('name = ?');
      params.push(data.name);
    }
    if (data.department !== undefined) {
      fields.push('department = ?');
      params.push(data.department);
    }
    if (data.isHighRisk !== undefined) {
      fields.push('is_high_risk = ?');
      params.push(data.isHighRisk ? 1 : 0);
    }
    if (data.requiredPassScore !== undefined) {
      fields.push('required_pass_score = ?');
      params.push(data.requiredPassScore);
    }
    params.push(id);

    db.prepare(`UPDATE positions SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    return this.findById(id);
  }
}

export default new PositionRepository();
