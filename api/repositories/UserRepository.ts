import { getDb } from '../db/index.js';
import type { User } from '../../shared/types.js';

export interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  real_name: string;
  role: User['role'];
  department: string;
  position_id: number | null;
  is_high_risk: number | boolean;
  status: 'active' | 'disabled';
  position_name?: string | null;
}

function mapRowToUser(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    realName: row.real_name,
    role: row.role,
    department: row.department,
    positionId: row.position_id,
    positionName: row.position_name ?? null,
    isHighRisk: Boolean(row.is_high_risk),
    status: row.status,
  };
}

class UserRepository {
  findByUsername(username: string): (User & { passwordHash: string }) | null {
    const db = getDb();
    const row = db
      .prepare(
        `SELECT u.*, p.name as position_name
         FROM users u
         LEFT JOIN positions p ON u.position_id = p.id
         WHERE u.username = ?`
      )
      .get(username) as UserRow | undefined;
    if (!row) return null;
    const user = mapRowToUser(row);
    return { ...user, passwordHash: (row as UserRow & { password_hash: string }).password_hash };
  }

  findById(id: number): User | null {
    const db = getDb();
    const row = db
      .prepare(
        `SELECT u.*, p.name as position_name
         FROM users u
         LEFT JOIN positions p ON u.position_id = p.id
         WHERE u.id = ?`
      )
      .get(id) as UserRow | undefined;
    return row ? mapRowToUser(row) : null;
  }

  findAll(query?: {
    keyword?: string;
    role?: string;
    department?: string;
    page?: number;
    pageSize?: number;
  }): { list: User[]; total: number } {
    const db = getDb();
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (query?.keyword) {
      conditions.push('(u.username LIKE ? OR u.real_name LIKE ?)');
      params.push(`%${query.keyword}%`, `%${query.keyword}%`);
    }
    if (query?.role) {
      conditions.push('u.role = ?');
      params.push(query.role);
    }
    if (query?.department) {
      conditions.push('u.department = ?');
      params.push(query.department);
    }

    const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = db
      .prepare(`SELECT COUNT(*) as total FROM users u ${whereSql}`)
      .get(...params) as { total: number };

    const page = query?.page ?? 1;
    const pageSize = query?.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    const rows = db
      .prepare(
        `SELECT u.*, p.name as position_name
         FROM users u
         LEFT JOIN positions p ON u.position_id = p.id
         ${whereSql}
         ORDER BY u.id DESC
         LIMIT ? OFFSET ?`
      )
      .all(...params, pageSize, offset) as UserRow[];

    return {
      list: rows.map(mapRowToUser),
      total: countRow.total,
    };
  }

  create(data: {
    username: string;
    passwordHash: string;
    realName: string;
    role: User['role'];
    department: string;
    positionId: number | null;
    isHighRisk: boolean;
    status: 'active' | 'disabled';
  }): User {
    const db = getDb();
    const info = db
      .prepare(
        `INSERT INTO users (username, password_hash, real_name, role, department, position_id, is_high_risk, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        data.username,
        data.passwordHash,
        data.realName,
        data.role,
        data.department,
        data.positionId,
        data.isHighRisk ? 1 : 0,
        data.status
      );
    const user = this.findById(Number(info.lastInsertRowid));
    if (!user) throw new Error('创建用户失败');
    return user;
  }

  update(
    id: number,
    data: Partial<{
      realName: string;
      role: User['role'];
      department: string;
      positionId: number | null;
      isHighRisk: boolean;
      status: 'active' | 'disabled';
      passwordHash: string;
    }>
  ): User | null {
    const db = getDb();
    const fields: string[] = [];
    const params: unknown[] = [];

    if (data.realName !== undefined) {
      fields.push('real_name = ?');
      params.push(data.realName);
    }
    if (data.role !== undefined) {
      fields.push('role = ?');
      params.push(data.role);
    }
    if (data.department !== undefined) {
      fields.push('department = ?');
      params.push(data.department);
    }
    if (data.positionId !== undefined) {
      fields.push('position_id = ?');
      params.push(data.positionId);
    }
    if (data.isHighRisk !== undefined) {
      fields.push('is_high_risk = ?');
      params.push(data.isHighRisk ? 1 : 0);
    }
    if (data.status !== undefined) {
      fields.push('status = ?');
      params.push(data.status);
    }
    if (data.passwordHash !== undefined) {
      fields.push('password_hash = ?');
      params.push(data.passwordHash);
    }
    fields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    return this.findById(id);
  }
}

export default new UserRepository();
