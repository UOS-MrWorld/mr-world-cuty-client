# CUTY frontend 작업 가이드

- 시작 전에 `README.md`, `DESIGN.md`, `docs/frontend-plan.md`를 읽는다.
- 기존 React + TypeScript + Vite + Tailwind 스택을 유지한다.
- 제품 중심 흐름: 취향 발견 → 네 가지 여행 테마 → 투어/호텔/교통/식사 구성 → 저장 → 향후 신청.
- 사용자를 위한 문구는 한국어로 쓰고, 디자인 규칙은 `DESIGN.md`에 따른다.
- 화면은 `src/pages`, 재사용 UI는 `src/components`, 훅은 `src/hooks`, 타입은 `src/types`에 둔다.
- `src/data`의 샘플 모델을 서버 계약으로 취급하지 않는다. API 스펙이 확정되면 별도 DTO 및 변환을 추가한다.
- 서버 요청은 기존 `src/api/client.ts`와 도메인별 API 함수만 통한다. 컴포넌트에서 직접 토큰을 다루지 않는다.
- 명세 미정인 인증/결제/예약을 가짜 성공 응답으로 구현하지 않는다. 초안 데이터임을 화면에서 알린다.
- 초안의 찜과 여행 구성은 localStorage로만 저장한다. 개인정보나 결제 정보를 저장하지 않는다.
- 새 UI 라이브러리, 전역 스킬, 3D/유리 효과 의존성 추가는 실제 요구와 번들 비용을 먼저 검토한다.
- 반응형, 키보드, focus-visible, 모달 닫기/포커스 복귀, 빈 결과, reduced-motion을 확인한다.
- 변경 뒤 `npm run build`와 `npm run lint`를 실행한다. 주요 흐름은 브라우저에서 확인하고 검증하지 못한 항목은 명시한다.
