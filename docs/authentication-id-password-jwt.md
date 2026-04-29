# Authentication: ID/Password JWT

이 프로젝트의 인증은 ID/password 기반 JWT 방식을 기본으로 한다. Google OAuth, 소셜 로그인, magic link는 별도 요구가 없는 한 구현하지 않는다.

## Auth Scope

- 사용자는 `loginId`와 `password`로 가입하고 로그인한다.
- `loginId`는 서비스 정책에 따라 email 또는 별도 username으로 사용할 수 있지만, 한 프로젝트 안에서는 하나로 통일한다.
- password 원문은 저장, 로그 출력, 응답 반환을 절대 하지 않는다.
- DB에는 `passwordHash`만 저장한다.
- 인증 성공 후 클라이언트는 JWT access token을 받아 API 요청에 `Authorization: Bearer <token>`으로 전달한다.

## Backend Endpoints

최소 인증 API는 아래 형태를 따른다.

```text
POST /api/v1/auth/signup
POST /api/v1/auth/login
GET  /api/v1/auth/me
```

선택적으로 refresh token이 필요하면 아래 API를 추가한다.

```text
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
```

## Backend Structure

NestJS 인증 모듈은 아래 구조를 기준으로 만든다.

```text
backend/src/auth/
  auth.module.ts
  application/
    auth.controller.ts
    auth.service.ts
    dto/
      auth.command.ts
      auth.response.ts
  infrastructure/
    strategies/
      jwt.strategy.ts

backend/src/user/
  user.module.ts
  domain/
    entities/
      user.entity.ts
  application/
    user.service.ts
  infrastructure/
    repositories/
      repository.interface.ts
      postgres/
        user.schema.ts
        user.repository.ts
```

## Implementation References

- 인증 구현 규칙은 `.clinerules/authentication-rules.md`에서 관리한다.
- 공통 보안과 입력 검증 규칙은 `.clinerules/security-validation-rules.md`를 따른다.
