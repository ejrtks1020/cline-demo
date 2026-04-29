# Authentication Rules

인증 구조와 API 계약은 `docs/authentication-id-password-jwt.md`를 기준으로 구현한다.

## Password Rules

- password hash는 `bcrypt` 또는 `argon2` 같은 검증된 라이브러리를 사용한다.
- password validation은 최소 길이, 공백 제한, 정책 위반 메시지를 DTO에서 처리한다.
- login 실패 시 `UnauthorizedException`을 사용하고, ID 존재 여부를 추측할 수 있는 메시지를 반환하지 않는다.
- password 변경 기능을 만들 경우 현재 password 검증 후 새 hash를 저장한다.

## JWT Rules

- JWT payload에는 최소 `sub`와 `loginId`를 포함한다.
- 민감한 개인 정보나 password 관련 값은 payload에 넣지 않는다.
- `JWT_SECRET`, `JWT_EXPIRES_IN`은 `ConfigService`에서 읽는다.
- 인증이 필요한 API는 `JwtAuthGuard`와 `CurrentUser` 데코레이터를 사용한다.
- `CurrentUser`는 service에서 필요한 최소 정보만 넘기도록 `{ id: string; loginId: string }` 형태를 기본으로 한다.

권장 payload:

```ts
export interface JwtPayload {
  sub: string;
  loginId: string;
}
```

## DTO Rules

- signup command에는 `loginId`, `password`, 선택적으로 `name`을 둔다.
- login command에는 `loginId`, `password`만 둔다.
- auth response에는 `accessToken`과 사용자 공개 정보만 포함한다.
- response DTO에 `passwordHash`를 포함하지 않는다.

권장 응답:

```ts
export class AuthResponse {
  accessToken: string;
  user: {
    id: string;
    loginId: string;
    name?: string;
  };
}
```

## Frontend Rules

- 로그인/회원가입 화면은 `src/app/[locale]/login`, `src/app/[locale]/signup`에 둔다.
- 인증 상태는 `stores/auth-store.ts`의 Zustand persist store로 관리한다.
- access token은 기존 구조처럼 localStorage에 저장할 수 있다. 단, XSS 위험이 큰 화면에서는 httpOnly cookie 기반 refresh token 도입을 검토한다.
- Axios request interceptor에서 access token을 Bearer header로 붙인다.
- 401 응답을 받으면 access token과 auth store를 초기화하고 login route로 이동한다.
- logout은 access token 제거, auth store 초기화, login route 이동을 모두 수행한다.

## Security Rules

- 인증 실패 원인을 상세히 노출하지 않는다.
- token, password, passwordHash는 logger에 남기지 않는다.
- CORS는 `FRONTEND_URL` 기반 allowlist로 제한한다.
- production에서는 `JWT_SECRET` 누락 시 앱이 시작되지 않게 한다.
