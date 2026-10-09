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
- 디자인 작업에는 설치된 MengTo 스킬 중 `design-first-ui-prompting`을 기본으로 읽고, 고급 화면 연출에는 `build-awwwards-quality-sites`, 3D 변경에는 `threejs`, 모션 성능 점검에는 `optimize-web-animations`을 필요한 범위만 선택해 적용한다.
- 스노우볼 3D는 `@react-three/fiber`의 단일 `Canvas`를 유지한다. 테마별 장식 효과는 `src/components/globe/effects.tsx`의 프리셋과 R3F 컴포넌트로 확장하고, 화면이나 효과마다 새 렌더러를 만들지 않는다. 프리즘 림·카우스틱 셰이더는 새 RAF를 만들지 않고 같은 demand 프레임에서 갱신하며, 재질 전환 시 고유 투명도를 보존한다.
- Liquid Glass는 `src/liquid-glass-system.css`의 공통 재질 토큰과 `LiquidGlassLayer`의 단일 핵심 셰이더 표면을 사용한다. 개인정보·폼·페이지 전체 캡처와 화면마다 WebGL 인스턴스를 만드는 방식은 사용하지 않는다.
- 반응형, 키보드, focus-visible, 모달 닫기/포커스 복귀, 빈 결과, reduced-motion을 확인한다.
- 변경 뒤 `npm run build`와 `npm run lint`를 실행한다. 주요 흐름은 브라우저에서 확인하고 검증하지 못한 항목은 명시한다.
