# CUTY: Curate Your Travel

**여행을 고르는 것부터 나만의 여행을 만드는 것까지**

CUTY는 사용자의 취향과 관심사를 바탕으로 
**나에게 맞는 여행을 큐레이션하는 여행 서비스**이다.

수많은 여행 정보 속에서 원하는 여행지를 직접 찾고 비교하는 번거로움을 줄이고
사용자의 취향을 바탕으로 여행 테마와 콘텐츠를 탐색할 수 있도록 돕는다.

> **CUTY = Curate Your Travel**  
> "당신의 취향으로 당신만의 여행을 큐레이션하세요"

## 서비스 소개

- **Honeymoon Romance** — 특별한 날을 위한 로맨틱 허니문 여행
- **Parents Healing** — 부모님을 위한 효도·힐링 여행
- **Golf Challenge** — 골프와 함께하는 테마 여행
- **Outdoor Trekking** — 자연과 함께하는 아웃도어 여행

여행 테마를 선택한 뒤 투어 등급, 호텔, 교통, 식사 등의 옵션을 원하는 대로 구성할 수 있다.

> Software Engineering Project · University of Seoul

## 기술 스택

- TypeScript
- React
- Vite
- Tailwind CSS
- axios

## 폴더 구조

```
src/
├── api/          # 서버 도메인별 요청 함수 (axios). 파일 하나 = 서버 도메인 하나
├── pages/        # 라우트 단위 화면
├── components/   # 재사용 UI 컴포넌트
├── hooks/        # 로컬 저장 등 커스텀 훅
├── data/         # 초안용 샘플 여행 데이터
└── types/        # 공통 UI 타입
```

현재는 **FE 1단계: 탐색 가능한 UI 초안**이다. 테마 필터, 여행 검색, 찜, 여행 옵션 구성과 로컬 저장까지 구현되어 있다. 상품·가격은 샘플이며 인증·예약·결제는 아직 연결하지 않았다.

## 로컬 실행

```bash
npm ci
npm run dev
```

검증: `npm run build`, `npm run lint`. 실제 API를 연결할 때는 `.env.example`을 참고해 `VITE_API_BASE_URL`을 설정한다. 현재 초안은 서버 없이 실행된다.

## FE 작업 기준

- [디자인 방향과 템플릿 선정](DESIGN.md): Airbnb 탐색 패턴 + C 로고와 둥근 `uty` 워드마크, 하늘색·민트색 liquid glass 스타일.
- [단계별 제작 계획](docs/frontend-plan.md): 초안 → 명세 확정 → API 연동 → 신청/사용자 영역.
- [에이전트 작업 가이드](AGENTS.md): 이후 작업에도 적용할 프로젝트 규칙.

찜과 여행 구성은 현재 브라우저에만 저장된다. 사진은 외부 Unsplash 참고 이미지이므로 운영 전 실제 상품 이미지로 교체해야 한다.

### api/

`api/` 안의 파일은 [서버 저장소](https://github.com/UOS-MrWorld/mr-world-cuty-server)의 패키지와 1:1로 대응한다. 서버 쪽에 새 도메인이 생기면 여기도 같은 이름으로 파일을 추가해야 한다.

| 파일 | 대응하는 서버 도메인 | 다루는 API |
| --- | --- | --- |
| `auth.ts` | `auth` | 회원가입 / 로그인 / 토큰 재발급 / 로그아웃 |
| `member.ts` | `member` | 내 회원정보 조회·수정, 이전 여행 이력 |
| `tour.ts` | `tour` | 여행상품 조회/검색(고객), 등록·수정·삭제·현황(직원) |
| `wish.ts` | `wish` | 찜 등록/해제/목록 |
| `booking.ts` | `booking` | 여행신청, 취소, 결제 |
| `inventory.ts` | `inventory` | 직원용 재고 관리 |
| `customer.ts` | `customer` | 직원용 고객 관리, 단골 등급 정책 |

모든 요청은 `api/client.ts`의 axios 인스턴스(`apiClient`)를 거친다. JWT는 여기서 자동으로 헤더에 붙으므로 각 도메인 파일에서 직접 토큰을 다룰 필요는 없다.

요청/응답 바디 타입은 아직 `unknown`으로 열어둔 상태다. API 스펙이 확정되면 `types/`에 인터페이스를 정의하고 각 함수 시그니처를 채워야 한다.
