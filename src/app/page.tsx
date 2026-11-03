import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { MessageCircleIcon, SearchIcon } from "lucide-react";

import { DeletedToast } from "@/components/board/deleted-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CATEGORIES, PAGE_SIZE, formatDate } from "@/lib/constants";
import { listPosts } from "@/lib/db";
import { cn } from "@/lib/utils";

type Search = { q?: string; category?: string; page?: string };

function buildHref(base: Search, patch: Search) {
  const merged = { ...base, ...patch };
  const sp = new URLSearchParams();
  if (merged.q) sp.set("q", merged.q);
  if (merged.category) sp.set("category", merged.category);
  if (merged.page && merged.page !== "1") sp.set("page", merged.page);
  const qs = sp.toString();
  return qs ? `/?${qs}` : "/";
}

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">게시판</CardTitle>
        <CardDescription>자유롭게 글을 남겨주세요.</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<ListSkeleton />}>
          <BoardList searchParams={searchParams} />
        </Suspense>
      </CardContent>
      <Suspense>
        <DeletedToast />
      </Suspense>
    </Card>
  );
}

async function BoardList({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  await connection();
  const raw = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const q = one(raw.q).trim();
  const category = CATEGORIES.find((c) => c === one(raw.category)) ?? "";
  const requested = Math.max(1, Number.parseInt(one(raw.page), 10) || 1);

  const first = await listPosts({ query: q, category, page: requested, pageSize: PAGE_SIZE });
  const totalPages = Math.max(1, Math.ceil(first.total / PAGE_SIZE));
  const page = Math.min(requested, totalPages);
  const { items, total } =
    page === requested ? first : await listPosts({ query: q, category, page, pageSize: PAGE_SIZE });

  const base: Search = { q, category };

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav className="flex flex-wrap gap-1.5" aria-label="분류">
          {(["", ...CATEGORIES] as const).map((c) => (
            <Button key={c || "all"} size="sm" variant={c === category ? "default" : "outline"} asChild>
              <Link href={buildHref(base, { category: c, page: "1" })}>{c || "전체"}</Link>
            </Button>
          ))}
        </nav>
        <form action="/" className="flex gap-2">
          {category && <input type="hidden" name="category" value={category} />}
          <Input name="q" defaultValue={q} placeholder="제목, 내용, 작성자 검색" className="sm:w-64" />
          <Button type="submit" variant="secondary" size="icon" aria-label="검색">
            <SearchIcon />
          </Button>
        </form>
      </div>

      <p className="text-muted-foreground text-sm">
        {q ? (
          <>
            &ldquo;{q}&rdquo; 검색 결과 <strong className="text-foreground">{total}</strong>건
          </>
        ) : (
          <>
            전체 <strong className="text-foreground">{total}</strong>건
          </>
        )}
      </p>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden w-16 text-center sm:table-cell">번호</TableHead>
              <TableHead className="w-20 text-center">분류</TableHead>
              <TableHead>제목</TableHead>
              <TableHead className="hidden w-28 md:table-cell">작성자</TableHead>
              <TableHead className="hidden w-28 text-center md:table-cell">작성일</TableHead>
              <TableHead className="hidden w-16 text-center sm:table-cell">조회</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground h-32 text-center">
                  게시글이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              items.map((post) => {
                const notice = post.category === "공지";
                return (
                  <TableRow key={post.id} className={cn(notice && "bg-primary/5")}>
                    <TableCell className="text-muted-foreground hidden text-center sm:table-cell">
                      {post.id}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={notice ? "default" : "secondary"}>{post.category}</Badge>
                    </TableCell>
                    <TableCell className="max-w-0">
                      <Link
                        href={`/posts/${post.id}`}
                        className={cn("flex items-center gap-1.5 hover:underline", notice && "font-semibold")}
                      >
                        <span className="truncate">{post.title}</span>
                        {post.commentCount > 0 && (
                          <span className="text-primary flex shrink-0 items-center gap-0.5 text-xs">
                            <MessageCircleIcon className="size-3" />
                            {post.commentCount}
                          </span>
                        )}
                      </Link>
                      <span className="text-muted-foreground mt-0.5 block text-xs md:hidden">
                        {post.author} · {formatDate(post.createdAt, false)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden truncate md:table-cell">{post.author}</TableCell>
                    <TableCell className="text-muted-foreground hidden text-center text-xs md:table-cell">
                      {formatDate(post.createdAt, false)}
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden text-center sm:table-cell">
                      {post.views}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={buildHref(base, { page: String(Math.max(1, page - 1)) })}
                aria-disabled={page === 1}
                className={cn(page === 1 && "pointer-events-none opacity-50")}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <PaginationItem key={n}>
                <PaginationLink href={buildHref(base, { page: String(n) })} isActive={n === page}>
                  {n}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href={buildHref(base, { page: String(Math.min(totalPages, page + 1)) })}
                aria-disabled={page === totalPages}
                className={cn(page === totalPages && "pointer-events-none opacity-50")}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="grid animate-pulse gap-3">
      <div className="bg-muted h-9 rounded-md" />
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="bg-muted h-10 rounded-md" />
      ))}
    </div>
  );
}
