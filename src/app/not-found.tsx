import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid place-items-center gap-4 py-24 text-center">
      <p className="text-5xl font-bold">404</p>
      <p className="text-muted-foreground">요청하신 게시글이나 페이지를 찾을 수 없습니다.</p>
      <Button asChild>
        <Link href="/">목록으로</Link>
      </Button>
    </div>
  );
}
