# Documentation Sync Rules

규칙 변경이 시스템 설계, 모듈 구조, API 계약, 인증 흐름, 데이터 흐름, 저장 방식, 기술 스택에 영향을 주면 `docs/` 문서도 함께 현행화한다.

## Required Rules

- `.clinerules/` 변경으로 아키텍처 의사결정이 달라지면 관련 `docs/` 파일을 같은 작업에서 수정한다.
- API endpoint, request/response shape, SSE event, env, 인증 계약이 바뀌면 `docs/fullstack-chatbot-contract.md` 또는 관련 문서를 갱신한다.
- 백엔드 모듈 구조, 레이어 책임, repository 규칙이 바뀌면 `docs/backend-nest-chatbot-architecture.md`를 갱신한다.
- 프론트엔드 라우팅, 상태 관리, API client, streaming hook 규칙이 바뀌면 `docs/frontend-next-chatbot-architecture.md`를 갱신한다.
- 인증 방식, JWT payload, auth endpoint, token 저장 방식이 바뀌면 `docs/authentication-id-password-jwt.md`를 갱신한다.
- 규칙만 바뀌고 설계 문서 변경이 필요 없으면 그 이유가 명확해야 한다.
