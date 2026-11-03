export const CATEGORIES = ["자유", "질문", "정보", "공지"] as const;
export type Category = (typeof CATEGORIES)[number];

export const PAGE_SIZE = 10;

export function formatDate(iso: string, withTime = true): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    ...(withTime ? { hour: "2-digit", minute: "2-digit", hour12: false } : {}),
  }).format(new Date(iso));
}
