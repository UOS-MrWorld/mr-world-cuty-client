import { useEffect, useState } from 'react'
import { cancelBooking, getBooking } from '../api/booking'
import { AppLink } from '../components/AppLink'
import { Icon } from '../components/Icon'
import { PreviewDialog } from '../components/PreviewDialog'
import { TripSummary } from '../components/TripSummary'
import { getDepartureState, getRecruitmentDeadline, paymentMethodLabels } from '../data/demoBookings'
import { formatPrice } from '../data/travel'
import { useDemoSession } from '../hooks/useDemoSession'
import { useAuth } from '../hooks/useAuth'
import type { BookingDetailResponse } from '../types/bookingApi'
import type { Tour, TravelDraft } from '../types/travel'

const apiBookingStatusLabels = { PENDING: '결제 전', PAID: '결제 완료', CANCELLED: '예약 취소' }
const apiPaymentStatusLabels = { SUCCESS: '결제 성공', FAILED: '결제 실패', REFUNDED: '환불 완료' }
const apiLevelLabels = { CLASSIC: '클래식', GRAND: '그랜드', PREMIUM: '프리미엄' }
const apiHotelLabels = { THREE_STAR: '3등급 호텔', FOUR_STAR: '4등급 호텔', FIVE_STAR: '5등급 호텔' }
const apiMealLabels = { LUNCH_BOX: '도시락', LOCAL_RESTAURANT: '현지식 레스토랑', FINE_DINING: '파인다이닝' }
const apiTransportLabels = { PREMIUM_CAR_2: '2인 전용 고급차량', PREMIUM_VAN_10: '10인승 고급차량' }
const apiTourStatusLabels = { RECRUITING: '모집 중', CONFIRMED: '출발 확정', COMPLETED: '여행 완료', CANCELLED: '투어 취소' }

function ApiBookingPreview({ tour, bookingId }: { tour: Tour; bookingId: number }) {
  const [booking, setBooking] = useState<BookingDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [notice, setNotice] = useState('')
  const [cancelOpen, setCancelOpen] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    void getBooking(bookingId).then(response => {
      if (active) setBooking(response.data)
    }).catch(error => {
      if (active) setErrorMessage(error instanceof Error ? error.message : '예약 상세를 불러오지 못했습니다.')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [bookingId])

  async function cancel() {
    if (!booking || cancelling) return
    setCancelling(true)
    setErrorMessage('')
    try {
      const { data } = await cancelBooking(booking.bookingId)
      setBooking({ ...booking, bookingStatus: data.bookingStatus, paymentStatus: data.paymentStatus })
      setCancelOpen(false)
      setNotice(data.paymentStatus === 'REFUNDED' ? '예약을 취소하고 결제를 환불했습니다.' : '예약을 취소했습니다.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '예약을 취소하지 못했습니다.')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return <p className="notice" role="status">서버에서 예약 상세를 불러오는 중입니다.</p>
  if (!booking) return <div className="empty-state"><Icon name="compass" size={36} /><h1>예약 상세를 불러오지 못했어요.</h1><p>{errorMessage}</p><AppLink className="button secondary" href="/my-trips?tab=bookings">예약 목록으로</AppLink></div>

  return <>
    <div className="page-heading"><p className="eyebrow">예약 상세</p><h1>{booking.tour.tourName}</h1><p>예약·결제·출발 상태를 서버 기준으로 확인합니다.</p></div>
    {notice && <p className="notice" role="status">{notice}</p>}
    {errorMessage && <p className="notice notice-error" role="alert">{errorMessage}</p>}
    <div className="flow-layout"><div className="flow-main">
      <section className="surface-card"><h2 className="section-title">예약 상태</h2><div className="status-grid"><div className={`status-card${booking.bookingStatus === 'PAID' ? ' status-complete' : ''}`}><p className="status-label">예약</p><h3>{apiBookingStatusLabels[booking.bookingStatus]}</h3><p className="muted">예약번호 {booking.bookingId}</p></div><div className={`status-card${booking.paymentStatus === 'SUCCESS' ? ' status-complete' : ''}`}><p className="status-label">결제</p><h3>{booking.paymentStatus ? apiPaymentStatusLabels[booking.paymentStatus] : '결제 기록 없음'}</h3><p className="muted">할인 전 {formatPrice(booking.totalPrice)}원 · 할인율 {booking.discountRate}%</p></div></div></section>
      <section className="surface-card"><h2 className="section-title">선택 구성</h2><dl className="detail-facts"><div><dt>출발일</dt><dd>{booking.tour.startDate}</dd></div><div><dt>인원</dt><dd>{booking.guestCount}명</dd></div><div><dt>등급</dt><dd>{apiLevelLabels[booking.tourLevel]}</dd></div><div><dt>호텔</dt><dd>{apiHotelLabels[booking.hotelGrade]}</dd></div><div><dt>식사</dt><dd>{apiMealLabels[booking.mealType]}</dd></div><div><dt>교통</dt><dd>{apiTransportLabels[booking.transport]}</dd></div><div><dt>음료</dt><dd>{booking.drinkOptions.length ? booking.drinkOptions.map(option => `${option.drinkName} ${option.quantity}개`).join(' · ') : '선택 없음'}</dd></div></dl></section>
      <section className="surface-card"><h2 className="section-title">취소·환불</h2><p>출발 7일 전 마감까지 취소할 수 있으며, 결제 완료 예약은 자동 환불됩니다.</p><button className="button secondary" type="button" disabled={cancelling || booking.bookingStatus === 'CANCELLED'} onClick={() => setCancelOpen(true)}>{booking.bookingStatus === 'CANCELLED' ? '취소된 예약' : cancelling ? '취소 처리 중…' : '예약 취소'}</button></section>
      <div className="action-row"><AppLink className="button primary" href="/my-trips?tab=bookings">내 예약 목록</AppLink><AppLink className="button secondary" href="/tours">다른 여행 보기</AppLink></div>
    </div><aside className="flow-summary surface-card"><p className="eyebrow">선택 상품</p><img src={tour.image} alt={tour.imageAlt} /><h2>{booking.tour.tourName}</h2><dl className="summary-details"><div><dt>투어 상태</dt><dd>{apiTourStatusLabels[booking.tour.tourStatus]}</dd></div><div><dt>여행 기간</dt><dd>{booking.tour.startDate} ~ {booking.tour.endDate}</dd></div><div><dt>예약 금액</dt><dd>{formatPrice(booking.totalPrice)}원</dd></div></dl></aside></div>
    {cancelOpen && <PreviewDialog title="예약을 취소할까요?" onClose={() => setCancelOpen(false)}><p>{booking.tour.tourName} · 예약번호 {booking.bookingId}</p><p>{booking.paymentStatus === 'SUCCESS' ? '취소하면 성공 결제가 자동 환불됩니다.' : '취소하면 PENDING 예약을 더 이상 결제할 수 없습니다.'}</p><div className="action-row"><button className="button secondary" type="button" onClick={() => setCancelOpen(false)}>예약 유지하기</button><button className="button primary" type="button" disabled={cancelling} onClick={() => void cancel()}>{cancelling ? '취소 처리 중…' : '예약 취소 확인'}</button></div></PreviewDialog>}
  </>
}

export function BookingPreviewPage({ tour, draft }: { tour: Tour; draft: TravelDraft }) {
  const { session: authSession } = useAuth()
  const { bookings, cancelDemoBooking } = useDemoSession()
  const bookingId = new URLSearchParams(window.location.search).get('booking')
  const booking = bookings.find(item => item.id === bookingId && item.tourId === tour.id)
  const selectedDraft = booking?.draft ?? draft
  const [cancelOpen, setCancelOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const deadline = getRecruitmentDeadline(selectedDraft.date)
  const departure = getDepartureState(tour, selectedDraft.date, bookings)
  const cancelled = booking?.status === 'cancelled'
  const canCancel = Boolean(booking) && !cancelled && !departure.closed

  if (authSession?.role === 'CUSTOMER' && tour.source === 'api' && bookingId && /^\d+$/.test(bookingId)) return <ApiBookingPreview tour={tour} bookingId={Number(bookingId)} />

  if (bookingId && !booking) return <div className="empty-state"><Icon name="compass" size={38} /><h1>시연 신청 내역을 찾을 수 없어요.</h1><p>시연 내역은 현재 메모리에만 유지됩니다. 새로고침하거나 시연을 종료하면 사라져요.</p><AppLink className="button primary" href="/my-trips">내 여행으로 <Icon name="arrow" size={18} /></AppLink></div>

  return <>
    <div className="page-heading"><p className="eyebrow">신청 결과·상세</p><h1>{booking ? cancelled ? '여행 신청을 취소했어요.' : '여행 신청을 확인해 주세요.' : '선택한 여행을 미리 확인해요.'}</h1><p>{booking ? '결제 상태와 출발 확정 상태를 각각 확인할 수 있어요.' : '아직 신청·결제가 진행되지 않은 구성 미리보기입니다.'}</p></div>
    <div className="flow-layout">
      <div className="flow-main">
        <div className="notice demo-notice"><span className="demo-badge">{booking ? 'DEMO' : 'PREVIEW'}</span><strong>{booking ? '실제 결제·예약 내역이 아닙니다.' : '신청 전 미리보기입니다.'}</strong></div>
        {notice && <p className="notice" role="status">{notice}</p>}
        <section className="surface-card" aria-labelledby="booking-status-heading">
          <h2 className="section-title" id="booking-status-heading">신청 상태</h2>
          <dl className="detail-facts"><div><dt>신청번호</dt><dd className="booking-id">{booking?.id ?? '미발급'}</dd></div><div><dt>신청 상태</dt><dd>{booking ? cancelled ? '취소됨 · 시연' : '신청 완료 · 시연' : '신청 전 · 미리보기'}</dd></div>{booking && <div><dt>신청 일시</dt><dd>{new Date(booking.paidAt).toLocaleString('ko-KR')}</dd></div>}</dl>
          <div className="status-grid">
            <div className={`status-card${booking ? ' status-complete' : ''}`}><p className="status-label">결제 상태</p><h3>{booking ? cancelled ? '환불 완료 · 시연' : '결제 완료 · 시연' : '결제 미진행'}</h3><p className="muted">{booking ? `${paymentMethodLabels[booking.paymentMethod]} · ${formatPrice(booking.amount)}원` : '결제 내역 없음'}</p></div>
            <div className={`status-card${booking && departure.closed && departure.enough && !cancelled ? ' status-complete' : ''}`}><p className="status-label">출발 상태</p><h3>{booking ? cancelled ? '신청 취소' : departure.label : '출발 미정'}</h3><p className="muted">{booking ? cancelled ? '모집 인원에서 제외됨' : departure.explanation : '신청 후 모집 인원에 반영됩니다.'}</p></div>
          </div>
        </section>
        <section className="surface-card" aria-labelledby="departure-heading">
          <h2 className="section-title" id="departure-heading">출발 현황</h2>
          {booking && <div className="recruitment-progress"><div><span>결제 완료 인원</span><strong>{departure.participants}명 <small>/ 최소 {departure.minimum}명</small></strong></div><progress aria-label={`현재 ${departure.participants}명, 최소 ${departure.minimum}명`} value={Math.min(departure.participants, departure.minimum)} max={departure.minimum} />{tour.theme === 'romance' && <small>허니문 예약은 건별 2명이며, 출발 판정은 전체 결제 인원 합계 기준입니다.</small>}</div>}
          <dl className="detail-facts"><div><dt>모집 마감</dt><dd>{deadline} · 출발 7일 전</dd></div><div><dt>출발 확정 기준</dt><dd>전체 결제 인원 3명 이상</dd></div></dl>
          <p className="summary-note">출발 여부는 모집 마감일에 확정됩니다.</p>
        </section>
        {booking && <section className="surface-card" aria-labelledby="booking-travelers-heading">
          <h2 className="section-title" id="booking-travelers-heading">신청자·동행자</h2>
          <details className="booking-person-details"><summary>총 {booking.draft.travelers}명의 시연 정보 확인</summary>{[booking.applicant, ...booking.companions].map((person, index) => <dl className="detail-facts" key={index}><div><dt>{index === 0 ? '신청자' : `동행자 ${index}`}</dt><dd>{person.name}</dd></div><div><dt>연락처</dt><dd>{person.contact}</dd></div><div><dt>주소</dt><dd>{person.address}</dd></div></dl>)}</details>
        </section>}
        {booking && <section className="surface-card" aria-labelledby="booking-cancel-heading">
          <h2 className="section-title" id="booking-cancel-heading">취소·환불</h2>
          <p>{deadline} 모집 마감 전까지 신청을 취소할 수 있어요.</p>
          <button className="button secondary" type="button" disabled={!canCancel} onClick={() => setCancelOpen(true)}>{cancelled ? '취소된 신청' : '신청 취소·환불 시연'}</button>
          <p className="summary-note">{cancelled ? '시연 내역에서 취소 처리했습니다.' : departure.closed ? '모집 마감 후에는 취소할 수 없습니다.' : '취소 시 모집 인원에서 제외됩니다.'}</p>
        </section>}
        <div className="action-row">{!booking && <AppLink className="button secondary" href={`/tours/${tour.id}/checkout${window.location.search}`}>신청·결제로 돌아가기</AppLink>}<AppLink className="button primary" href={`/my-trips${booking ? '?tab=bookings' : ''}`}>내 여행에서 확인 <Icon name="arrow" size={18} /></AppLink></div>
        <AppLink className="text-link" href="/tours">다른 여행 둘러보기 <Icon name="arrow" size={16} /></AppLink>
      </div>
      <TripSummary tour={tour} draft={selectedDraft}>{!booking && <AppLink className="button secondary" href={`/tours/${tour.id}/configure${window.location.search}`}>여행 구성 수정하기</AppLink>}</TripSummary>
    </div>
    {cancelOpen && booking && <PreviewDialog title="신청을 취소할까요?" onClose={() => setCancelOpen(false)}><p>{booking.title} · {booking.draft.date} · {booking.draft.travelers}명</p><p>취소하면 모집 인원에서 제외돼요. 시연 금액 {formatPrice(booking.amount)}원은 실제 환불 없이 취소 상태로 표시됩니다.</p><div className="action-row"><button className="button secondary" type="button" onClick={() => setCancelOpen(false)}>여행 유지하기</button><button className="button primary" type="button" onClick={() => { const success = cancelDemoBooking(booking.id); setCancelOpen(false); setNotice(success ? '시연 신청을 취소했습니다. 모집 인원 집계에 반영됐어요.' : '모집 마감 이후에는 취소할 수 없습니다.') }}>취소 시연 적용 <Icon name="check" size={17} /></button></div></PreviewDialog>}
  </>
}
