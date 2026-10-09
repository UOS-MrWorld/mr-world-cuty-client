# CUTY: Curate Your Travel

**당신의 취향으로 당신만의 여행을 큐레이션하세요.**

CUTY는 허니문·효도·골프·트레킹 여행을 비교하고 호텔·교통·식사를 구성하는 여행 서비스입니다. 현재는 **FE 디자인 초안 v0.8**이며, [Notion — CUTY FE Draft](https://app.notion.com/p/3f2e7df2c0a280ed8942eb6c55dff7cf)의 화면·동작·스노우볼 요구를 반영하고 있습니다. 읽은 내용은 [원문 기록](docs/notion-fe-draft-source.md)에 보관했습니다.

## 현재 화면

홈은 긴 소개 페이지 대신 네 테마의 입체 스노우볼과 여행 조건 검색을 한 공간에 배치합니다. 고객 신청과 직원 업무는 각각 독립된 URL을 사용합니다.

| 영역 | 경로 | 구현한 내용 |
| --- | --- | --- |
| 브랜드 홈 | `/` | 허니문·가족/효도·골프·트레킹 3D 스노우볼, 약 14초 전환, 중앙 검색, 이용 안내 팝업 |
| 여행 탐색 | `/tours`, `/tours/:id` | 검색·필터·정렬, 사진 상품 카드, 테마 포함 사항·등급·일정·인원 선택 |
| 여행 구성 | `/tours/:id/configure` | 등급·호텔·교통·식사·음료 옵션, 기본 구성과 변경 차액, 구성 저장 |
| 신청·결제 | `/tours/:id/checkout` | 고객 시연 진입, 신청자와 모든 동행자, 카드·카카오페이·토스페이 결제 시연, 실패·재시도 |
| 신청 상세 | `/tours/:id/preview` | 구성 미리보기 또는 DEMO 신청 조회, 결제·출발·문자 상태 분리, D−7 모집 상태·취소 시연 |
| 회원 화면 | `/login`, `/signup`, `/my-trips` | 로그인·가입 입력 확인, 명시적 고객/직원 시연 선택, 여행 내역 팝업, 내 여행·개인정보 탭 |
| 직원 업무 | `/staff/tours`, `/staff/tours/new`, `/staff/tours/:id/edit`, `/staff/inventory`, `/staff/customers` | 시연 역할별 접근, 상품 세부 편집, 물품 등록·입고·수량 변경, 고객 정보·이력·단골 패널 |
| 장바구니 | `/cart` | 상품 담기·빼기, 담은 상품만 모아 보기 |

음성 버튼은 페이지 위에 작은 파형 표시를 띄웁니다. 마이크 입력의 크기만 브라우저 안에서 처리하며 음성 내용은 인식·전송·저장하지 않습니다.

## 실제 서비스와 시연의 구분

- 로그인·회원가입 폼은 입력을 검증하고 API 연결 전임을 안내합니다. 입력한 계정을 실제로 인증하거나 계정을 생성하지 않습니다.
- **고객 시연 모드 / 직원 화면 시연**은 계정 인증과 분리된 명시적 DEMO입니다. 시연 역할·프로필·신청은 메모리에만 유지됩니다.
- 결제 시연에는 실제 금전 거래가 없습니다. 카드·카카오페이·토스페이는 시연용 선택이며 실제 카드번호나 외부 결제 서비스 인증을 받지 않습니다. DEMO 신청번호는 실제 예약번호가 아닙니다.
- 직원 편집은 현재 직원 미리보기 목록에만 반영됩니다. 실제 서버 재고와 고객 상품·예약은 변경되지 않습니다.
- 가격은 샘플 1인 가격이며 옵션 차액도 예시입니다. 단골 등급·할인율·옵션 하향 변경·직원 가입 및 권한 정책 등은 추가 확정이 필요합니다.
- 실제 문자 발송, 출발 확정 작업, 자동 환불, 회원·상품·예약·직원 API는 미연동입니다.

Notion의 출발 조건은 화면 시연에 반영했습니다. 같은 상품·같은 출발일의 결제 완료 인원을 합산하고, 출발 7일 전 최종 확정 또는 인원 미달 취소를 표시합니다. 허니문은 커플 단위로 2~10명을 선택하고 최소 2커플(4명), 다른 테마는 최소 3명을 기준으로 합니다. D−7 경계 시각과 실제 운영 처리는 서버 정책으로 확정해야 합니다.

## 데이터와 개인정보

`localStorage`에는 `cuty:cart:v1` 장바구니 상품 ID와 `cuty:drafts:v1` 여행 구성만 저장합니다. 기존 `cuty:wishes:v1` 데이터가 있으면 장바구니 초기 데이터로 이어받습니다. 계정·비밀번호·개인정보·결제정보·DEMO 신청은 저장하지 않습니다. 음성 발화는 보관하지 않습니다. 고객·동행자·프로필·직원 고객 입력은 메모리에서만 사용하며, 새로고침·시연 종료 등 해당 화면의 생명주기가 끝나면 사라집니다. 샘플 데이터를 서버 계약으로 취급하지 않습니다.

상품 사진은 외부 Unsplash 참고 이미지입니다. 운영 전 실제 상품 이미지와 사용 권한을 확보해야 합니다. 사용자 제공 전체 CUTY 로고는 원본 파일을 유지합니다.

## 기술과 구조

React + TypeScript + Vite + Tailwind + axios를 유지합니다. 입체 장면은 `three`와 [pmndrs/react-three-fiber](https://github.com/pmndrs/react-three-fiber)를 사용하며 홈에서 지연 로드합니다. 단일 `Canvas`와 React 컴포넌트 수명주기를 유지하고, `src/components/globe/effects.tsx`가 테마별 파티클·별빛·무드 조명·프리즘 림·받침 카우스틱의 확장 지점입니다. 유리에는 실제 transmission·IOR·dispersion 재질을 사용하고 수면과 받침은 clearcoat 재질로 분리했습니다. Liquid Glass는 [dashersw/liquid-glass-js](https://github.com/dashersw/liquid-glass-js)의 MIT 셰이더를 로컬 어댑터로 사용합니다. 실제 셰이더는 홈 검색 표면의 장식 그라데이션만 렌더링하고, 같은 둥근 형태·틴트·굴절 림·하이라이트 재질은 `src/liquid-glass-system.css`가 헤더·카드·폼·모달·직원 화면에 공통 적용합니다. `html2canvas`로 화면이나 입력을 캡처하지 않으며 실제 배경 흐림은 CSS `backdrop-filter`가 담당합니다.

```text
src/
├── api/          # api/client.ts를 사용하는 서버 도메인별 요청 함수
├── pages/        # 고객·회원·직원 라우트 화면
├── components/   # 재사용 UI, globe 모델, 직원 폼
├── hooks/        # 경로·저장·reduced-motion·DEMO 메모리 상태
├── data/         # 샘플 상품·UI 계산·직원 입력 검증
├── types/        # UI 타입, 서버 DTO와 별도 취급
└── vendor/       # Liquid Glass 셰이더 어댑터와 MIT 라이선스
```

Codex 디자인 작업에는 MengTo/Skills의 `design-first-ui-prompting`, `build-awwwards-quality-sites`, `threejs`, `optimize-web-animations`을 선별 설치해 사용합니다. 프로젝트별 적용 범위와 성능·접근성 제한은 `AGENTS.md`에 고정했습니다.

API를 연결할 때는 `src/api/client.ts`와 `auth`, `member`, `tour`, `wish`, `booking`, `inventory`, `customer` 도메인 함수를 사용합니다. 컴포넌트에서 토큰을 직접 다루지 않습니다. 스펙 확정 후 별도 DTO와 UI 변환을 추가합니다.

## 실행과 검증

```bash
npm ci
npm run dev
npm run build
npm run lint
```

실제 API 연결 설정은 `.env.example`을 참고합니다. 현재 초안은 서버 없이 실행됩니다. v0.8 브라우저 검증은 진행 중이며, 이전 버전의 통과 기록을 현재 버전 결과로 해석하지 않습니다. 현재 측정한 홈 3D 지연 청크는 약 **949.72KB / gzip 255.43KB**로 Vite 크기 경고가 있습니다. 추가 검증 결과와 비용은 [제작 계획](docs/frontend-plan.md)에 기록합니다.

- [디자인 기준](DESIGN.md)
- [페이지·진입 경로·상태](docs/wireframe-pages.md)
- [스노우볼 모델과 연출](docs/snowglobe-concept.md)
- [에이전트 작업 가이드](AGENTS.md)
