"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import * as db from "@/lib/db";
import { CATEGORIES, type Category } from "@/lib/constants";

export type FormState = {
  error?: string;
  fieldErrors?: Partial<Record<"title" | "content" | "author" | "password" | "category", string>>;
  success?: boolean;
  /** changes on every submission so clients can react to repeated results */
  nonce?: number;
};

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

function parsePost(fd: FormData, requirePassword: boolean) {
  const values = {
    title: str(fd, "title"),
    content: str(fd, "content"),
    author: str(fd, "author"),
    category: str(fd, "category") as Category,
    password: String(fd.get("password") ?? ""),
  };
  const fieldErrors: FormState["fieldErrors"] = {};
  if (!values.title) fieldErrors.title = "제목을 입력하세요.";
  else if (values.title.length > 100) fieldErrors.title = "제목은 100자 이내로 입력하세요.";
  if (!values.content) fieldErrors.content = "내용을 입력하세요.";
  else if (values.content.length > 10_000) fieldErrors.content = "내용은 10,000자 이내로 입력하세요.";
  if (!values.author) fieldErrors.author = "작성자를 입력하세요.";
  else if (values.author.length > 20) fieldErrors.author = "작성자는 20자 이내로 입력하세요.";
  if (!CATEGORIES.includes(values.category)) fieldErrors.category = "분류를 선택하세요.";
  if (requirePassword && values.password.length < 4)
    fieldErrors.password = "비밀번호는 4자 이상이어야 합니다.";
  return { values, fieldErrors };
}

const failure = (state: Omit<FormState, "nonce">): FormState => ({ ...state, nonce: Date.now() });

export async function createPostAction(_prev: FormState, fd: FormData): Promise<FormState> {
  const { values, fieldErrors } = parsePost(fd, true);
  if (Object.keys(fieldErrors).length) return failure({ fieldErrors });

  const id = await db.createPost(values);
  revalidatePath("/");
  redirect(`/posts/${id}`);
}

export async function updatePostAction(
  id: number,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const { values, fieldErrors } = parsePost(fd, false);
  if (!values.password) fieldErrors.password = "작성 시 입력한 비밀번호를 입력하세요.";
  if (Object.keys(fieldErrors).length) return failure({ fieldErrors });

  const result = await db.updatePost(id, values);
  if (result === "not_found") return failure({ error: "게시글을 찾을 수 없습니다." });
  if (result === "bad_password") return failure({ fieldErrors: { password: "비밀번호가 일치하지 않습니다." } });

  revalidatePath("/");
  revalidatePath(`/posts/${id}`);
  redirect(`/posts/${id}`);
}

export async function deletePostAction(
  id: number,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const password = String(fd.get("password") ?? "");
  if (!password) return failure({ fieldErrors: { password: "비밀번호를 입력하세요." } });

  const result = await db.deletePost(id, password);
  if (result === "not_found") return failure({ error: "이미 삭제된 게시글입니다." });
  if (result === "bad_password") return failure({ fieldErrors: { password: "비밀번호가 일치하지 않습니다." } });

  revalidatePath("/");
  redirect("/?deleted=1");
}

export async function addCommentAction(
  postId: number,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const author = str(fd, "author");
  const content = str(fd, "content");
  const password = String(fd.get("password") ?? "");
  const fieldErrors: FormState["fieldErrors"] = {};
  if (!author) fieldErrors.author = "작성자를 입력하세요.";
  else if (author.length > 20) fieldErrors.author = "20자 이내로 입력하세요.";
  if (!content) fieldErrors.content = "댓글 내용을 입력하세요.";
  else if (content.length > 1000) fieldErrors.content = "1,000자 이내로 입력하세요.";
  if (password.length < 4) fieldErrors.password = "4자 이상";
  if (Object.keys(fieldErrors).length) return failure({ fieldErrors });

  const result = await db.addComment(postId, { author, content, password });
  if (result !== "ok") return failure({ error: "게시글을 찾을 수 없습니다." });

  revalidatePath(`/posts/${postId}`);
  return { success: true, nonce: Date.now() };
}

export async function deleteCommentAction(
  postId: number,
  commentId: number,
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const password = String(fd.get("password") ?? "");
  if (!password) return failure({ fieldErrors: { password: "비밀번호를 입력하세요." } });

  const result = await db.deleteComment(postId, commentId, password);
  if (result === "not_found") return failure({ error: "이미 삭제된 댓글입니다." });
  if (result === "bad_password") return failure({ fieldErrors: { password: "비밀번호가 일치하지 않습니다." } });

  revalidatePath(`/posts/${postId}`);
  return { success: true, nonce: Date.now() };
}
