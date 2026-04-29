# Frontend Architecture: Next.js Chatbot

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

## Implementation References

- 프론트엔드 구현 규칙은 `.clinerules/frontend-chatbot-rules.md`에서 관리한다.
- 공통 프론트엔드 책임 분리는 `.clinerules/clean-code-solid-rules.md`를 따른다.
