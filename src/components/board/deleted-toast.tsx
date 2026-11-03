"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

/** Shows a toast after a post was deleted (redirected with ?deleted=1). */
export function DeletedToast() {
  const params = useSearchParams();
  const router = useRouter();
  const deleted = params.get("deleted") === "1";

  useEffect(() => {
    if (!deleted) return;
    // fixed id dedupes the toast when effects run twice (React Strict Mode in dev)
    toast.success("게시글이 삭제되었습니다.", { id: "post-deleted" });
    router.replace("/", { scroll: false });
  }, [deleted, router]);

  return null;
}
