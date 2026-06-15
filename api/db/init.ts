import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.join(__dirname, "../../data");
const DB_PATH = path.join(DB_DIR, "compliance.db");

function createTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      department VARCHAR(100) NOT NULL,
      is_high_risk BOOLEAN NOT NULL DEFAULT 0,
      required_pass_score INTEGER NOT NULL DEFAULT 80,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      real_name VARCHAR(50) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'employee',
      department VARCHAR(100) NOT NULL,
      position_id INTEGER,
      is_high_risk BOOLEAN NOT NULL DEFAULT 0,
      status VARCHAR(20) NOT NULL DEFAULT 'active',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (position_id) REFERENCES positions(id)
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type VARCHAR(20) NOT NULL,
      category VARCHAR(50) NOT NULL,
      content TEXT NOT NULL,
      options_json TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 10,
      difficulty VARCHAR(20) NOT NULL DEFAULT 'medium',
      created_by INTEGER NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title VARCHAR(200) NOT NULL,
      category VARCHAR(50) NOT NULL,
      description TEXT,
      pass_score INTEGER NOT NULL DEFAULT 60,
      high_risk_pass_score INTEGER NOT NULL DEFAULT 90,
      duration_minutes INTEGER NOT NULL DEFAULT 60,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      allow_retry BOOLEAN NOT NULL DEFAULT 0,
      max_retries INTEGER NOT NULL DEFAULT 0,
      published_by INTEGER NOT NULL,
      published_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      status VARCHAR(20) NOT NULL DEFAULT 'draft',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (published_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS exam_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      order_num INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (exam_id) REFERENCES exams(id),
      FOREIGN KEY (question_id) REFERENCES questions(id)
    );

    CREATE TABLE IF NOT EXISTS learning_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title VARCHAR(200) NOT NULL,
      type VARCHAR(20) NOT NULL DEFAULT 'text',
      content TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS exam_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_id INTEGER NOT NULL,
      material_id INTEGER NOT NULL,
      FOREIGN KEY (exam_id) REFERENCES exams(id),
      FOREIGN KEY (material_id) REFERENCES learning_materials(id)
    );

    CREATE TABLE IF NOT EXISTS exam_targets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exam_id INTEGER NOT NULL,
      target_type VARCHAR(20) NOT NULL,
      target_value VARCHAR(100) NOT NULL,
      FOREIGN KEY (exam_id) REFERENCES exams(id)
    );

    CREATE TABLE IF NOT EXISTS exam_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      exam_id INTEGER NOT NULL,
      attempt_number INTEGER NOT NULL DEFAULT 1,
      answers_json TEXT,
      score INTEGER,
      total_score INTEGER,
      passed BOOLEAN,
      started_at DATETIME NOT NULL,
      submitted_at DATETIME,
      duration_seconds INTEGER,
      ip_address VARCHAR(50),
      user_agent TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (exam_id) REFERENCES exams(id)
    );

    CREATE TABLE IF NOT EXISTS learning_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      attempt_id INTEGER NOT NULL UNIQUE,
      user_id INTEGER NOT NULL,
      exam_id INTEGER NOT NULL,
      signature_data TEXT,
      signed_at DATETIME,
      signature_token VARCHAR(100) UNIQUE,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (attempt_id) REFERENCES exam_attempts(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (exam_id) REFERENCES exams(id)
    );

    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
    CREATE INDEX IF NOT EXISTS idx_exams_category ON exams(category);
    CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);
    CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
    CREATE INDEX IF NOT EXISTS idx_exam_attempts_user ON exam_attempts(user_id);
    CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam ON exam_attempts(exam_id);
    CREATE INDEX IF NOT EXISTS idx_learning_records_user ON learning_records(user_id);
    CREATE INDEX IF NOT EXISTS idx_learning_records_exam ON learning_records(exam_id);
    CREATE INDEX IF NOT EXISTS idx_learning_records_signed_at ON learning_records(signed_at);
  `);
}

function seedData(db: Database.Database) {
  const positionCount = db.prepare("SELECT COUNT(*) as count FROM positions").get() as { count: number };
  if (positionCount.count > 0) return;

  const insertPosition = db.prepare(
    "INSERT INTO positions (name, department, is_high_risk, required_pass_score) VALUES (?, ?, ?, ?)"
  );
  const positions = [
    ["采购经理", "采购部", 1, 90],
    ["采购专员", "采购部", 1, 90],
    ["财务总监", "财务部", 1, 90],
    ["出纳", "财务部", 1, 85],
    ["数据管理员", "技术部", 1, 90],
    ["销售经理", "销售部", 0, 60],
    ["人事专员", "人力资源部", 0, 60],
    ["行政文员", "行政部", 0, 60],
  ];
  const positionIds: number[] = [];
  for (const p of positions) {
    const info = insertPosition.run(p[0], p[1], p[2], p[3]);
    positionIds.push(Number(info.lastInsertRowid));
  }

  const hash = bcrypt.hashSync("123456", 10);
  const insertUser = db.prepare(
    "INSERT INTO users (username, password_hash, real_name, role, department, position_id, is_high_risk) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  const users = [
    ["admin", hash, "超级管理员", "super_admin", "总裁办", null, 0],
    ["compliance01", hash, "张法务", "compliance_officer", "法务部", null, 0],
    ["audit01", hash, "李审计", "compliance_officer", "审计部", null, 0],
    ["dept_manager", hash, "王主任", "dept_manager", "技术部", null, 0],
    ["employee01", hash, "赵采购", "employee", "采购部", positionIds[0], 1],
    ["employee02", hash, "钱数据", "employee", "技术部", positionIds[4], 1],
    ["employee03", hash, "孙销售", "employee", "销售部", positionIds[5], 0],
    ["employee04", hash, "周行政", "employee", "行政部", positionIds[7], 0],
  ];
  for (const u of users) {
    insertUser.run(u[0], u[1], u[2], u[3], u[4], u[5], u[6]);
  }

  const insertQuestion = db.prepare(
    "INSERT INTO questions (type, category, content, options_json, correct_answer, score, difficulty, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  );
  const questions = [
    [
      "single",
      "anti_fraud",
      "公司员工在业务活动中接受供应商提供的礼品，价值不得超过多少元？",
      JSON.stringify([
        { key: "A", value: "100元" },
        { key: "B", value: "200元" },
        { key: "C", value: "500元" },
        { key: "D", value: "1000元" },
      ]),
      "B",
      10,
      "easy",
      2,
    ],
    [
      "judge",
      "anti_fraud",
      "员工可以利用职务便利为亲属经营的活动谋取利益。",
      JSON.stringify([
        { key: "A", value: "正确" },
        { key: "B", value: "错误" },
      ]),
      "B",
      10,
      "easy",
      2,
    ],
    [
      "multiple",
      "anti_fraud",
      "以下哪些行为属于公司禁止的舞弊行为？",
      JSON.stringify([
        { key: "A", value: "虚报差旅费" },
        { key: "B", value: "收受供应商回扣" },
        { key: "C", value: "泄露公司商业秘密" },
        { key: "D", value: "按规定流程采购物资" },
      ]),
      JSON.stringify(["A", "B", "C"]),
      15,
      "medium",
      2,
    ],
    [
      "single",
      "data_security",
      "公司内部的机密数据在传输过程中应当采用什么方式？",
      JSON.stringify([
        { key: "A", value: "明文传输" },
        { key: "B", value: "加密传输" },
        { key: "C", value: "压缩传输" },
        { key: "D", value: "分片传输" },
      ]),
      "B",
      10,
      "easy",
      2,
    ],
    [
      "judge",
      "data_security",
      "员工离职后，可以保留其在工作期间接触到的客户数据用于个人用途。",
      JSON.stringify([
        { key: "A", value: "正确" },
        { key: "B", value: "错误" },
      ]),
      "B",
      10,
      "easy",
      2,
    ],
    [
      "multiple",
      "data_security",
      "处理客户个人信息时，应当遵守以下哪些原则？",
      JSON.stringify([
        { key: "A", value: "合法正当" },
        { key: "B", value: "最小必要" },
        { key: "C", value: "知情同意" },
        { key: "D", value: "随意使用" },
      ]),
      JSON.stringify(["A", "B", "C"]),
      15,
      "medium",
      2,
    ],
    [
      "single",
      "procurement",
      "采购金额达到多少需要进行公开招标？",
      JSON.stringify([
        { key: "A", value: "1万元以上" },
        { key: "B", value: "5万元以上" },
        { key: "C", value: "10万元以上" },
        { key: "D", value: "50万元以上" },
      ]),
      "D",
      10,
      "medium",
      2,
    ],
    [
      "judge",
      "procurement",
      "紧急采购可以不经过审批直接下单，事后再补流程。",
      JSON.stringify([
        { key: "A", value: "正确" },
        { key: "B", value: "错误" },
      ]),
      "B",
      10,
      "easy",
      2,
    ],
    [
      "multiple",
      "procurement",
      "采购红线包括以下哪些内容？",
      JSON.stringify([
        { key: "A", value: "拆分合同规避招标" },
        { key: "B", value: "指定供应商" },
        { key: "C", value: "与供应商私下接触" },
        { key: "D", value: "三家以上比价" },
      ]),
      JSON.stringify(["A", "B", "C"]),
      15,
      "hard",
      2,
    ],
  ];
  const questionIds: number[] = [];
  for (const q of questions) {
    const info = insertQuestion.run(q[0], q[1], q[2], q[3], q[4], q[5], q[6], q[7]);
    questionIds.push(Number(info.lastInsertRowid));
  }

  const insertMaterial = db.prepare(
    "INSERT INTO learning_materials (title, type, content) VALUES (?, ?, ?)"
  );
  const materials = [
    [
      "反舞弊管理办法",
      "text",
      "# 反舞弊管理办法\n\n## 第一章 总则\n第一条 为预防和查处舞弊行为，维护公司合法权益，根据相关法律法规，结合公司实际，制定本办法。\n\n## 第二章 禁止行为\n第二条 公司禁止任何形式的舞弊行为，包括但不限于：\n（一）贪污、受贿、挪用公款；\n（二）虚报费用、伪造票据；\n（三）利用职务便利为本人或他人谋取不正当利益；\n（四）泄露公司商业秘密；\n（五）其他损害公司利益的行为。",
    ],
    [
      "数据安全管理制度",
      "text",
      "# 数据安全管理制度\n\n## 第一章 总则\n第一条 为加强公司数据安全管理，保障数据合法、合规使用，根据《中华人民共和国数据安全法》《中华人民共和国个人信息保护法》等法律法规，制定本制度。\n\n## 第二章 数据分类分级\n第二条 公司数据按照重要程度分为：公开数据、内部数据、敏感数据、核心数据。\n\n## 第三章 数据处理规范\n第三条 处理个人信息应当遵循合法、正当、必要原则，取得个人同意。",
    ],
    [
      "采购红线管理规定",
      "text",
      "# 采购红线管理规定\n\n## 第一章 总则\n第一条 为规范采购行为，防范采购风险，明确采购红线，制定本规定。\n\n## 第二章 采购红线\n第二条 严禁以下采购行为：\n（一）拆分合同规避招标或审批程序；\n（二）指定或变相指定供应商；\n（三）与供应商私下接触、收受利益；\n（四）采购质次价高商品或服务；\n（五）其他违反采购制度的行为。",
    ],
  ];
  const materialIds: number[] = [];
  for (const m of materials) {
    const info = insertMaterial.run(m[0], m[1], m[2]);
    materialIds.push(Number(info.lastInsertRowid));
  }

  const insertExam = db.prepare(
    "INSERT INTO exams (title, category, description, pass_score, high_risk_pass_score, duration_minutes, start_time, end_time, allow_retry, max_retries, published_by, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  const exams = [
    [
      "2026年度反舞弊合规测验",
      "anti_fraud",
      "本测验考查员工对公司反舞弊政策的理解和掌握程度，所有员工必须参加。",
      21,
      32,
      45,
      "2026-01-01 00:00:00",
      "2026-12-31 23:59:59",
      1,
      3,
      2,
      "published",
    ],
    [
      "2026年度数据安全合规测验",
      "data_security",
      "本测验考查员工对数据安全法规和公司制度的掌握，涉及客户数据的员工必须参加。",
      21,
      32,
      45,
      "2026-01-01 00:00:00",
      "2026-12-31 23:59:59",
      1,
      3,
      2,
      "published",
    ],
    [
      "2026年度采购红线合规测验",
      "procurement",
      "本测验考查员工对采购红线制度的掌握，采购部门及相关部门员工必须参加。",
      25,
      33,
      60,
      "2026-01-01 00:00:00",
      "2026-12-31 23:59:59",
      1,
      5,
      2,
      "published",
    ],
  ];
  const examIds: number[] = [];
  for (const e of exams) {
    const info = insertExam.run(
      e[0],
      e[1],
      e[2],
      e[3],
      e[4],
      e[5],
      e[6],
      e[7],
      e[8],
      e[9],
      e[10],
      e[11]
    );
    examIds.push(Number(info.lastInsertRowid));
  }

  const insertExamQuestion = db.prepare(
    "INSERT INTO exam_questions (exam_id, question_id, order_num) VALUES (?, ?, ?)"
  );
  const examQuestions = [
    [examIds[0], questionIds[0], 1],
    [examIds[0], questionIds[1], 2],
    [examIds[0], questionIds[2], 3],
    [examIds[1], questionIds[3], 1],
    [examIds[1], questionIds[4], 2],
    [examIds[1], questionIds[5], 3],
    [examIds[2], questionIds[6], 1],
    [examIds[2], questionIds[7], 2],
    [examIds[2], questionIds[8], 3],
  ];
  for (const eq of examQuestions) {
    insertExamQuestion.run(eq[0], eq[1], eq[2]);
  }

  const insertExamMaterial = db.prepare(
    "INSERT INTO exam_materials (exam_id, material_id) VALUES (?, ?)"
  );
  for (let i = 0; i < examIds.length; i++) {
    insertExamMaterial.run(examIds[i], materialIds[i]);
  }

  const insertTarget = db.prepare(
    "INSERT INTO exam_targets (exam_id, target_type, target_value) VALUES (?, ?, ?)"
  );
  const targets = [
    [examIds[0], "department", "all"],
    [examIds[1], "department", "all"],
    [examIds[2], "department", "采购部"],
    [examIds[2], "position", "5"],
  ];
  for (const t of targets) {
    insertTarget.run(t[0], t[1], t[2]);
  }
}

export function initDatabase() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  createTables(db);
  seedData(db);

  db.close();
  console.log("Database initialized successfully");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  initDatabase();
}

export default initDatabase;
