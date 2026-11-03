# DemoWed 게시판

Next.js 16 (App Router) + shadcn/ui + TypeScript + Neon(PostgreSQL)으로 만든 웹 게시판입니다.

## 실행

```bash
npm install
# .env.local 파일에 Neon 접속 문자열 설정
#   DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require"
npm run db:setup # 테이블 생성 + 샘플 데이터
npm run dev      # http://localhost:3000
```

프로덕션 빌드: `npm run build && npm start`

## 기능

- 게시글 목록: 분류 필터(자유/질문/정보/공지), 검색(제목·내용·작성자), 페이지네이션, 공지 상단 고정
- 게시글 작성 / 상세 보기(조회수) / 수정 / 삭제
- 댓글 작성 / 삭제
- 비밀번호 기반 수정·삭제 (비밀번호는 scrypt로 해시 저장)
- 샘플 글의 비밀번호: `1234`

## 구조

```
src/
  app/
    actions.ts               서버 액션 (작성/수정/삭제/댓글)
    page.tsx                 목록
    posts/new/page.tsx       글쓰기
    posts/[id]/page.tsx      상세 + 댓글
    posts/[id]/edit/page.tsx 수정
  components/board/          게시판 클라이언트 컴포넌트
  components/ui/             shadcn/ui 컴포넌트
  lib/db.ts                  Neon PostgreSQL 데이터 접근
scripts/db-setup.mjs         테이블 생성 및 샘플 데이터
```

데이터는 Neon PostgreSQL의 `posts`, `comments` 테이블에 저장됩니다.
