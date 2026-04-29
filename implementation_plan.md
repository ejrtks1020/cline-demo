# Implementation Plan

[Overview]
NestJS 백엔드와 Next.js 프론트엔드를 새로 구성해 `docs/` 계약을 따르는 간단한 인증 기반 풀스택 챗봇을 구현한다.

현재 저장소에는 실행 코드가 없고 `docs/`와 `.clinerules/`만 존재하므로, 구현은 루트에 `backend/`와 `frontend/` 하위 프로젝트를 생성하는 방식으로 진행한다. 백엔드는 NestJS 11, TypeORM, PostgreSQL, ID/password JWT 인증, Swagger, OpenAI SSE 스트리밍을 제공하고, 프론트엔드는 Next.js App Router, locale 라우팅, React Query, Zustand, Axios, fetch streaming hook으로 채팅 경험을 구성한다.

구현 범위는 사용자가 가입/로그인한 뒤 채팅 세션을 생성하고, 세션별 메시지를 조회하며, 사용자 메시지 저장 후 OpenAI 응답을 SSE 이벤트로 점진 표시하고 최종 assistant 메시지를 DB에 저장하는 최소 제품이다. 인증 및 채팅 API 계약은 `docs/authentication-id-password-jwt.md`, `docs/backend-nest-chatbot-architecture.md`, `docs/frontend-next-chatbot-architecture.md`, `docs/fullstack-chatbot-contract.md`를 기준으로 하며, 보안/검증/테스트 가능성은 `.clinerules/`의 규칙을 따른다.

OpenAI API key나 PostgreSQL 서버가 없는 개발 환경에서도 프로젝트가 빌드될 수 있도록 env 예시와 명확한 fallback/검증 경계를 둔다. 실제 스트리밍 동작은 `OPENAI_API_KEY`, DB 접속 정보, `JWT_SECRET`이 설정된 환경에서 확인하며, production에서는 secret 누락과 위험한 DB sync 설정을 방지하도록 설계한다.

[Types]
백엔드 domain entity, DTO, JWT payload, repository interface와 프론트엔드 공유 타입을 새로 정의한다.

Backend domain and auth types:

```ts
// backend/src/auth/application/dto/auth.command.ts
export class SignupCommand {
  loginId: string; // @IsString, @IsNotEmpty, @MinLength(3), @MaxLength(50), @Matches(/^[a-zA-Z0-9_.@-]+$/)
  password: string; // @IsString, @MinLength(8), @MaxLength(72), @Matches(/^\S+$/)
  name?: string; // @IsOptional, @IsString, @MaxLength(50)
}

export class LoginCommand {
  loginId: string; // @IsString, @IsNotEmpty
  password: string; // @IsString, @IsNotEmpty
}

// backend/src/auth/application/dto/auth.response.ts
export class AuthResponse {
  accessToken: string;
  user: UserPublicResponse;
}

export class UserPublicResponse {
  id: string;
  loginId: string;
  name?: string;
}

// backend/src/auth/infrastructure/strategies/jwt-payload.interface.ts
export interface JwtPayload {
  sub: string;
  loginId: string;
}

// backend/src/common/decorators/current-user.decorator.ts
export interface CurrentUserPayload {
  id: string;
  loginId: string;
}
```

Backend user domain and persistence types:

```ts
// backend/src/user/domain/entities/user.entity.ts
export class User {
  constructor(
    public readonly id: string,
    public readonly loginId: string,
    public readonly passwordHash: string,
    public readonly name: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}

// backend/src/user/infrastructure/repositories/repository.interface.ts
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByLoginId(loginId: string): Promise<User | null>;
  save(user: User): Promise<User>;
}
export const IUserRepository = Symbol('IUserRepository');
```

Backend chat command, response, and stream types:

```ts
// backend/src/chat/application/dto/chat.command.ts
export class CreateChatSessionCommand {
  title?: string; // @IsOptional, @IsString, @MaxLength(100)
}

export class SendChatMessageCommand {
  content: string; // @IsString, @IsNotEmpty, @MinLength(1), @MaxLength(4000), transformed trim
}

// backend/src/chat/application/dto/chat.dto.ts
export type ChatMessageRole = 'user' | 'assistant';

export interface ChatSseEvent {
  type: 'chunk' | 'done' | 'error';
  data: string;
  messageId?: string;
  sessionId?: string;
}

export interface StreamChatMessageResult {
  writeEvent(event: ChatSseEvent): void;
}

// backend/src/chat/application/dto/chat.response.ts
export class ChatSessionResponse {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export class ChatMessageResponse {
  id: string;
  sessionId: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
}

export class ChatSessionDetailResponse {
  session: ChatSessionResponse;
  messages: ChatMessageResponse[];
}
```

Backend chat domain and repository types:

```ts
// backend/src/chat/domain/entities/chat-session.entity.ts
export class ChatSession {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly title: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}

// backend/src/chat/domain/entities/chat-message.entity.ts
export class ChatMessage {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly sessionId: string,
    public readonly role: 'user' | 'assistant',
    public readonly content: string,
    public readonly createdAt: Date,
  ) {}
}

// backend/src/chat/infrastructure/repositories/repository.interface.ts
export interface IChatRepository {
  createSession(session: ChatSession): Promise<ChatSession>;
  findSessionsByUserId(userId: string): Promise<ChatSession[]>;
  findSessionById(sessionId: string): Promise<ChatSession | null>;
  deleteSessionById(sessionId: string): Promise<void>;
  saveMessage(message: ChatMessage): Promise<ChatMessage>;
  findMessagesBySessionId(sessionId: string): Promise<ChatMessage[]>;
  updateSessionTitleAndTimestamp(sessionId: string, title: string, updatedAt: Date): Promise<void>;
  touchSession(sessionId: string, updatedAt: Date): Promise<void>;
}
export const IChatRepository = Symbol('IChatRepository');
```

Frontend shared types:

```ts
// frontend/src/types/index.ts
export interface UserPublic {
  id: string;
  loginId: string;
  name?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: UserPublic;
}

export interface SignupParams {
  loginId: string;
  password: string;
  name?: string;
}

export interface LoginParams {
  loginId: string;
  password: string;
}

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

export interface ChatSessionDetail {
  session: ChatSession;
  messages: ChatMessage[];
}

export interface CreateChatSessionParams {
  title?: string;
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

[Files]
루트에 backend와 frontend 프로젝트 파일을 생성하고 기존 docs는 계약 변경 없이 참조만 유지한다.

New backend files to create:

- `backend/package.json`: NestJS backend scripts and dependencies.
- `backend/tsconfig.json`, `backend/tsconfig.build.json`: TypeScript compiler settings.
- `backend/nest-cli.json`: Nest CLI source root and build config.
- `backend/.env.example`: required backend env variables without secrets.
- `backend/src/main.ts`: bootstrap, CORS allowlist, `/api` prefix, URI versioning, validation pipe, Swagger.
- `backend/src/app.module.ts`: global config, TypeORM connection, feature modules.
- `backend/src/common/decorators/current-user.decorator.ts`: extracts `{ id, loginId }` from request user.
- `backend/src/common/guards/jwt-auth.guard.ts`: Passport JWT auth guard wrapper.
- `backend/src/common/filters/http-exception.filter.ts`: consistent API error shape without leaking internals.
- `backend/src/common/providers/uuid.provider.ts`: UUID v7 generation wrapper for testability.
- `backend/src/common/providers/password-hasher.provider.ts`: bcrypt hash/compare wrapper.
- `backend/src/auth/auth.module.ts`: auth module wiring.
- `backend/src/auth/application/auth.controller.ts`: signup/login/me endpoints.
- `backend/src/auth/application/auth.service.ts`: signup, login, current user use cases.
- `backend/src/auth/application/dto/auth.command.ts`: `SignupCommand`, `LoginCommand`.
- `backend/src/auth/application/dto/auth.response.ts`: `AuthResponse`, `UserPublicResponse`.
- `backend/src/auth/infrastructure/strategies/jwt.strategy.ts`: JWT validation strategy.
- `backend/src/auth/infrastructure/strategies/jwt-payload.interface.ts`: JWT payload contract.
- `backend/src/user/user.module.ts`: user module and repository provider binding.
- `backend/src/user/domain/entities/user.entity.ts`: pure user domain entity.
- `backend/src/user/application/user.service.ts`: user lookup helpers for auth.
- `backend/src/user/infrastructure/repositories/repository.interface.ts`: `IUserRepository` and token.
- `backend/src/user/infrastructure/repositories/postgres/user.schema.ts`: TypeORM `EntitySchema` with unique `loginId` index.
- `backend/src/user/infrastructure/repositories/postgres/user.repository.ts`: postgres repository mapping schema to domain.
- `backend/src/chat/chat.module.ts`: chat module and repository/provider binding.
- `backend/src/chat/domain/entities/chat-session.entity.ts`: pure chat session domain entity.
- `backend/src/chat/domain/entities/chat-message.entity.ts`: pure chat message domain entity.
- `backend/src/chat/application/chat.controller.ts`: guarded REST and SSE endpoints.
- `backend/src/chat/application/chat.service.ts`: session CRUD, ownership checks, message save, OpenAI stream orchestration.
- `backend/src/chat/application/dto/chat.command.ts`: create session and send message commands.
- `backend/src/chat/application/dto/chat.dto.ts`: internal stream and event DTOs.
- `backend/src/chat/application/dto/chat.response.ts`: session/message response DTOs.
- `backend/src/chat/infrastructure/ai/chat-completion.port.ts`: adapter interface for streaming model output.
- `backend/src/chat/infrastructure/ai/openai-chat-completion.adapter.ts`: OpenAI SDK implementation.
- `backend/src/chat/infrastructure/repositories/repository.interface.ts`: `IChatRepository` and token.
- `backend/src/chat/infrastructure/repositories/postgres/chat-session.schema.ts`: TypeORM session schema with indexes.
- `backend/src/chat/infrastructure/repositories/postgres/chat-message.schema.ts`: TypeORM message schema with indexes.
- `backend/src/chat/infrastructure/repositories/postgres/chat.repository.ts`: postgres chat repository with domain mapping.
- `backend/test/auth.service.spec.ts`: auth service unit tests.
- `backend/test/chat.service.spec.ts`: chat service unit tests with fake repository/AI adapter.

New frontend files to create:

- `frontend/package.json`: Next.js frontend scripts and dependencies.
- `frontend/tsconfig.json`, `frontend/next.config.ts`, `frontend/postcss.config.mjs`, `frontend/eslint.config.mjs`: Next.js/TypeScript/tooling config.
- `frontend/.env.local.example`: frontend API URL example.
- `frontend/src/app/globals.css`: Tailwind global styles.
- `frontend/src/app/[locale]/layout.tsx`: locale layout and providers.
- `frontend/src/app/[locale]/page.tsx`: redirects to `/chat` or login based on auth state.
- `frontend/src/app/[locale]/chat/layout.tsx`: chat route layout shell.
- `frontend/src/app/[locale]/chat/page.tsx`: chat page orchestration.
- `frontend/src/app/[locale]/login/page.tsx`: login form page.
- `frontend/src/app/[locale]/signup/page.tsx`: signup form page.
- `frontend/src/components/providers.tsx`: React Query provider and client setup.
- `frontend/src/components/chat-sidebar.tsx`: sessions list, new chat, delete chat.
- `frontend/src/components/chat-message-list.tsx`: persisted and streaming messages list.
- `frontend/src/components/chat-message.tsx`: message bubble component.
- `frontend/src/components/chat-input.tsx`: prompt input and submit UI.
- `frontend/src/components/auth-form.tsx`: shared login/signup form UI or two small form components if clearer.
- `frontend/src/components/ui/button.tsx`: reusable button primitive.
- `frontend/src/components/ui/input.tsx`: reusable input primitive.
- `frontend/src/components/ui/scroll-area.tsx`: simple scroll container primitive.
- `frontend/src/hooks/use-auth.ts`: signup/login/me/logout mutations and helpers.
- `frontend/src/hooks/use-chat-sessions.ts`: React Query hooks for chat REST API.
- `frontend/src/hooks/use-chat-stream.ts`: fetch SSE streaming hook.
- `frontend/src/hooks/chat-query-keys.ts`: shared React Query key factory.
- `frontend/src/lib/api.ts`: Axios instance with Bearer interceptor and 401 handling.
- `frontend/src/lib/stream-parser.ts`: testable SSE line parser.
- `frontend/src/lib/utils.ts`: className helper.
- `frontend/src/stores/auth-store.ts`: Zustand persist auth state.
- `frontend/src/stores/chat-store.ts`: Zustand streaming state.
- `frontend/src/types/index.ts`: shared frontend types.
- `frontend/src/i18n/routing.ts`, `frontend/src/i18n/request.ts`: next-intl locale routing config.
- `frontend/middleware.ts`: next-intl middleware for locale routes.
- `frontend/messages/ko.json`, `frontend/messages/en.json`: localized UI text.

Existing files to modify:

- `.gitignore`: optionally add `coverage/`, `.turbo/`, `backend/.env`, `frontend/.env.local` if needed; current patterns already ignore common outputs and env files.
- `README.md`: replace the one-line placeholder with local setup instructions for backend, frontend, env, DB, and verification commands.
- `docs/fullstack-chatbot-contract.md`: update only if implementation intentionally changes API shape, env names, or stream events; otherwise no change.
- `docs/authentication-id-password-jwt.md`: update only if auth contract changes; current implementation should follow it without changes.
- `docs/backend-nest-chatbot-architecture.md`: update only if backend folder structure or layer responsibility changes; current plan follows it.
- `docs/frontend-next-chatbot-architecture.md`: update only if frontend folder structure or state strategy changes; current plan follows it.

Files to delete or move:

- None. The repository currently has no source files to migrate.

Configuration updates:

- Backend TypeORM config in `backend/src/app.module.ts` reads `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`, `DB_SYNC` from `ConfigService`.
- Backend JWT config reads `JWT_SECRET`, `JWT_EXPIRES_IN`; production startup must fail if `JWT_SECRET` is missing.
- Backend CORS reads `FRONTEND_URL` and allows exact origin matches.
- Frontend Axios base URL uses `NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'` and appends `/api/v1`.

[Functions]
Service, repository, adapter, hook, parser, and UI handler functions will be added with narrow responsibilities.

New backend functions and methods:

- `bootstrap(): Promise<void>` in `backend/src/main.ts`: configure Nest application, validation, CORS, Swagger, and listen on `PORT`.
- `CurrentUser(): ParameterDecorator` in `backend/src/common/decorators/current-user.decorator.ts`: expose authenticated user as `{ id, loginId }`.
- `UuidProvider.generate(): string` in `backend/src/common/providers/uuid.provider.ts`: return `uuidv7()` for IDs.
- `PasswordHasherProvider.hash(password: string): Promise<string>` in `backend/src/common/providers/password-hasher.provider.ts`: bcrypt hash.
- `PasswordHasherProvider.compare(password: string, hash: string): Promise<boolean>` in `backend/src/common/providers/password-hasher.provider.ts`: bcrypt compare.
- `AuthController.signup(command: SignupCommand): Promise<AuthResponse>` in `backend/src/auth/application/auth.controller.ts`: create account and return token plus public user.
- `AuthController.login(command: LoginCommand): Promise<AuthResponse>` in `backend/src/auth/application/auth.controller.ts`: authenticate without exposing failure reason.
- `AuthController.me(user: CurrentUserPayload): Promise<UserPublicResponse>` in `backend/src/auth/application/auth.controller.ts`: return current user profile.
- `AuthService.signup(command: SignupCommand): Promise<AuthResponse>` in `backend/src/auth/application/auth.service.ts`: validate uniqueness, hash password, save user, sign JWT.
- `AuthService.login(command: LoginCommand): Promise<AuthResponse>` in `backend/src/auth/application/auth.service.ts`: lookup user, compare password, throw `UnauthorizedException` with generic message on failure.
- `AuthService.getCurrentUser(userId: string): Promise<UserPublicResponse>` in `backend/src/auth/application/auth.service.ts`: read current user public data.
- `AuthService.signAccessToken(user: User): Promise<string>` private in `backend/src/auth/application/auth.service.ts`: sign `{ sub, loginId }`.
- `JwtStrategy.validate(payload: JwtPayload): Promise<CurrentUserPayload>` in `backend/src/auth/infrastructure/strategies/jwt.strategy.ts`: validate JWT payload shape.
- `UserService.findById(id: string): Promise<User | null>` in `backend/src/user/application/user.service.ts`: user lookup.
- `UserRepository.findById(id: string): Promise<User | null>` in `backend/src/user/infrastructure/repositories/postgres/user.repository.ts`: DB lookup and mapping.
- `UserRepository.findByLoginId(loginId: string): Promise<User | null>` in `backend/src/user/infrastructure/repositories/postgres/user.repository.ts`: unique login lookup.
- `UserRepository.save(user: User): Promise<User>` in `backend/src/user/infrastructure/repositories/postgres/user.repository.ts`: persist user.
- `UserRepository.toDomain(record: UserSchemaRecord): User` private in `backend/src/user/infrastructure/repositories/postgres/user.repository.ts`: schema-to-domain mapping.
- `UserRepository.toPersistence(user: User): UserSchemaRecord` private in `backend/src/user/infrastructure/repositories/postgres/user.repository.ts`: domain-to-schema mapping.
- `ChatController.listSessions(user: CurrentUserPayload): Promise<ChatSessionResponse[]>` in `backend/src/chat/application/chat.controller.ts`: `GET /chats`.
- `ChatController.getSession(id: string, user: CurrentUserPayload): Promise<ChatSessionDetailResponse>` in `backend/src/chat/application/chat.controller.ts`: `GET /chats/:id`.
- `ChatController.createSession(command: CreateChatSessionCommand, user: CurrentUserPayload): Promise<ChatSessionResponse>` in `backend/src/chat/application/chat.controller.ts`: `POST /chats`.
- `ChatController.deleteSession(id: string, user: CurrentUserPayload): Promise<void>` in `backend/src/chat/application/chat.controller.ts`: `DELETE /chats/:id`.
- `ChatController.streamMessage(id: string, command: SendChatMessageCommand, user: CurrentUserPayload, res: Response): Promise<void>` in `backend/src/chat/application/chat.controller.ts`: set SSE headers and delegate streaming.
- `ChatService.listSessions(user: CurrentUserPayload): Promise<ChatSessionResponse[]>` in `backend/src/chat/application/chat.service.ts`: return latest sessions for user.
- `ChatService.getSession(sessionId: string, user: CurrentUserPayload): Promise<ChatSessionDetailResponse>` in `backend/src/chat/application/chat.service.ts`: ownership check and message load.
- `ChatService.createSession(command: CreateChatSessionCommand, user: CurrentUserPayload): Promise<ChatSessionResponse>` in `backend/src/chat/application/chat.service.ts`: create titled session.
- `ChatService.deleteSession(sessionId: string, user: CurrentUserPayload): Promise<void>` in `backend/src/chat/application/chat.service.ts`: ownership check and hard delete.
- `ChatService.streamMessage(sessionId: string, command: SendChatMessageCommand, user: CurrentUserPayload, emit: (event: ChatSseEvent) => void): Promise<void>` in `backend/src/chat/application/chat.service.ts`: save user message, stream AI chunks, save assistant message, emit done/error.
- `ChatService.ensureOwnedSession(sessionId: string, userId: string): Promise<ChatSession>` private in `backend/src/chat/application/chat.service.ts`: return session or throw `NotFoundException`.
- `ChatService.buildMessagesForModel(session: ChatSession, messages: ChatMessage[], userContent: string): ChatCompletionMessageParam[]` private in `backend/src/chat/application/chat.service.ts`: separate system prompt and user messages.
- `ChatService.createDefaultTitle(content: string): string` private in `backend/src/chat/application/chat.service.ts`: derive session title from first user message.
- `OpenAiChatCompletionAdapter.stream(messages: ChatCompletionMessageParam[]): AsyncIterable<string>` in `backend/src/chat/infrastructure/ai/openai-chat-completion.adapter.ts`: yield text chunks from OpenAI stream.
- `ChatRepository.createSession(session: ChatSession): Promise<ChatSession>` in `backend/src/chat/infrastructure/repositories/postgres/chat.repository.ts`.
- `ChatRepository.findSessionsByUserId(userId: string): Promise<ChatSession[]>` in `backend/src/chat/infrastructure/repositories/postgres/chat.repository.ts`.
- `ChatRepository.findSessionById(sessionId: string): Promise<ChatSession | null>` in `backend/src/chat/infrastructure/repositories/postgres/chat.repository.ts`.
- `ChatRepository.deleteSessionById(sessionId: string): Promise<void>` in `backend/src/chat/infrastructure/repositories/postgres/chat.repository.ts`.
- `ChatRepository.saveMessage(message: ChatMessage): Promise<ChatMessage>` in `backend/src/chat/infrastructure/repositories/postgres/chat.repository.ts`.
- `ChatRepository.findMessagesBySessionId(sessionId: string): Promise<ChatMessage[]>` in `backend/src/chat/infrastructure/repositories/postgres/chat.repository.ts`.
- `ChatRepository.touchSession(sessionId: string, updatedAt: Date): Promise<void>` in `backend/src/chat/infrastructure/repositories/postgres/chat.repository.ts`.
- `ChatRepository.updateSessionTitleAndTimestamp(sessionId: string, title: string, updatedAt: Date): Promise<void>` in `backend/src/chat/infrastructure/repositories/postgres/chat.repository.ts`.
- `ChatRepository.toSessionDomain`, `toMessageDomain`, `toSessionPersistence`, `toMessagePersistence` private mapping helpers in `backend/src/chat/infrastructure/repositories/postgres/chat.repository.ts`.

New frontend functions and hooks:

- `getAccessToken(): string | null` in `frontend/src/stores/auth-store.ts` or `frontend/src/lib/api.ts`: safely read token only in browser.
- `useAuthStore` actions `setAuth(auth: AuthResponse)`, `clearAuth()`, `logout()` in `frontend/src/stores/auth-store.ts`.
- `useChatStore` actions `startStreaming(sessionId: string)`, `appendChunk(chunk: string)`, `completeStreaming(messageId?: string)`, `setError(error: string)`, `resetStreaming()` in `frontend/src/stores/chat-store.ts`.
- `login(params: LoginParams): Promise<AuthResponse>` in `frontend/src/hooks/use-auth.ts`.
- `signup(params: SignupParams): Promise<AuthResponse>` in `frontend/src/hooks/use-auth.ts`.
- `useLogin()`, `useSignup()`, `useLogout()`, `useMe()` hooks in `frontend/src/hooks/use-auth.ts`.
- `chatQueryKeys.sessions(): readonly unknown[]` and `chatQueryKeys.detail(id: string): readonly unknown[]` in `frontend/src/hooks/chat-query-keys.ts`.
- `useChatSessions(): UseQueryResult<ChatSession[]>` in `frontend/src/hooks/use-chat-sessions.ts`.
- `useChatSession(id?: string): UseQueryResult<ChatSessionDetail>` in `frontend/src/hooks/use-chat-sessions.ts`.
- `useCreateChatSession(): UseMutationResult<ChatSession, Error, CreateChatSessionParams | undefined>` in `frontend/src/hooks/use-chat-sessions.ts`.
- `useDeleteChatSession(): UseMutationResult<void, Error, string>` in `frontend/src/hooks/use-chat-sessions.ts`.
- `parseSseBuffer(buffer: string): { events: ChatSseEvent[]; remainingBuffer: string }` in `frontend/src/lib/stream-parser.ts`: parse complete `data: ` lines and ignore malformed JSON.
- `useChatStream(): { sendMessage: (sessionId: string, params: SendChatMessageParams) => Promise<void> }` in `frontend/src/hooks/use-chat-stream.ts`: perform authenticated fetch stream and invalidate queries on done.
- `Providers({ children }: { children: React.ReactNode }): JSX.Element` in `frontend/src/components/providers.tsx`: provide React Query client.
- `ChatPage(): JSX.Element` in `frontend/src/app/[locale]/chat/page.tsx`: orchestrate selected session, auth redirect, hooks, and components.
- `ChatSidebar(props): JSX.Element` in `frontend/src/components/chat-sidebar.tsx`: session navigation and delete/new controls.
- `ChatMessageList(props): JSX.Element` in `frontend/src/components/chat-message-list.tsx`: render persisted messages plus streaming assistant content.
- `ChatMessage(props): JSX.Element` in `frontend/src/components/chat-message.tsx`: render role-specific bubble.
- `ChatInput(props): JSX.Element` in `frontend/src/components/chat-input.tsx`: validate non-empty prompt and submit.
- `LoginPage(): JSX.Element` in `frontend/src/app/[locale]/login/page.tsx` and `SignupPage(): JSX.Element` in `frontend/src/app/[locale]/signup/page.tsx`: form pages using zod/react-hook-form.

Modified functions:

- None, because no existing source functions are present.

Removed functions:

- None.

[Classes]
NestJS modules/controllers/services/providers/entities and React component functions will be created according to the documented layer responsibilities.

New backend classes:

- `AppModule` in `backend/src/app.module.ts`: imports `ConfigModule`, `TypeOrmModule`, `AuthModule`, `UserModule`, `ChatModule`; contains no business logic.
- `HttpExceptionFilter` in `backend/src/common/filters/http-exception.filter.ts`: catches HTTP exceptions and returns sanitized error JSON.
- `UuidProvider` in `backend/src/common/providers/uuid.provider.ts`: injectable ID generation wrapper.
- `PasswordHasherProvider` in `backend/src/common/providers/password-hasher.provider.ts`: injectable password hashing wrapper.
- `AuthModule` in `backend/src/auth/auth.module.ts`: wires controller, service, JWT module, Passport, strategy, password hasher.
- `AuthController` in `backend/src/auth/application/auth.controller.ts`: HTTP layer for `/auth`.
- `AuthService` in `backend/src/auth/application/auth.service.ts`: auth use cases, JWT signing, password validation.
- `SignupCommand`, `LoginCommand` in `backend/src/auth/application/dto/auth.command.ts`: class-validator request DTOs.
- `AuthResponse`, `UserPublicResponse` in `backend/src/auth/application/dto/auth.response.ts`: response DTOs excluding `passwordHash`.
- `JwtStrategy` in `backend/src/auth/infrastructure/strategies/jwt.strategy.ts`: Passport JWT strategy.
- `UserModule` in `backend/src/user/user.module.ts`: user repository binding.
- `User` in `backend/src/user/domain/entities/user.entity.ts`: pure domain entity, no TypeORM decorators.
- `UserService` in `backend/src/user/application/user.service.ts`: user lookup and public mapping.
- `UserRepository` in `backend/src/user/infrastructure/repositories/postgres/user.repository.ts`: persistence implementation.
- `ChatModule` in `backend/src/chat/chat.module.ts`: chat repository and AI adapter binding.
- `ChatSession` in `backend/src/chat/domain/entities/chat-session.entity.ts`: pure domain entity.
- `ChatMessage` in `backend/src/chat/domain/entities/chat-message.entity.ts`: pure domain entity.
- `ChatController` in `backend/src/chat/application/chat.controller.ts`: guarded HTTP/SSE endpoints.
- `ChatService` in `backend/src/chat/application/chat.service.ts`: chat use cases and stream orchestration.
- `CreateChatSessionCommand`, `SendChatMessageCommand` in `backend/src/chat/application/dto/chat.command.ts`: class-validator request DTOs.
- `ChatSessionResponse`, `ChatMessageResponse`, `ChatSessionDetailResponse` in `backend/src/chat/application/dto/chat.response.ts`: API response DTOs.
- `OpenAiChatCompletionAdapter` in `backend/src/chat/infrastructure/ai/openai-chat-completion.adapter.ts`: OpenAI SDK adapter behind a port.
- `ChatRepository` in `backend/src/chat/infrastructure/repositories/postgres/chat.repository.ts`: TypeORM implementation mapping schemas to domain entities.

New frontend component/function classes:

- `Providers` in `frontend/src/components/providers.tsx`: provider component.
- `ChatSidebar` in `frontend/src/components/chat-sidebar.tsx`: pure UI component with callback props.
- `ChatMessageList` in `frontend/src/components/chat-message-list.tsx`: pure UI component plus scroll behavior.
- `ChatMessage` in `frontend/src/components/chat-message.tsx`: pure message bubble component.
- `ChatInput` in `frontend/src/components/chat-input.tsx`: controlled input component.
- `AuthForm` or separate login/signup form components in `frontend/src/components/auth-form.tsx`: form UI using zod schemas.
- `Button`, `Input`, `ScrollArea` in `frontend/src/components/ui/*.tsx`: small reusable UI primitives.

Modified classes:

- None, because no existing classes are present.

Removed classes:

- None.

[Dependencies]
Add backend NestJS/OpenAI/PostgreSQL/auth dependencies and frontend Next.js/React Query/Zustand/form/UI dependencies.

Backend dependencies in `backend/package.json`:

- Runtime: `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `@nestjs/config`, `@nestjs/typeorm`, `@nestjs/swagger`, `@nestjs/passport`, `@nestjs/jwt`, `passport`, `passport-jwt`, `typeorm`, `pg`, `reflect-metadata`, `rxjs`, `class-validator`, `class-transformer`, `bcrypt`, `uuid`, `openai`.
- Dev/test: `@nestjs/cli`, `@nestjs/schematics`, `@nestjs/testing`, `typescript`, `ts-node`, `ts-jest`, `jest`, `@types/jest`, `@types/node`, `@types/bcrypt`, `@types/passport-jwt`, `eslint`, `prettier`, `supertest`, `@types/supertest`.

Frontend dependencies in `frontend/package.json`:

- Runtime: `next`, `react`, `react-dom`, `next-intl`, `@tanstack/react-query`, `zustand`, `axios`, `zod`, `react-hook-form`, `@hookform/resolvers`, `lucide-react`, `clsx`, `tailwind-merge`.
- Optional UI rendering: `react-markdown` only if Markdown responses are rendered; otherwise omit initially to keep scope small.
- Dev/test: `typescript`, `eslint`, `eslint-config-next`, `tailwindcss`, `@tailwindcss/postcss`, `@testing-library/react`, `@testing-library/jest-dom`, `jest`, `jest-environment-jsdom`, `ts-jest` or `vitest` depending on selected frontend test runner.

Integration requirements:

- Use `pnpm` commands because the environment has `pnpm` available and the project can remain workspace-free with separate backend/frontend installs.
- Backend requires PostgreSQL reachable by env values before runtime integration testing.
- Backend requires `OPENAI_API_KEY` for real AI streaming; unit tests should inject a fake `ChatCompletionPort` and must not call OpenAI.
- Frontend requires `NEXT_PUBLIC_API_URL=http://localhost:4000` to call backend in local development.

[Testing]
Use unit tests for core backend services and stream parsing plus build/type checks for both projects.

Backend test requirements:

- `backend/test/auth.service.spec.ts` covers signup success, duplicate `loginId`, login success, login failure with generic `UnauthorizedException`, JWT payload containing `sub` and `loginId`, and response excluding `passwordHash`.
- `backend/test/chat.service.spec.ts` covers session creation, list ordering assumption via repository contract, get/delete ownership checks returning `NotFoundException`, user message save before AI stream, chunk accumulation, assistant message save on done, and error event behavior when AI adapter throws.
- Repository mapping helpers should be indirectly covered by repository tests if a test database is available; otherwise include focused unit tests for mapping behavior where practical.
- Controller e2e tests are optional for the initial implementation but routes should be manually verified through Swagger or curl.

Frontend test requirements:

- `frontend/src/lib/stream-parser.test.ts` covers parsing multiple `data: ` events, preserving partial buffer, ignoring malformed JSON, and ignoring non-data lines.
- `frontend/src/stores/auth-store.test.ts` covers auth set/clear/logout state changes if a test runner is configured.
- Form schemas in login/signup components or extracted files should validate minimum password length, required `loginId`, and optional `name` length.

Validation strategy:

- Backend verification: run `cd backend && pnpm install && pnpm build` and `cd backend && pnpm test` after implementation.
- Frontend verification: run `cd frontend && pnpm install && pnpm build` and frontend tests if configured.
- Manual integration: start PostgreSQL, set backend `.env`, run backend on port 4000, run frontend on port 3000, signup/login, create a chat, send one message, confirm first chunk appears, done invalidates detail query, refresh restores persisted messages.
- Security validation: confirm 401 clears frontend token/store, backend never logs password/token, auth failure message does not reveal whether `loginId` exists, and response DTOs never include `passwordHash`.

[Implementation Order]
Implement backend foundation first, then authentication, then chat streaming, then frontend integration and verification.

1. Create `backend/` project configuration (`package.json`, TypeScript, Nest CLI, env example) and common bootstrap (`main.ts`, `app.module.ts`, common guard/decorator/filter/providers).
2. Implement backend user and auth modules: domain entity, TypeORM schema, user repository, auth DTOs, service, controller, JWT strategy, and module wiring.
3. Implement backend chat domain and persistence: `ChatSession`, `ChatMessage`, TypeORM schemas, repository interface/token, postgres repository mapping, and module provider bindings.
4. Implement backend chat service/controller: guarded REST endpoints, UUID parameter validation, ownership checks, SSE headers/events, OpenAI adapter, assistant message persistence, and safe error events.
5. Add backend tests for auth and chat services with mocked repositories/providers and fake AI streaming; run backend build/tests.
6. Create `frontend/` project configuration, Next.js locale setup, global styles, providers, API client, shared types, and i18n messages.
7. Implement frontend auth store, auth hooks, login/signup pages, Bearer token request interceptor, 401 cleanup, and logout behavior.
8. Implement frontend chat REST hooks, chat streaming store, testable SSE parser, `useChatStream`, and query invalidation on done.
9. Implement frontend chat UI route and components: sidebar, message list, message bubble, input, loading/error states, auth redirect, and progressive assistant rendering.
10. Add frontend parser/store/form tests where configured; run frontend build/tests.
11. Update `README.md` with setup, env, run, build, and manual verification steps; update `docs/` only if implementation diverged from the documented contract.
12. Perform end-to-end manual verification with PostgreSQL and OpenAI env: signup, login, create/delete sessions, stream a message, refresh and confirm persistence.
