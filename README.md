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
├── hooks/        # 커스텀 훅
└── types/        # 공통 타입
```

기획이 아직 확정 중이라 `pages`, `components`, `hooks`, `types`는 비워둔 상태다. 화면/기능이 정해지는 대로 그 안에 채워 넣으면 된다.

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
