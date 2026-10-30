# CUTY API 연동 진행 기록

기준일: 2026-10-30 (Asia/Seoul)  
기준 커밋: `b5b55fe5519763533c6af8e3f0d78d1c17b2aa97`
Auth 계약 확인 백엔드 커밋: `70382456dae034c281576491302938f17ca11df5`

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
- [x] 고객 Tour/Booking/Payment 요청에 `/customer` 역할 prefix 적용
- [x] Payment API를 Booking 파일에서 별도 도메인 파일로 분리
- [x] `npm run build`, `npm run lint`, `git diff --check` 통과
- [ ] Auth 성공 응답 DTO 확정 후 로그인·재발급·로그아웃 연결
- [ ] Tour 검색/상세/옵션 가격 계산 DTO 확정
- [ ] Booking PENDING 생성·옵션 수정·조회·취소 DTO 확정
- [ ] Payment 결제·환불 상태 DTO 확정

## 계약 확인이 필요한 항목

1. Tour GUI 검색/음성 검색/옵션 가격 계산의 정확한 경로와 요청·응답 DTO
2. Booking의 PENDING 옵션 수정 및 여행 내역 조회 경로
3. Payment 생성, 상태 조회, 자동 환불 결과 조회 경로
4. 음성 서버를 프론트에서 직접 호출하는지 메인 Tour API가 중계하는지 여부

## 다음 작업 순서

1. Tour 목록·상세·GUI 검색 DTO를 백엔드 명세와 맞춰 추가
2. 샘플 상품 목록을 서버 데이터로 전환
3. 음성 검색 결과를 GUI 검색 조건 모델에 합류
4. PENDING 예약 → 결제 → PAID/REFUNDED 상태 흐름 연결

## 보존 원칙

- `src/data`의 샘플 값은 서버 DTO로 재사용하지 않는다.
- 프론트엔드 계산 결과는 예상 표시로만 사용하고 최종 가격·마감·상태는 서버 응답을 따른다.
- 재고 부족은 고객 예약·결제를 차단하지 않는다.
- DEMO 기능은 실제 연동이 검증될 때까지 별도 경로로 유지하고 프로덕션 세션과 섞지 않는다.
