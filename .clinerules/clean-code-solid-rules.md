# Clean Code and SOLID Rules

코드는 SOLID 원칙을 기반으로 읽기 쉽고 변경하기 쉬운 구조로 작성한다. 단순한 기능이라도 책임 분리, 명확한 이름, 작은 함수, 의존성 역전을 기본값으로 삼는다.

## General Clean Code

- 함수와 class는 하나의 이유로 변경되도록 작게 유지한다.
- 이름은 축약보다 의미 전달을 우선한다.
- 중복 제거는 의미 있는 중복일 때만 수행한다. 우연히 비슷한 코드까지 성급하게 추상화하지 않는다.
- boolean flag가 많아지는 함수는 별도 함수 또는 전략 객체로 분리한다.
- null/undefined 가능성은 타입과 guard로 명확히 처리한다.
- error message와 exception type은 호출자가 이해할 수 있게 일관되게 사용한다.

## SOLID Rules

- Single Responsibility: controller, service, repository, domain entity의 책임을 섞지 않는다.
- Open/Closed: 새 provider, model, repository 구현을 추가할 때 기존 service 수정이 최소화되도록 interface를 둔다.
- Liskov Substitution: interface 구현체는 같은 입력에 대해 같은 계약을 지킨다.
- Interface Segregation: 큰 repository interface 하나에 모든 기능을 넣지 않고 feature 단위로 나눈다.
- Dependency Inversion: service는 concrete repository나 외부 SDK에 직접 강하게 묶이지 않도록 token/interface, adapter를 사용한다.

## NestJS Rules

- controller는 HTTP layer 역할만 담당한다.
- service는 use case orchestration을 담당한다.
- repository는 persistence mapping을 담당한다.
- OpenAI 같은 외부 API 호출은 필요하면 `AiProvider` 또는 `ChatCompletionPort` 같은 adapter interface 뒤로 감싼다.
- module provider는 interface token을 기준으로 바인딩한다.

## Frontend Rules

- page component는 orchestration만 담당하고 큰 UI 로직은 component/hook/store로 분리한다.
- REST server state는 React Query, local UI state는 component state, cross-component client state는 Zustand로 나눈다.
- form validation schema는 component 상단 또는 별도 파일로 분리한다.
- UI component는 가능한 한 props 기반 pure component로 만든다.

## Function Size Rules

- 한 함수가 40줄을 넘으면 책임 분리를 검토한다.
- 한 파일이 250줄을 넘으면 분리할 수 있는 component, hook, dto, utility가 있는지 확인한다.
- 복잡한 조건문은 이름 있는 predicate 함수로 분리한다.

## Naming Rules

- command DTO는 동사를 포함한다. 예: `LoginCommand`, `SendChatMessageCommand`
- response DTO는 반환 대상을 명확히 한다. 예: `AuthResponse`, `ChatSessionResponse`
- repository method는 persistence 의도를 드러낸다. 예: `findByLoginId`, `findMessagesBySessionId`
- hook은 `use` prefix를 지킨다.
