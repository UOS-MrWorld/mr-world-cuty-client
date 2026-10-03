# CUTY 디자인 방향 — FE 초안 v0.4

## 결정

**Airbnb의 여행 탐색 패턴 + 사용자가 제공한 CUTY 로고의 하늘색·민트색과 말랑한 입체감 + liquid glass 표면**을 CUTY 전용 UI로 재구성한다. 2026-10-03 사용자 피드백에 따라 초기 warm minimal의 그린/베이지 대신 밝고 귀여운 브랜드 스타일을 적용했다. 완성된 외부 앱을 복제하지 않고 기존 React / Vite / TypeScript / Tailwind 프로젝트 위에 구현한다.

핵심은 ‘목적지 검색 → 예약’보다 **여행 취향 발견 → 테마 탐색 → 옵션 구성 → 저장**이다. README의 네 가지 테마를 서비스의 정보 구조로 유지한다.

## 확인한 별표 저장소와 채택 범위

2026-10-03 GitHub `uukdo`의 별표 목록에서 확인했다.

| 레퍼런스 | 판단 | CUTY 적용 |
| --- | --- | --- |
| [MengTo/Skills](https://github.com/MengTo/Skills) | 디자인 스킬 모음, 실행 가능한 React 앱 템플릿은 아님 | 구체적인 디자인 명세를 먼저 정하고, 구체적인 위계·일관된 간격 참고. 팔레트와 표면은 CUTY 로고에 맞춰 수정 |
| [awesome-design-md / Airbnb](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/airbnb/DESIGN.md) | 여행 탐색에 가장 가까운 디자인 가이드 | 사진 중심 카드, 테마 필터, 검색, 찜, 옵션 요약. Airbnb 상표·전용 폰트·카피는 사용하지 않음 |
| [liquid-glass-js](https://github.com/dashersw/liquid-glass-js) | 유리 효과 라이브러리 | 굴절 테두리·투명도·블러의 시각적 원리 참고. 이번 UI는 CSS backdrop-filter와 다층 하이라이트로 구현하며 WebGL/html2canvas 런타임은 추가하지 않음 |
| [react-three-fiber](https://github.com/pmndrs/react-three-fiber) | React용 Three.js 렌더러 | 첫 초안에서는 제외. 실제 3D 여행지 미리보기 요구가 정해지면 별도 검토 |

MengTo에서 읽고 적용한 가이드:
- [design-first-ui-prompting](https://github.com/MengTo/Skills/blob/main/agent-skills/ui/design-first-ui-prompting/SKILL.md): 목표, 위계, 타입, 색, 제약을 명문화.
- [clean-minimal-beige-light-mode](https://github.com/MengTo/Skills/blob/main/agent-skills/web-design/clean-minimal-beige-light-mode/SKILL.md): 초기 초안 참고. 현재는 로고 기반 파스텔 색상과 둥근 표면으로 대체.
- [image-first-grid-layout](https://github.com/MengTo/Skills/blob/main/agent-skills/web-design/image-first-grid-layout/SKILL.md): 사진을 크게 사용하고 어두운 오버레이로 텍스트 가독성 확보하는 방식 참고. 전체 화면 시스템으로 채택하지는 않음.

외부 스킬을 전역 설치하지 않았다. 프로젝트 규칙은 `AGENTS.md`, 디자인 결정은 이 파일에 유지한다.

## 디자인 토큰

- Canvas: `#FBFDFF`; primary: `#2879C9`; ink: `#263D57`.
- Muted text: `#64778B`; border: `#E0EBF5`; soft surface: `#EDF6FF`.
- 사용자 제공 로고 원본: `public/brand/cuty-icon.png`. 헤더, 메인, 하단, 파비콘에 사용. 원본 픽셀은 변경하지 않고 흰 배경은 SVG 색상 키 필터와 CSS mix-blend-mode로 화면에서만 합성한다. 로고 내부의 흰 하이라이트도 일부 투명해질 수 있어 밝은 유리 배경 위에서 사용한다. 헤더·푸터에서는 C + `uty` 워드마크, 메인·하단 브랜드 영역에서는 C 로고만 사용한다.
- 테마 색상은 로맨스 연분홍 / 힐링 민트 / 골프 연두 / 아웃도어 하늘색. 본문과 버튼은 충분히 진한 파랑 계열로 읽기 쉽게 유지한다.
- 워드마크: 제공된 C 로고 + 소문자 `uty`, Fredoka variable 600, width 108. 크기·간격·베이스라인을 하나의 `BrandMark`에서 관리한다.
- Fredoka는 Google Fonts 공식 저장소의 SIL OFL 글꼴이며 `public/fonts`에 자체 호스팅하고 라이선스를 동봉한다. 앱 사용 시 외부 폰트 요청 없음.
- 한국어 본문: 로컬 Pretendard → Apple SD Gothic Neo → Noto Sans KR → system sans.
- 콘텐츠 최대 너비 1184px; 4px 기반 여백; 섹션 간격 40–64px.
- 테마는 하트·새싹·골프·산 SVG 일러스트와 서로 다른 곡선의 유리 바탕으로 표현한다. 사진은 아치·조약돌 형태로 자르고 높이를 엇갈리게 배치한다. 검색·버튼·모달에는 유리 표면을 유지한다.
- 사진 4열 → 태블릿/모바일 2열 → 370px 미만 1열.
- 조작 아이콘은 선형 SVG, 테마는 파스텔 입체감을 표현한 SVG 일러스트를 사용한다.
- CTA 하나에 집중하고 대형 카피보다 탐색 내용에 우선순위를 둔다.
- 사용자 카피는 한국어, 영문은 짧은 브랜드/테마 라벨에 한정.

## 화면 구성

1. CUTY 로고 / 여행 발견 / 테마 컬렉션 / 내 여행 / 찜.
2. 밝은 하늘 배경, CUTY 로고, 구름·여행 엽서, 브랜드 메시지와 테마 탐색 CTA.
3. 여행지·키워드 검색.
4. 허니문 / 부모님과 힐링 / 골프 / 아웃도어 테마 선택.
5. 테마별 상품 필터와 사진 카드.
6. 투어 등급·호텔·교통·식사를 고르는 모달 및 예상 금액.
7. 나만의 여행 만들기 안내와 서비스 이용 순서.

## 동작·접근성

- 모든 표시 버튼은 필터, 검색, 이동, 모달, 저장 중 하나의 동작을 수행한다.
- 저장은 브라우저 localStorage이며 계정/서버와 연동하지 않는다.
- 키보드 접근, 포커스 표시, 건너뛰기 링크, 입력 라벨, 토글의 aria-pressed를 유지한다.
- 모달은 native dialog로 포커스를 제한하고 Escape 닫기, 닫은 뒤 포커스 복귀를 지원한다.
- reduced-motion을 존중한다. 자동 재생/가짜 캐러셀 컨트롤은 사용하지 않는다.
- 이미지, 금액, 일정은 샘플. 실제 후기·예약 가능 여부·할인율을 만들어 표시하지 않는다.
- 사진은 Unsplash 외부 URL을 사용하는 분위기용 참고 이미지다. 실제 상품·장소를 보증하지 않는다. 운영 전 공급자 이미지와 사용 권한을 확정하고 자체 제공 경로로 교체한다.

## 다음 변형을 만들 때

현재 로고와 하늘색·민트색을 브랜드 기준으로 유지한다. 사용자의 명시적인 방향 변경이 없다면 카드 비율이나 간격처럼 작은 단위로 조정한다. 과한 반짝임, 반복 애니메이션, 지나치게 유아적인 문구는 피한다.


## Liquid glass 표면 (v0.3)

`src/liquid-glass.css`에 브랜드와 유리 토큰을 모은다. 반투명 흰색·하늘색 그라데이션, backdrop blur/saturate, 안쪽 위·아래 하이라이트, 얇은 테두리와 부드러운 그림자를 조합한다. 메뉴·검색·버튼·모달에 유리 표면을 적용한다. 큰 사각 패널과 상품 카드 바탕은 v0.4에서 제거했다. 본문에는 블러나 굴절을 걸지 않는다. 이는 liquid glass의 CSS 시각 구현이며 물리 기반 실시간 굴절 렌더러는 아니다.

backdrop-filter 미지원 환경과 prefers-reduced-transparency에서는 불투명 바탕을 제공한다. 상시 애니메이션은 없으며 기존 reduced-motion 정책을 유지한다.

글꼴 출처: https://github.com/google/fonts/tree/main/ofl/fredoka

## 비정형 구성과 C 로고 후광 (v0.4)

`src/organic.css`에서 열린 레이아웃, 테마별 비정형 바탕, 높이가 엇갈리는 사진 구성을 정의한다. `ThemeIllustration`은 네 가지 테마 아이콘, `NeonLogo`는 C 단독 이미지와 하늘색·민트·연보라 후광을 담당한다. 흐린 색 번짐과 얇은 타원 빛을 조합하며 상시 애니메이션은 사용하지 않는다. 로고 필터 결과는 원본 알파로 다시 마스킹해 이미지 바깥에 검은 테두리가 생기지 않도록 한다.
