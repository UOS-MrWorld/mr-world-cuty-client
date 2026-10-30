# CUTY API 연동 진행 기록

기준일: 2026-10-30 (Asia/Seoul)  
기준 커밋: `b5b55fe5519763533c6af8e3f0d78d1c17b2aa97`
Auth 계약 확인 백엔드 커밋: `70382456dae034c281576491302938f17ca11df5`
최신 전체 API 계약 확인: `origin/main@d4fba18675edf3d13884ec4d0af35fcaed0bd78d`

## 목표

현재 화면 시연용 React 상태를 `/api/v1` JWT API와 연결한다. 화면 디자인은 유지하고, 인증·서버 상태·가격·예약·결제·직원 업무의 판단 주체를 서버로 옮긴다.

## 확정된 계약

- API 버전 경로: `/api/v1`
- 인증: JWT Bearer Token
- 고객 전용: `/api/v1/customer/**`
- 직원 전용: `/api/v1/staff/**`
- 공통: `/api/v1/**`
- 공통 에러: `{ success: false, message: string, code: number }`
- 날짜: `YYYY-MM-DD`, 일시: ISO-8601
- 예약·취소 마감과 투어 확정/취소, 자동 환불, 재고 차감, SMS, 완료 처리, 단골 산정은 서버 내부 로직이다.
- 음성 검색 API는 음성 파일이 아니라 프론트 STT가 만든 `queryText`를 받는다.

## 작업 로그

### 2026-10-30 — P0 기반 시작

- [x] 현재 프론트엔드와 요구사항 Gap Analysis
- [x] 공통 API 에러 타입과 정규화 오류 클래스 추가
- [x] JWT access token 접근을 API 클라이언트 내부 저장소로 격리
- [x] 로그인·회원가입 요청 DTO 추가
- [x] 백엔드 Auth Controller/DTO를 기준으로 성공 응답 타입 확정
- [x] 실제 로그인·회원가입·로그아웃 UI 연결
- [x] 401 응답의 단일 refresh 요청 및 원 요청 재시도
- [x] JWT 세션 복원과 CUSTOMER/STAFF 직원 화면 가드 연결
- [x] 실제 로그인 세션과 DEMO 세션의 권한 판정을 분리
- [x] 최신 서버 Tour·Booking·Payment·Member·Inventory·Customer Controller/DTO 재검토
- [x] 공통 enum·페이지 응답과 도메인별 요청/응답 TypeScript 계약 추가
- [x] GUI 검색·가격 계산·PENDING 수정·여행 내역·일괄 할인 API 함수 정정
- [x] 회원가입 전화번호를 서버 계약에 맞춰 숫자 10~11자리로 정규화
- [x] 실제 고객의 예약 목록·여행 내역·회원정보 조회 연결
- [x] 실제 고객의 연락처·주소 수정 연결
- [x] 일반 투어 인원 상한 제거·허니문 예약 2명 고정·전체 PAID 3명 기준으로 UI 정정
- [x] 서버가 받지 않는 직원용 최대 인원·최소 출발 인원 편집 필드 제거
- [x] 직원 Tour 등록·목록·상세·수정 API 타입 확정
- [x] 실제 고객 세션의 Tour 목록·GUI 검색·상세 조회 연결
- [x] 서버 고정 출발일을 상세·구성 화면에 읽기 전용으로 반영
- [x] 서버 미제공 이미지에는 테마 기본 이미지를 사용하고 지역 필터는 실제 세션에서 제외
- [x] 고객 Tour/Booking/Payment 요청에 `/customer` 역할 prefix 적용
- [x] Payment API를 Booking 파일에서 별도 도메인 파일로 분리
- [x] `npm run build`, `npm run lint`, `git diff --check` 통과
- [x] Auth 성공 응답 DTO 기준 로그인·재발급·로그아웃 연결
- [x] Tour 검색/상세/옵션 가격 계산 DTO 확정
- [x] Booking PENDING 생성·옵션 수정·조회·취소 DTO 확정
- [x] Payment 결제 상태 DTO 확정

## 계약 확인이 필요한 항목

1. 프론트 STT 구현 방식과 미지원 브라우저의 텍스트 검색 대체 동선

## 다음 작업 순서

1. 옵션 선택을 Quote API와 연결하고 PENDING 예약 생성
2. Mock 결제와 PAID/FAILED/REFUNDED 상태 연결
3. 음성 검색 결과를 GUI 검색 조건 모델에 합류

## 보존 원칙

- `src/data`의 샘플 값은 서버 DTO로 재사용하지 않는다.
- 프론트엔드 계산 결과는 예상 표시로만 사용하고 최종 가격·마감·상태는 서버 응답을 따른다.
- 재고 부족은 고객 예약·결제를 차단하지 않는다.
- DEMO 기능은 실제 연동이 검증될 때까지 별도 경로로 유지하고 프로덕션 세션과 섞지 않는다.
