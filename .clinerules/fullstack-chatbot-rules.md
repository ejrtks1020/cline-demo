# Fullstack Chatbot Rules

풀스택 구조와 API 계약은 `docs/fullstack-chatbot-contract.md`를 기준으로 하고, 구현 규칙은 이 파일에서 관리한다.

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

## Error Handling Rules

- Backend validation error는 global `ValidationPipe`와 exception filter에 맡긴다.
- 없는 세션이거나 다른 사용자의 세션이면 `NotFoundException`을 반환한다.
- frontend는 stream 중 `error` event를 받으면 입력을 다시 활성화하고 에러 메시지를 표시한다.
- 401은 API interceptor에서 token 제거 후 로그인 페이지로 이동한다.

## Verification Rules

- Backend 변경 후 최소 `pnpm build` 또는 Nest build를 실행한다.
- Frontend 변경 후 최소 `pnpm build` 또는 type check 가능한 명령을 실행한다.
- 스트리밍 기능은 브라우저에서 직접 확인한다. 첫 chunk 표시, done 후 query invalidation, 새로고침 후 저장된 메시지 복원을 확인한다.
