import { useEffect, useState } from 'react'
import { cancelBooking, getBooking } from '../api/booking'
import { AppLink } from '../components/AppLink'
import { Icon } from '../components/Icon'
import { PreviewDialog } from '../components/PreviewDialog'
import { formatPrice } from '../data/travel'
import type { BookingDetailResponse } from '../types/bookingApi'
import type { Tour, TravelDraft } from '../types/travel'

const bookingStatusLabels = { PENDING: '결제 전', PAID: '결제 완료', CANCELLED: '예약 취소' }
const paymentStatusLabels = { SUCCESS: '결제 성공', FAILED: '결제 실패', REFUNDED: '환불 완료' }
const levelLabels = { CLASSIC: '클래식', GRAND: '그랜드', PREMIUM: '프리미엄' }
const hotelLabels = { THREE_STAR: '3등급 호텔', FOUR_STAR: '4등급 호텔', FIVE_STAR: '5등급 호텔' }
const mealLabels = { LUNCH_BOX: '도시락', LOCAL_RESTAURANT: '현지식 레스토랑', FINE_DINING: '파인다이닝' }
const transportLabels = { PREMIUM_CAR_2: '2인 전용 고급차량', PREMIUM_VAN_10: '10인승 고급차량' }
const tourStatusLabels = { RECRUITING: '모집 중', CONFIRMED: '출발 확정', COMPLETED: '여행 완료', CANCELLED: '투어 취소' }

export function BookingPreviewPage({ tour }: { tour: Tour; draft: TravelDraft }) {
  const bookingValue = new URLSearchParams(window.location.search).get('booking')
  const bookingId = bookingValue && /^\d+$/.test(bookingValue) ? Number(bookingValue) : null
  const [booking, setBooking] = useState<BookingDetailResponse | null>(null)
  const [loading, setLoading] = useState(Boolean(bookingId))
  const [cancelling, setCancelling] = useState(false)
  const [errorMessage, setErrorMessage] = useState(bookingId ? '' : '예약번호가 올바르지 않습니다.')
  const [notice, setNotice] = useState('')
  const [cancelOpen, setCancelOpen] = useState(false)

  useEffect(() => {
    if (!bookingId) return
    let active = true
    setLoading(true)
    void getBooking(bookingId).then(response => {
      if (!active) return
      if (response.data.tour.tourId !== Number(tour.id)) throw new Error('이 상품의 예약이 아닙니다.')
      setBooking(response.data)
    }).catch(error => {
      if (active) setErrorMessage(error instanceof Error ? error.message : '예약 상세를 불러오지 못했습니다.')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [bookingId, tour.id])

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

  if (loading) return <p className="notice" role="status">예약 상세를 불러오는 중입니다.</p>
  if (!booking) return <div className="empty-state"><Icon name="compass" size={36} /><h1>예약 상세를 불러오지 못했어요.</h1><p>{errorMessage}</p><AppLink className="button secondary" href="/my-trips?tab=bookings">예약 목록으로</AppLink></div>

  return <>
    <div className="page-heading"><p className="eyebrow">예약 상세</p><h1>{booking.tour.tourName}</h1><p>예약·결제·출발 상태를 확인하세요.</p></div>
    {notice && <p className="notice" role="status">{notice}</p>}
    {errorMessage && <p className="notice notice-error" role="alert">{errorMessage}</p>}
    <div className="flow-layout"><div className="flow-main">
      <section className="surface-card"><h2 className="section-title">예약 상태</h2><div className="status-grid"><div className={`status-card${booking.bookingStatus === 'PAID' ? ' status-complete' : ''}`}><p className="status-label">예약</p><h3>{bookingStatusLabels[booking.bookingStatus]}</h3><p className="muted">예약번호 {booking.bookingId}</p></div><div className={`status-card${booking.paymentStatus === 'SUCCESS' ? ' status-complete' : ''}`}><p className="status-label">결제</p><h3>{booking.paymentStatus ? paymentStatusLabels[booking.paymentStatus] : '결제 기록 없음'}</h3><p className="muted">할인 전 {formatPrice(booking.totalPrice)}원 · 할인율 {booking.discountRate}%</p></div></div></section>
      <section className="surface-card"><h2 className="section-title">선택 구성</h2><dl className="detail-facts"><div><dt>출발일</dt><dd>{booking.tour.startDate}</dd></div><div><dt>총 여행 인원</dt><dd>{booking.guestCount}명</dd></div><div><dt>등급</dt><dd>{levelLabels[booking.tourLevel]}</dd></div><div><dt>호텔</dt><dd>{hotelLabels[booking.hotelGrade]}</dd></div><div><dt>식사</dt><dd>{mealLabels[booking.mealType]}</dd></div><div><dt>교통</dt><dd>{transportLabels[booking.transport]}</dd></div><div><dt>음료</dt><dd>{booking.drinkOptions.length ? booking.drinkOptions.map(option => `${option.drinkName} ${option.quantity}개`).join(' · ') : '선택 없음'}</dd></div></dl></section>
      <section className="surface-card"><h2 className="section-title">취소·환불</h2><p>출발 7일 전 마감까지 취소할 수 있으며, 결제 완료 예약은 자동 환불됩니다.</p><button className="button secondary" type="button" disabled={cancelling || booking.bookingStatus === 'CANCELLED'} onClick={() => setCancelOpen(true)}>{booking.bookingStatus === 'CANCELLED' ? '취소된 예약' : cancelling ? '취소 처리 중…' : '예약 취소'}</button></section>
      <div className="action-row">{booking.bookingStatus === 'PENDING' && <AppLink className="button primary" href={`/tours/${tour.id}/checkout?booking=${booking.bookingId}`}>결제 계속하기</AppLink>}<AppLink className={booking.bookingStatus === 'PENDING' ? 'button secondary' : 'button primary'} href="/my-trips?tab=bookings">내 예약 목록</AppLink><AppLink className="button secondary" href="/tours">다른 여행 보기</AppLink></div>
    </div><aside className="flow-summary surface-card"><p className="eyebrow">선택 상품</p><img src={tour.image} alt={tour.imageAlt} /><h2>{booking.tour.tourName}</h2><dl className="summary-details"><div><dt>투어 상태</dt><dd>{tourStatusLabels[booking.tour.tourStatus]}</dd></div><div><dt>여행 기간</dt><dd>{booking.tour.startDate} ~ {booking.tour.endDate}</dd></div><div><dt>예약 금액</dt><dd>{formatPrice(booking.totalPrice)}원</dd></div></dl></aside></div>
    {cancelOpen && <PreviewDialog title="예약을 취소할까요?" onClose={() => setCancelOpen(false)}><p>{booking.tour.tourName} · 예약번호 {booking.bookingId}</p><p>{booking.paymentStatus === 'SUCCESS' ? '취소하면 성공 결제가 자동 환불됩니다.' : '취소하면 결제 전 예약을 더 이상 결제할 수 없습니다.'}</p><div className="action-row"><button className="button secondary" type="button" onClick={() => setCancelOpen(false)}>예약 유지하기</button><button className="button primary" type="button" disabled={cancelling} onClick={() => void cancel()}>{cancelling ? '취소 처리 중…' : '예약 취소 확인'}</button></div></PreviewDialog>}
  </>
}
