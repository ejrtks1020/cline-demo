# Frontend Architecture Rules: Next.js Chatbot

이 프로젝트의 프론트엔드는 Next.js App Router, React 19, TypeScript, Tailwind CSS, next-intl, React Query, Zustand를 기본 전제로 삼는다.

## Core Stack

- Next.js App Router를 사용한다.
- locale 라우팅은 `src/app/[locale]`와 `next-intl` 구조를 따른다.
- 서버 상태는 TanStack React Query로 관리한다.
- 클라이언트 전용 상태, 인증 상태, 스트리밍 중인 메시지는 Zustand로 관리한다.
- 일반 REST 요청은 `src/lib/api.ts`의 Axios instance를 사용한다.
- SSE/streaming 요청은 Axios가 아니라 `fetch` + `ReadableStream` reader를 사용한다.

## Directory Structure

챗봇 화면은 아래 구조를 기준으로 만든다.

```text
frontend/src/
  app/
    [locale]/
      chat/
        page.tsx
        layout.tsx
  components/
    chat-sidebar.tsx
    chat-message-list.tsx
    chat-message.tsx
    chat-input.tsx
    providers.tsx
    ui/
      button.tsx
      input.tsx
      scroll-area.tsx
  hooks/
    use-chat-sessions.ts
    use-chat-stream.ts
  stores/
    auth-store.ts
    chat-store.ts
  lib/
    api.ts
    utils.ts
  types/
    index.ts
  i18n/
    routing.ts
    request.ts
messages/
  ko.json
  en.json
```

## Page and Component Rules

- `page.tsx`는 화면 조립, routing, selected session state, mutation 호출 연결만 담당한다.
- 채팅 입력, 메시지 목록, 사이드바, 메시지 bubble은 별도 component로 분리한다.
- 재사용 UI primitive는 `components/ui`에 둔다.
- 기능 component는 `components`에 두고, 너무 커지면 `components/chat/*`로 폴더를 분리한다.
- 인증이 필요한 페이지는 `useAuthStore().isAuthenticated`를 확인하고 비인증 사용자는 `/login`으로 보낸다.
- locale-aware navigation은 `@/i18n/routing`의 `useRouter`, `Link`를 사용한다.

## State Rules

React Query는 서버에 저장된 데이터를 담당한다.

- `useChatSessions()` -> `GET /chats`
- `useChatSession(id)` -> `GET /chats/:id`
- `useCreateChatSession()` -> `POST /chats`
- `useDeleteChatSession()` -> `DELETE /chats/:id`

Zustand는 현재 스트리밍 상태를 담당한다.

- `isStreaming`
- `streamContent`
- `error`
- `activeSessionId`
- `startStreaming()`
- `appendChunk(chunk)`
- `completeStreaming(messageId)`
- `setError(error)`
- `resetStreaming()`

서버 데이터가 바뀌면 React Query `invalidateQueries`로 동기화한다.

## API Client Rules

- `src/lib/api.ts`는 `NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'`를 base로 사용한다.
- Axios baseURL은 `${API_BASE_URL}/api/v1`이다.
- request interceptor에서 `localStorage.accessToken`을 Bearer token으로 붙인다.
- 401 응답은 token을 제거하고 locale 기본 로그인 페이지로 이동한다.
- streaming hook은 `API_BASE_URL`을 직접 사용해 `/api/v1/.../stream`에 `fetch`로 POST한다.

## Streaming Hook Rules

`useChatStream`은 `date-course-generator`의 `use-sse.ts` 패턴을 따른다.

- 호출 전에 `startStreaming()`을 실행한다.
- access token이 없으면 즉시 `setError('Authentication required')` 처리한다.
- `response.body.getReader()`로 stream을 읽는다.
- `TextDecoder`와 `buffer`를 사용해 줄 단위로 파싱한다.
- `data: `로 시작하는 line만 JSON parse한다.
- event `type`이 `chunk`이면 chunk를 append한다.
- event `type`이 `done`이면 완료 처리하고 관련 query를 invalidate한다.
- event `type`이 `error`이면 error 상태로 전환한다.
- malformed JSON은 스트림 전체를 죽이지 말고 무시한다.

## Type Rules

공유 타입은 `src/types/index.ts`에 둔다.

권장 타입:

```ts
export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface SendChatMessageParams {
  content: string;
}

export interface ChatSseEvent {
  type: 'chunk' | 'done' | 'error';
  data: string;
  messageId?: string;
  sessionId?: string;
}
```

## UI Rules

- 채팅 첫 화면은 실제 채팅 경험으로 시작한다. 별도 landing page를 만들지 않는다.
- 좌측에는 세션 목록/새 채팅 버튼, 우측에는 메시지 목록과 입력창을 둔다.
- 메시지 목록은 `ScrollArea`를 사용하고 새 chunk가 오면 하단으로 스크롤한다.
- assistant 메시지는 streaming 중에도 점진적으로 렌더링한다.
- Markdown 응답이 필요하면 `react-markdown`을 사용한다.
- 버튼 icon은 가능한 경우 `lucide-react`를 사용한다.
- copy, retry, delete 같은 명령은 텍스트 버튼보다 icon button을 우선한다.

## i18n Rules

- 화면 텍스트는 `messages/ko.json`, `messages/en.json`에 둔다.
- component에서는 `useTranslations()`를 사용한다.
- 새 라우트는 locale layout 아래에 둔다.
- 사용자 입력값이나 AI 응답 내용은 번역 파일로 옮기지 않는다.
