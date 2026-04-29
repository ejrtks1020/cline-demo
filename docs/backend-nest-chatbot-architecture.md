# Backend Architecture: NestJS Chatbot

이 프로젝트의 백엔드는 구조를 기준으로 만든다. NestJS 11, TypeORM, PostgreSQL, ID/password 기반 JWT 인증, Swagger, OpenAI 스트리밍을 기본 전제로 삼는다.

## Core Stack

- 런타임은 NestJS + TypeScript를 사용한다.
- DB 접근은 TypeORM + PostgreSQL을 사용한다.
- 인증은 `docs/authentication-id-password-jwt.md`를 따른다.
- 인증이 필요한 API는 `JwtAuthGuard`와 `CurrentUser` 데코레이터 패턴을 사용한다.
- AI 응답 스트리밍은 OpenAI SDK와 SSE 형식의 `fetch` 스트림으로 제공한다.
- 전역 API prefix는 `/api`, URI versioning 기본값은 `v1`이다. 실제 엔드포인트는 `/api/v1/...`가 된다.

## Module Structure

기능 단위 모듈은 아래 계층을 유지한다.

```text
backend/src/chat/
  chat.module.ts
  domain/
    entities/
      chat-session.entity.ts
      chat-message.entity.ts
  application/
    chat.controller.ts
    chat.service.ts
    dto/
      chat.command.ts
      chat.dto.ts
      chat.response.ts
  infrastructure/
    repositories/
      repository.interface.ts
      postgres/
        chat-session.schema.ts
        chat-message.schema.ts
        chat.repository.ts
```

## Chatbot API Shape

간단한 챗봇은 최소 아래 API를 제공한다.

- `GET /api/v1/chats`: 현재 사용자의 채팅 세션 목록
- `GET /api/v1/chats/:id`: 현재 사용자의 특정 세션과 메시지 목록
- `POST /api/v1/chats`: 새 채팅 세션 생성
- `DELETE /api/v1/chats/:id`: 현재 사용자의 세션 삭제
- `POST /api/v1/chats/:id/messages/stream`: 사용자 메시지 저장 후 AI 응답 스트리밍

## Implementation References

- 백엔드 구현 규칙은 `.clinerules/backend-chatbot-rules.md`에서 관리한다.
- 풀스택 API 계약 규칙은 `.clinerules/fullstack-chatbot-rules.md`를 따른다.
