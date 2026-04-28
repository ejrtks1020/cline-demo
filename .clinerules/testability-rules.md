# Testability Rules

코드는 처음부터 테스트하기 쉬운 형태로 만든다. 테스트를 나중에 억지로 붙일 수 있는 구조가 아니라, 의존성을 주입하고 순수 로직을 분리해 작은 단위로 검증할 수 있게 작성한다.

## Core Principles

- 비즈니스 로직은 순수 함수 또는 service method로 분리한다.
- 외부 의존성 DB, OpenAI, JWT, clock, uuid, network는 직접 호출하지 않고 주입 가능한 wrapper 또는 provider 뒤에 둔다.
- controller 테스트 없이도 service 로직을 검증할 수 있어야 한다.
- repository 없이도 service 테스트가 가능하도록 repository interface를 mock할 수 있게 한다.
- frontend hook과 component는 API client를 직접 하드코딩하지 않고 hook/store 경계에서 호출한다.

## Backend Testability

- service constructor에는 concrete class보다 interface token 기반 dependency를 주입한다.
- `new Date()`, `uuid.v7()` 같은 값 생성은 테스트에서 고정 가능하도록 helper/provider로 분리하는 것을 우선한다.
- OpenAI streaming은 adapter로 분리해 fake stream을 테스트에서 주입할 수 있게 한다.
- password hashing과 JWT sign/verify는 service에서 직접 구현하지 말고 provider 또는 Nest service로 감싼다.
- repository mapping 함수는 작은 private/helper 함수로 두고 edge case를 테스트하기 쉽게 유지한다.

## Frontend Testability

- UI component는 가능한 한 props만으로 렌더링 가능하게 만든다.
- streaming parser는 hook 내부에 모두 숨기지 말고 테스트 가능한 parser 함수로 분리하는 것을 우선한다.
- React Query key는 상수 또는 작은 factory로 관리해 테스트와 invalidation에서 같은 key를 사용한다.
- form validation은 zod schema로 분리해 UI 없이도 검증할 수 있게 한다.

## Test Coverage Targets

최소 테스트 대상:

- auth: signup, login 성공, login 실패, JWT payload 검증
- chat service: 세션 생성, 메시지 저장, 소유권 검증, stream done/error 처리
- repository: domain entity와 schema mapping
- frontend: auth store, streaming parser, 주요 form validation

## Design Checklist

- 이 함수가 DB 없이 테스트 가능한가?
- 이 service가 OpenAI API 없이 테스트 가능한가?
- 현재 시간을 고정해서 테스트할 수 있는가?
- UUID를 고정해서 snapshot 또는 응답 검증이 가능한가?
- 실패 케이스를 throw가 아닌 명시적인 exception 또는 error event로 검증할 수 있는가?
