import "server-only";

import { neon } from "@neondatabase/serverless";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import type { Category } from "@/lib/constants";

export type { Category };

export type Comment = {
  id: number;
  author: string;
  content: string;
  createdAt: string;
};

export type Post = {
  id: number;
  title: string;
  content: string;
  author: string;
  category: Category;
  views: number;
  createdAt: string;
  updatedAt: string;
  comments: Comment[];
};

export type PostSummary = Omit<Post, "content" | "comments"> & { commentCount: number };

export type MutationResult = "ok" | "not_found" | "bad_password";

/* ---------- connection ---------- */

let client: ReturnType<typeof neon> | undefined;
function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL 환경 변수가 설정되지 않았습니다 (.env.local).");
    client = neon(url);
  }
  return client(strings, ...values) as Promise<Record<string, unknown>[]>;
}

/* ---------- password helpers ---------- */

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 32);
  const expected = Buffer.from(hash, "hex");
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

/* ---------- row mapping ---------- */

const iso = (v: unknown) => (v instanceof Date ? v : new Date(String(v))).toISOString();

function toSummary(r: Record<string, unknown>): PostSummary {
  return {
    id: Number(r.id),
    title: String(r.title),
    author: String(r.author),
    category: r.category as Category,
    views: Number(r.views),
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
    commentCount: Number(r.comment_count ?? 0),
  };
}

/* ---------- queries ---------- */

export async function listPosts(opts: {
  query?: string;
  category?: string;
  page: number;
  pageSize: number;
}): Promise<{ items: PostSummary[]; total: number }> {
  const q = opts.query?.trim() ?? "";
  // escape LIKE wildcards in user input
  const pattern = `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
  const category = opts.category ?? "";
  const offset = (opts.page - 1) * opts.pageSize;

  const rows = await sql`
    SELECT p.id, p.title, p.author, p.category, p.views, p.created_at, p.updated_at,
           (SELECT count(*) FROM comments c WHERE c.post_id = p.id)::int AS comment_count,
           count(*) OVER ()::int AS total
    FROM posts p
    WHERE (${category} = '' OR p.category = ${category})
      AND (${q} = '' OR p.title ILIKE ${pattern} OR p.content ILIKE ${pattern} OR p.author ILIKE ${pattern})
    ORDER BY (p.category = '공지') DESC, p.id DESC
    LIMIT ${opts.pageSize} OFFSET ${offset}`;

  let total = rows.length ? Number(rows[0].total) : 0;
  if (!rows.length && offset > 0) {
    // page past the end: still report the real total so the caller can clamp
    const [r] = await sql`
      SELECT count(*)::int AS total FROM posts p
      WHERE (${category} = '' OR p.category = ${category})
        AND (${q} = '' OR p.title ILIKE ${pattern} OR p.content ILIKE ${pattern} OR p.author ILIKE ${pattern})`;
    total = Number(r.total);
  }
  return { items: rows.map(toSummary), total };
}

export async function getPost(id: number): Promise<Post | undefined> {
  const [postRows, commentRows] = await Promise.all([
    sql`SELECT * FROM posts WHERE id = ${id}`,
    sql`SELECT id, author, content, created_at FROM comments WHERE post_id = ${id} ORDER BY id`,
  ]);
  const r = postRows[0];
  if (!r) return undefined;
  return {
    id: Number(r.id),
    title: String(r.title),
    author: String(r.author),
    category: r.category as Category,
    views: Number(r.views),
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
    content: String(r.content),
    comments: commentRows.map((c) => ({
      id: Number(c.id),
      author: String(c.author),
      content: String(c.content),
      createdAt: iso(c.created_at),
    })),
  };
}

export async function incrementViews(id: number): Promise<void> {
  await sql`UPDATE posts SET views = views + 1 WHERE id = ${id}`;
}

/* ---------- mutations ---------- */

type PostInput = { title: string; content: string; author: string; category: Category; password: string };

export async function createPost(input: PostInput): Promise<number> {
  const [row] = await sql`
    INSERT INTO posts (title, content, author, category, password_hash)
    VALUES (${input.title}, ${input.content}, ${input.author}, ${input.category}, ${hashPassword(input.password)})
    RETURNING id`;
  return Number(row.id);
}

async function checkPostPassword(id: number, password: string): Promise<MutationResult> {
  const [row] = await sql`SELECT password_hash FROM posts WHERE id = ${id}`;
  if (!row) return "not_found";
  return verifyPassword(password, String(row.password_hash)) ? "ok" : "bad_password";
}

export async function updatePost(id: number, input: PostInput): Promise<MutationResult> {
  const check = await checkPostPassword(id, input.password);
  if (check !== "ok") return check;
  const rows = await sql`
    UPDATE posts
    SET title = ${input.title}, content = ${input.content}, author = ${input.author},
        category = ${input.category}, updated_at = now()
    WHERE id = ${id}
    RETURNING id`;
  return rows.length ? "ok" : "not_found";
}

export async function deletePost(id: number, password: string): Promise<MutationResult> {
  const check = await checkPostPassword(id, password);
  if (check !== "ok") return check;
  const rows = await sql`DELETE FROM posts WHERE id = ${id} RETURNING id`;
  return rows.length ? "ok" : "not_found";
}

export async function addComment(
  postId: number,
  input: { author: string; content: string; password: string },
): Promise<MutationResult> {
  const rows = await sql`
    INSERT INTO comments (post_id, author, content, password_hash)
    SELECT ${postId}, ${input.author}, ${input.content}, ${hashPassword(input.password)}
    WHERE EXISTS (SELECT 1 FROM posts WHERE id = ${postId})
    RETURNING id`;
  return rows.length ? "ok" : "not_found";
}

export async function deleteComment(
  postId: number,
  commentId: number,
  password: string,
): Promise<MutationResult> {
  const [row] = await sql`
    SELECT password_hash FROM comments WHERE id = ${commentId} AND post_id = ${postId}`;
  if (!row) return "not_found";
  if (!verifyPassword(password, String(row.password_hash))) return "bad_password";
  await sql`DELETE FROM comments WHERE id = ${commentId}`;
  return "ok";
}
