# Code Commenting Rules

코드에는 간단하게라도 의도를 설명하는 주석을 작성한다. 단, 코드가 이미 명확하게 말하는 내용을 반복하는 주석은 작성하지 않는다.

## When to Comment

아래 경우에는 짧은 주석을 남긴다.

- 비즈니스 규칙이 코드만으로 바로 드러나지 않을 때
- 인증, 권한, 보안상 중요한 분기일 때
- SSE streaming, retry, buffer parsing처럼 흐름이 끊겨 보일 수 있는 로직일 때
- repository mapping처럼 domain entity와 persistence schema가 분리되는 지점일 때
- 테스트에서 특정 mock, fixture, edge case를 둔 이유가 있을 때

## Comment Style

- 주석은 한두 줄로 짧게 작성한다.
- 구현 내용을 그대로 번역하지 말고 `왜 필요한지`를 적는다.
- 임시 코드에는 `TODO:`와 이유를 함께 적는다.
- 제거 예정 코드에는 `Deprecated:` 또는 `TODO(remove):`처럼 의도를 명시한다.
- 한국어 프로젝트 문맥에서는 한국어 주석을 기본으로 한다. 외부 라이브러리 API 설명이나 표준 용어는 영어를 섞어도 된다.

좋은 예:

```ts
// SSE는 응답이 길게 유지되므로 global timeout보다 먼저 header를 flush한다.
res.flushHeaders();
```

나쁜 예:

```ts
// header를 flush한다.
res.flushHeaders();
```

## Documentation Comments

- public service method, controller endpoint, 복잡한 utility에는 필요할 때 JSDoc을 붙인다.
- DTO field 설명은 Swagger `@ApiProperty`를 우선 사용한다.
- 과도한 JSDoc으로 파일을 부풀리지 않는다.

## Review Checklist

- 주석이 코드와 다르게 말하지 않는지 확인한다.
- 오래된 TODO가 남아 있으면 현재 작업에서 해결하거나 이슈로 연결한다.
- 인증, 결제, 데이터 삭제, 외부 API 호출에는 의도 또는 주의점을 남긴다.
