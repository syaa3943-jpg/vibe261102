"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";

import type { FormState } from "@/app/actions";
import { FieldError } from "@/components/board/field-error";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

/** Asks for a password, then runs a destructive action (delete post / comment). */
export function PasswordDialog({
  trigger,
  title,
  description,
  confirmLabel = "삭제",
  successMessage,
  action,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  successMessage?: string;
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(async (prev: FormState, fd: FormData) => {
    const result = await action(prev, fd);
    if (result.success) {
      setOpen(false);
      if (successMessage) toast.success(successMessage);
    } else if (result.error) {
      toast.error(result.error);
    }
    return result;
  }, {});

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <form action={formAction} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Input
              name="password"
              type="password"
              placeholder="비밀번호"
              autoFocus
              autoComplete="current-password"
              aria-invalid={!!state.fieldErrors?.password}
            />
            <FieldError message={state.fieldErrors?.password} />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                취소
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "처리 중..." : confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
