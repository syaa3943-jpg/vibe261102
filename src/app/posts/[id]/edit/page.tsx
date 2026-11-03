import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { updatePostAction } from "@/app/actions";
import { PostForm } from "@/components/board/post-form";
import { getPost } from "@/lib/db";

export default function EditPostPage({ params }: PageProps<"/posts/[id]/edit">) {
  return (
    <Suspense fallback={<div className="bg-muted h-96 animate-pulse rounded-xl" />}>
      <EditForm params={params} />
    </Suspense>
  );
}

async function EditForm({ params }: { params: PageProps<"/posts/[id]/edit">["params"] }) {
  await connection();
  const id = Number((await params).id);
  const post = Number.isInteger(id) ? await getPost(id) : undefined;
  if (!post) notFound();

  return (
    <PostForm
      mode="edit"
      action={updatePostAction.bind(null, post.id)}
      initial={{
        title: post.title,
        content: post.content,
        author: post.author,
        category: post.category,
      }}
      cancelHref={`/posts/${post.id}`}
    />
  );
}
