import type { Metadata } from "next";

import { createPostAction } from "@/app/actions";
import { PostForm } from "@/components/board/post-form";

export const metadata: Metadata = { title: "새 글 쓰기" };

export default function NewPostPage() {
  return <PostForm mode="create" action={createPostAction} cancelHref="/" />;
}
