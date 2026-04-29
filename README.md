# cline-guide chatbot

문서 계약을 기준으로 NestJS 백엔드와 Next.js 프론트엔드를 구성한 간단한 풀스택 챗봇 예제입니다.

## Backend

```bash
cd backend
cp .env.example .env
pnpm install
pnpm build
pnpm test
pnpm start:dev
```

백엔드는 기본적으로 `http://localhost:4000/api/v1`에서 동작합니다. 실제 실행에는 PostgreSQL 접속 정보, `JWT_SECRET`, `OPENAI_API_KEY`가 필요합니다.

## Frontend

```bash
cd frontend
cp .env.local.example .env.local
pnpm install
pnpm build
pnpm test
pnpm dev
```

프론트엔드는 기본적으로 `NEXT_PUBLIC_API_URL=http://localhost:4000` 백엔드에 연결합니다.

## Manual verification

1. PostgreSQL을 실행하고 backend `.env`를 설정합니다.
2. backend와 frontend 개발 서버를 실행합니다.
3. `/ko/signup`에서 가입 후 `/ko/chat`에서 새 채팅을 생성합니다.
4. 메시지를 전송해 chunk 표시, done 후 목록 갱신, 새로고침 후 메시지 복원을 확인합니다.
