import type { Metadata } from "next";
import Link from "next/link";
import { Geist_Mono, Noto_Sans_KR } from "next/font/google";
import { MessageSquareTextIcon, PenLineIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "DemoWed 게시판", template: "%s | DemoWed 게시판" },
  description: "Next.js, shadcn/ui, TypeScript로 만든 게시판",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="bg-muted/40 flex min-h-full flex-col">
        <header className="bg-background/90 sticky top-0 z-40 border-b backdrop-blur">
          <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <MessageSquareTextIcon className="text-primary size-5" />
              DemoWed 게시판
            </Link>
            <Button size="sm" asChild>
              <Link href="/posts/new">
                <PenLineIcon />
                글쓰기
              </Link>
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        <footer className="text-muted-foreground border-t py-6 text-center text-xs">
          DemoWed · Next.js + shadcn/ui + TypeScript
        </footer>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
