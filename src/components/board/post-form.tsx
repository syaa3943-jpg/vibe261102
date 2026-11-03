"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import type { FormState } from "@/app/actions";
import { FieldError } from "@/components/board/field-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES, type Category } from "@/lib/constants";

type Values = { title: string; content: string; author: string; category: Category };

const EMPTY: Values = { title: "", content: "", author: "", category: "자유" };

export function PostForm({
  mode,
  action,
  initial = EMPTY,
  cancelHref,
}: {
  mode: "create" | "edit";
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  initial?: Values;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  // Controlled fields so user input survives validation errors.
  const [values, setValues] = useState<Values>(initial);
  const set =
    (key: keyof Values) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setValues((v) => ({ ...v, [key]: e.target.value }));
  const fe = state.fieldErrors ?? {};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{mode === "create" ? "새 글 쓰기" : "글 수정"}</CardTitle>
      </CardHeader>
      <form action={formAction} className="grid gap-6">
        <CardContent className="grid gap-5">
          {state.error && (
            <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
              {state.error}
            </p>
          )}
          <div className="grid gap-5 sm:grid-cols-[160px_1fr]">
            <div className="grid gap-2">
              <Label htmlFor="category">분류</Label>
              <NativeSelect
                id="category"
                name="category"
                value={values.category}
                onChange={set("category")}
                className="w-full"
              >
                {CATEGORIES.map((c) => (
                  <NativeSelectOption key={c} value={c}>
                    {c}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldError message={fe.category} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                name="title"
                value={values.title}
                onChange={set("title")}
                maxLength={100}
                placeholder="제목을 입력하세요"
                aria-invalid={!!fe.title}
              />
              <FieldError message={fe.title} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="content">내용</Label>
            <Textarea
              id="content"
              name="content"
              value={values.content}
              onChange={set("content")}
              rows={12}
              placeholder="내용을 입력하세요"
              aria-invalid={!!fe.content}
              className="min-h-64"
            />
            <FieldError message={fe.content} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="author">작성자</Label>
              <Input
                id="author"
                name="author"
                value={values.author}
                onChange={set("author")}
                maxLength={20}
                placeholder="닉네임"
                aria-invalid={!!fe.author}
              />
              <FieldError message={fe.author} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={mode === "create" ? "new-password" : "current-password"}
                placeholder={
                  mode === "create" ? "수정/삭제 시 필요 (4자 이상)" : "작성 시 입력한 비밀번호"
                }
                aria-invalid={!!fe.password}
              />
              <FieldError message={fe.password} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button variant="outline" asChild>
            <Link href={cancelHref}>취소</Link>
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "저장 중..." : mode === "create" ? "등록" : "수정 완료"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
