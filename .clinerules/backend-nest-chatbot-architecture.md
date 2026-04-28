# Backend Architecture Rules: NestJS Chatbot

이 프로젝트의 백엔드는 구조를 기준으로 만든다. NestJS 11, TypeORM, PostgreSQL, ID/password 기반 JWT 인증, Swagger, OpenAI 스트리밍을 기본 전제로 삼는다.

## Core Stack

- 런타임은 NestJS + TypeScript를 사용한다.
- DB 접근은 TypeORM + PostgreSQL을 사용한다.
- 인증은 `.clinerules/authentication-id-password-jwt.md`를 따른다.
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

## Dependency Rules

- `controller`는 요청/응답, guard, parameter parsing, SSE header 설정만 담당한다.
- `service`는 유스케이스, 소유권 검증, OpenAI 호출, 트랜잭션 흐름, 저장 순서를 담당한다.
- `domain/entities`는 순수 TypeScript class로 두고 TypeORM 데코레이터를 넣지 않는다.
- `infrastructure/repositories/postgres`만 TypeORM schema와 repository 구현을 가진다.
- repository interface는 `Symbol` token을 함께 export하고 module에서 `{ provide, useClass }`로 바인딩한다.
- TypeORM schema를 application/service 레이어로 노출하지 않는다. repository에서 domain entity로 변환한다.
- 클린코드와 테스트 용이성은 `.clinerules/clean-code-solid-rules.md`, `.clinerules/testability-rules.md`를 따른다.
- 주석은 `.clinerules/code-commenting-rules.md`를 따른다.

## Chatbot API Shape

간단한 챗봇은 최소 아래 API를 제공한다.

- `GET /api/v1/chats`: 현재 사용자의 채팅 세션 목록
- `GET /api/v1/chats/:id`: 현재 사용자의 특정 세션과 메시지 목록
- `POST /api/v1/chats`: 새 채팅 세션 생성
- `DELETE /api/v1/chats/:id`: 현재 사용자의 세션 삭제
- `POST /api/v1/chats/:id/messages/stream`: 사용자 메시지 저장 후 AI 응답 스트리밍

모든 chat API는 기본적으로 `@UseGuards(JwtAuthGuard)`를 적용한다. 공개 테스트 엔드포인트가 필요하면 별도 controller로 분리한다.

## DTO Rules

- 요청 DTO는 `*.command.ts`에 둔다.
- 응답 DTO는 `*.response.ts`에 둔다.
- 내부 전달용 DTO는 `*.dto.ts`에 둔다.
- 요청 DTO에는 `class-validator`를 사용한다.
- Swagger 노출이 필요한 필드는 `@ApiProperty`를 붙인다.

예시 필드:

```ts
export class SendChatMessageCommand {
  @ApiProperty({ description: '사용자 메시지' })
  @IsString()
  @IsNotEmpty()
  content: string;
}
```

## SSE Rules

스트리밍 응답은 `date-course-generator`의 `/date-courses/generate` 패턴을 따른다.

- controller에서 `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`를 설정한다.
- 각 이벤트는 `data: ${JSON.stringify(event)}\n\n` 형식으로 보낸다.
- 이벤트 타입은 최소 `chunk`, `done`, `error`를 사용한다.
- `chunk`는 토큰 조각, `done`은 최종 assistant message id 또는 session id, `error`는 사용자에게 보여줄 에러 메시지를 담는다.
- stream 완료 후 assistant 전체 메시지를 DB에 저장하거나, 저장 실패 시 `error` 이벤트를 보낸 뒤 종료한다.
- 스트림 내부에서 발생한 에러는 throw로 방치하지 말고 `error` 이벤트 후 `complete/end` 처리한다.

권장 이벤트 타입:

```ts
export interface ChatSseEvent {
  type: 'chunk' | 'done' | 'error';
  data: string;
  messageId?: string;
  sessionId?: string;
}
```

## Persistence Rules

- id는 `uuid` v7을 사용한다.
- 모든 세션과 메시지는 `userId`를 가진다.
- 세션 목록 조회는 `createdAt` 또는 `updatedAt` 기준 최신순으로 정렬한다.
- 메시지 목록 조회는 생성순으로 정렬한다.
- `userId`, `sessionId`, `createdAt`/`updatedAt`에는 필요한 index를 둔다.
- 삭제는 처음에는 hard delete로 단순하게 시작해도 된다. soft delete가 필요하면 schema와 repository 규칙을 먼저 추가한다.

## Service Rules

- 사용자가 접근하는 모든 `sessionId`는 repository 조회 후 `userId` 소유권을 확인한다.
- OpenAI API key, model명, system prompt 기본값은 `ConfigService`에서 읽는다.
- 모델명 fallback은 코드에 둘 수 있지만, 운영 환경에서는 env로 바꿀 수 있게 한다.
- prompt 조립은 service private method로 분리한다.
- OpenAI stream에서 받은 partial content는 `fullContent`에 누적하고, 클라이언트에는 chunk 단위로 전달한다.

## App-Level Rules

- `AppModule`에는 `ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' })`, TypeORM 설정, 기능 모듈 imports만 둔다.
- `main.ts`에는 CORS, global prefix, URI versioning, `ValidationPipe({ transform: true, whitelist: true })`, 전역 exception filter, Swagger 설정을 둔다.
- 새로운 공통 에러/guard/decorator는 `backend/src/common` 아래에 둔다.
