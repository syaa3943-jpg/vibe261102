// Creates the board tables in Neon and inserts sample data if the board is empty.
// Usage: npm run db:setup   (reads DATABASE_URL from .env.local)
import { neon } from "@neondatabase/serverless";
import { randomBytes, scryptSync } from "node:crypto";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set (.env.local)");
  process.exit(1);
}
const sql = neon(url);

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 32).toString("hex")}`;
}

await sql`
  CREATE TABLE IF NOT EXISTS posts (
    id            SERIAL PRIMARY KEY,
    title         VARCHAR(100)  NOT NULL,
    content       TEXT          NOT NULL,
    author        VARCHAR(20)   NOT NULL,
    category      VARCHAR(10)   NOT NULL,
    password_hash TEXT          NOT NULL,
    views         INTEGER       NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
  )`;
await sql`
  CREATE TABLE IF NOT EXISTS comments (
    id            SERIAL PRIMARY KEY,
    post_id       INTEGER       NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    author        VARCHAR(20)   NOT NULL,
    content       TEXT          NOT NULL,
    password_hash TEXT          NOT NULL,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
  )`;
await sql`CREATE INDEX IF NOT EXISTS comments_post_id_idx ON comments(post_id)`;
console.log("✓ tables ready");

const [{ count }] = await sql`SELECT count(*)::int AS count FROM posts`;
if (count > 0) {
  console.log(`✓ ${count} posts already exist, skipping seed`);
  process.exit(0);
}

const pw = hashPassword("1234");
const samples = [
  ["게시판에 오신 것을 환영합니다", "관리자", "Next.js + shadcn/ui + TypeScript + Neon으로 만든 게시판입니다.\n\n샘플 게시글의 비밀번호는 모두 1234 입니다.", "공지", 28],
  ["Next.js App Router 질문 있어요", "개발초보", "Server Action과 Route Handler는 언제 각각 쓰는 게 좋을까요?", "질문", 22],
  ["shadcn/ui 컴포넌트 추천", "디자이너K", "Card, Table, Dialog 조합이 게시판 만들기에 정말 편합니다.", "정보", 14],
  ["오늘 점심 뭐 드셨나요?", "배고픈사람", "저는 김치찌개 먹었습니다 🍲", "자유", 7],
];
const ids = [];
for (const [i, [title, author, content, category, views]] of samples.entries()) {
  const minutesAgo = (samples.length - i) * 90;
  const [row] = await sql`
    INSERT INTO posts (title, author, content, category, password_hash, views, created_at, updated_at)
    VALUES (${title}, ${author}, ${content}, ${category}, ${pw}, ${views},
            now() - make_interval(mins => ${minutesAgo}), now() - make_interval(mins => ${minutesAgo}))
    RETURNING id`;
  ids.push(row.id);
}
await sql`
  INSERT INTO comments (post_id, author, content, password_hash, created_at)
  VALUES (${ids[1]}, '선배개발자',
          '폼 제출 같은 변경 작업은 Server Action, 외부에서 호출하는 API는 Route Handler가 좋아요.',
          ${pw}, now() - interval '60 minutes')`;
console.log(`✓ seeded ${samples.length} posts`);
