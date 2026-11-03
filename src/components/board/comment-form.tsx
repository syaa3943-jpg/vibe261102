"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";

import type { FormState } from "@/app/actions";
import { FieldError } from "@/components/board/field-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function CommentForm({
  action,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
}) {
  // Controlled fields so input survives validation errors (React resets forms after actions).
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");

  const [state, formAction, pending] = useActionState(async (prev: FormState, fd: FormData) => {
    const result = await action(prev, fd);
    if (result.success) {
      setContent("");
      toast.success("댓글이 등록되었습니다.");
    } else if (result.error) {
      toast.error(result.error);
    }
    return result;
  }, {});

  const fe = state.fieldErrors ?? {};
  return (
    <form action={formAction} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1">
          <Input
            name="author"
            placeholder="작성자"
            maxLength={20}
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            aria-invalid={!!fe.author}
          />
          <FieldError message={fe.author} />
        </div>
        <div className="grid gap-1">
          <Input
            name="password"
            type="password"
            placeholder="비밀번호 (삭제 시 필요, 4자 이상)"
            autoComplete="new-password"
            aria-invalid={!!fe.password}
          />
          <FieldError message={fe.password} />
        </div>
      </div>
      <div className="grid gap-1">
        <Textarea
          name="content"
          placeholder="댓글을 입력하세요"
          rows={3}
          maxLength={1000}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          aria-invalid={!!fe.content}
        />
        <FieldError message={fe.content} />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "등록 중..." : "댓글 등록"}
        </Button>
      </div>
    </form>
  );
}
