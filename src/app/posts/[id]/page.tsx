import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ArrowLeftIcon, EyeIcon, PencilIcon, Trash2Icon, XIcon } from "lucide-react";

import { addCommentAction, deleteCommentAction, deletePostAction } from "@/app/actions";
import { CommentForm } from "@/components/board/comment-form";
import { PasswordDialog } from "@/components/board/password-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/constants";
import { getPost, incrementViews } from "@/lib/db";

export default function PostPage({ params }: PageProps<"/posts/[id]">) {
  return (
    <div className="grid gap-4">
      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ArrowLeftIcon />
            목록으로
          </Link>
        </Button>
      </div>
      <Suspense fallback={<div className="bg-muted h-96 animate-pulse rounded-xl" />}>
        <PostDetail params={params} />
      </Suspense>
    </div>
  );
}

async function PostDetail({ params }: { params: PageProps<"/posts/[id]">["params"] }) {
  await connection();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  await incrementViews(id);
  const post = await getPost(id);
  if (!post) notFound();

  const edited = post.updatedAt !== post.createdAt;

  return (
    <>
      <Card>
        <CardHeader className="gap-3">
          <div>
            <Badge variant={post.category === "공지" ? "default" : "secondary"}>{post.category}</Badge>
          </div>
          <CardTitle className="text-2xl leading-snug break-words">{post.title}</CardTitle>
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="text-foreground font-medium">{post.author}</span>
            <span>{formatDate(post.createdAt)}</span>
            {edited && <span>(수정됨 {formatDate(post.updatedAt)})</span>}
            <span className="flex items-center gap-1">
              <EyeIcon className="size-3.5" />
              {post.views}
            </span>
          </div>
        </CardHeader>
        <Separator />
        <CardContent>
          <div className="min-h-40 leading-relaxed break-words whitespace-pre-wrap">{post.content}</div>
        </CardContent>
        <Separator />
        <CardFooter className="justify-end gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/posts/${post.id}/edit`}>
              <PencilIcon />
              수정
            </Link>
          </Button>
          <PasswordDialog
            title="게시글 삭제"
            description="삭제한 게시글은 복구할 수 없습니다. 작성 시 입력한 비밀번호를 입력하세요."
            action={deletePostAction.bind(null, post.id)}
            trigger={
              <Button variant="destructive" size="sm">
                <Trash2Icon />
                삭제
              </Button>
            }
          />
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>댓글 {post.comments.length}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          {post.comments.length > 0 && (
            <ul className="divide-y rounded-lg border">
              {post.comments.map((c) => (
                <li key={c.id} className="flex gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 text-sm">
                      <span className="font-medium">{c.author}</span>
                      <span className="text-muted-foreground text-xs">{formatDate(c.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm break-words whitespace-pre-wrap">{c.content}</p>
                  </div>
                  <PasswordDialog
                    title="댓글 삭제"
                    description="댓글 작성 시 입력한 비밀번호를 입력하세요."
                    successMessage="댓글이 삭제되었습니다."
                    action={deleteCommentAction.bind(null, post.id, c.id)}
                    trigger={
                      <Button variant="ghost" size="icon-sm" aria-label="댓글 삭제">
                        <XIcon />
                      </Button>
                    }
                  />
                </li>
              ))}
            </ul>
          )}
          <CommentForm action={addCommentAction.bind(null, post.id)} />
        </CardContent>
      </Card>
    </>
  );
}
