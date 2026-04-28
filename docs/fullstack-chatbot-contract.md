# Fullstack Chatbot Contract

`cline-guide`에서 간단한 풀스택 챗봇, 핵심은 REST로 저장된 상태를 조회하고, `fetch` 스트림으로 AI 응답을 점진 표시하는 구조다.

## Architecture Summary

- Frontend: Next.js App Router, `[locale]` route, React Query, Zustand, Axios API client, `fetch` streaming hook.
- Backend: NestJS module per feature, controller/service/dto/domain/infrastructure 분리, TypeORM PostgreSQL repository, JWT guard.
- Contract: `/api/v1` versioned REST API + `data: {...}\n\n` SSE event stream.
- Auth: ID/password login -> JWT access token -> frontend localStorage token -> Bearer header -> backend `JwtAuthGuard` -> `CurrentUser`.

## Environment Variables

Backend `.env`:

```text
PORT=4000
FRONTEND_URL=http://localhost:3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=chatbot
DB_SYNC=true
JWT_SECRET=...
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
```

Frontend `.env.local`:

```text
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## API Contract

REST responses should return plain JSON DTOs, not ORM schemas.

```text
POST   /api/v1/auth/signup
POST   /api/v1/auth/login
GET    /api/v1/auth/me
GET    /api/v1/chats
GET    /api/v1/chats/:id
POST   /api/v1/chats
DELETE /api/v1/chats/:id
POST   /api/v1/chats/:id/messages/stream
```

Auth contract는 `docs/authentication-id-password-jwt.md`를 우선한다.

Stream events:

```json
{ "type": "chunk", "data": "partial text" }
{ "type": "done", "data": "full assistant message", "messageId": "uuid", "sessionId": "uuid" }
{ "type": "error", "data": "error message" }
```

## Naming Rules

- Backend feature folder: `chat`
- Backend controller: `ChatController`
- Backend service: `ChatService`
- Backend repository interface token: `IChatRepository`
- Backend TypeORM schemas: `ChatSessionSchema`, `ChatMessageSchema`
- Frontend page route: `src/app/[locale]/chat/page.tsx`
- Frontend REST hooks: `use-chat-sessions.ts`
- Frontend streaming hook: `use-chat-stream.ts`
- Frontend store: `chat-store.ts`

## Implementation Order

1. 백엔드 domain entity와 TypeORM schema를 만든다.
2. repository interface와 postgres repository를 만든다.
3. service에서 세션 CRUD, 메시지 저장, OpenAI streaming을 구현한다.
4. controller에서 REST/SSE endpoint와 JWT guard를 연결한다.
5. frontend type과 API hook을 만든다.
6. Zustand streaming store와 `useChatStream`을 만든다.
7. chat page와 sidebar/message/input component를 연결한다.
8. 한 번의 실제 메시지 전송으로 DB 저장, stream 표시, 목록 갱신을 확인한다.

## Error Handling Rules

- Backend validation error는 global `ValidationPipe`와 exception filter에 맡긴다.
- 없는 세션이거나 다른 사용자의 세션이면 `NotFoundException`을 반환한다.
- frontend는 stream 중 `error` event를 받으면 입력을 다시 활성화하고 에러 메시지를 표시한다.
- 401은 API interceptor에서 token 제거 후 로그인 페이지로 이동한다.

## Verification Rules

- Backend 변경 후 최소 `pnpm build` 또는 Nest build를 실행한다.
- Frontend 변경 후 최소 `pnpm build` 또는 type check 가능한 명령을 실행한다.
- 스트리밍 기능은 브라우저에서 직접 확인한다. 첫 chunk 표시, done 후 query invalidation, 새로고침 후 저장된 메시지 복원을 확인한다.
