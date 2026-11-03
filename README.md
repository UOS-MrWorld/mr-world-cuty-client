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

현재는 **FE 화면과 고객 API를 단계적으로 연결하는 중**이다. JWT 인증, 고객 상품 목록·검색·상세, Quote 옵션 가격, PENDING 예약 생성, Mock 결제, 예약 상세·취소, 예약 목록·여행 내역, 회원정보 조회·수정은 실제 서버 API를 사용한다. 별도 Voice AI 서비스의 음성 검색·상품 선택·옵션 구성·단계 이동도 연결했으며, 결제는 음성으로 실행하지 않는다. 직원 화면 실데이터 전환은 다음 연동 단계다. 로그인하지 않았거나 DEMO 모드를 선택하면 기존 샘플 화면을 사용한다.

홈의 3D 장면은 Three.js와 React Three Fiber를 사용하며 지연 로드한다. Liquid Glass 셰이더의 출처와 MIT 라이선스는 `src/vendor/liquid-glass`에 보관한다.

## 로컬 실행

```bash
npm ci
npm run dev
```

검증: `npm run build`, `npm run lint`. 실제 API를 확인할 때는 `.env.example`을 복사해 `VITE_API_BASE_URL`과 `VITE_VOICE_API_BASE_URL`을 설정하고 백엔드·Voice 서버를 함께 실행한다. DEMO 화면은 서버 없이도 확인할 수 있다.

고객 API를 화면에서 직접 확인하는 실행 순서와 예상 문구는 [고객 API 브라우저 확인 가이드](docs/api-browser-test-guide.md)에 정리했다. `DEMO` 시연과 실제 로그인 API 흐름을 구분하고, Quote → PENDING → 결제 실패·재시도 → 승인 → 취소·환불까지 같은 순서로 재현할 수 있다.

EC2 통합 배포에서는 Spring 서버가 이 저장소의 `main`을 빌드해 같은 origin에서 정적 화면과 `/api/v1`을 함께 제공한다. 따라서 배포 빌드는 `VITE_API_BASE_URL`을 별도로 지정하지 않고 기본 상대 경로 `/api/v1`을 사용한다. Mock 상품·장바구니·저장 구성은 사용자가 명시적으로 고객 시연 모드를 선택한 경우에만 표시한다. 일반 방문자는 로그인 안내를 보고, 실제 고객 로그인 중에는 서버 상품만 표시한다.

### api/

`api/` 안의 파일은 [서버 저장소](https://github.com/UOS-MrWorld/mr-world-cuty-server)의 패키지와 1:1로 대응한다. 서버 쪽에 새 도메인이 생기면 여기도 같은 이름으로 파일을 추가해야 한다.

| 파일 | 대응하는 서버 도메인 | 다루는 API |
| --- | --- | --- |
| `auth.ts` | `auth` | 회원가입 / 로그인 / 토큰 재발급 / 로그아웃 |
| `member.ts` | `member` | 내 회원정보 조회·수정 |
| `tour.ts` | `tour` | 여행상품 조회·검색·가격 계산(고객), 등록·수정·현황(직원) |
| `booking.ts` | `booking` | 여행신청, 옵션 수정, 목록·상세 조회, 취소, 여행 내역 |
| `payment.ts` | `payment` | Mock 결제 및 결제·환불 상태 |
| `inventory.ts` | `inventory` | 직원용 재고 관리 |
| `customer.ts` | `customer` | 직원용 고객 관리, 단골 등급 정책 |

모든 요청은 `api/client.ts`의 axios 인스턴스(`apiClient`)를 거친다. JWT는 여기서 자동으로 헤더에 붙으므로 각 도메인 파일에서 직접 토큰을 다룰 필요는 없다.

확정된 요청·응답 계약은 `types/*Api.ts`에 도메인별로 정의한다. 화면 시연 모델과 서버 DTO는 직접 섞지 않고 변환 계층을 통해 연결한다.
