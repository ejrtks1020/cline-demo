# Security and Validation Rules

기본 기능을 구현할 때도 보안과 입력 검증을 함께 고려한다. 특히 인증, 사용자 입력, AI prompt, SSE stream, DB 저장 영역은 명시적으로 검증한다.

## Input Validation

- backend request DTO에는 `class-validator`를 사용한다.
- frontend form에는 `zod`와 `react-hook-form`을 사용한다.
- 문자열 입력은 최소 길이, 최대 길이, 허용 문자, trim 여부를 명확히 정한다.
- chat message는 과도하게 긴 입력을 막기 위해 최대 길이를 둔다.
- ID parameter는 UUID pipe 또는 명시적 validator로 검증한다.

## Output Safety

- password, passwordHash, token secret, internal error stack은 응답에 포함하지 않는다.
- AI 응답을 HTML로 직접 렌더링하지 않는다. Markdown이 필요하면 sanitizer 또는 안전한 renderer 설정을 검토한다.
- 에러 응답은 사용자에게 필요한 수준으로만 제공하고 내부 구현 세부사항은 숨긴다.

## Authentication Security

- 인증 구현의 상세 구조와 API 계약은 `docs/authentication-id-password-jwt.md`를 따른다.
- password 원문, `passwordHash`, token, secret은 저장 목적 외 로그와 응답에 포함하지 않는다.
- password hash는 `bcrypt` 또는 `argon2` 같은 검증된 라이브러리를 사용한다.
- 로그인 실패 응답은 ID 존재 여부를 추측할 수 없게 일반화한다.
- JWT payload에는 민감한 개인 정보나 password 관련 값을 넣지 않는다.
- production에서는 `JWT_SECRET` 누락 시 앱이 시작되지 않게 한다.

## Configuration

- 필수 env는 앱 시작 시 검증한다.
- production에서 `DB_SYNC=true` 사용을 피한다.
- CORS origin은 `FRONTEND_URL` 기반 allowlist를 사용한다.
- OpenAI model, JWT 만료 시간, DB 연결 정보는 env로 변경 가능하게 둔다.

## Logging

- request logging은 method, path, status, duration 중심으로 남긴다.
- Authorization header, password, token, prompt에 포함된 민감 정보는 마스킹한다.
- stream error는 원인 추적이 가능하게 서버 로그에는 남기되, client event에는 일반화된 메시지를 보낸다.

## AI Prompt Safety

- system prompt와 user message를 분리한다.
- 사용자 입력을 prompt에 넣을 때 역할과 범위를 명확히 구분한다.
- AI가 반환한 내용을 DB에 저장하기 전에 필요한 경우 길이와 형식을 검증한다.
- 내부 시스템 규칙, env, secret을 AI 응답으로 노출하지 않도록 prompt에 명시한다.
