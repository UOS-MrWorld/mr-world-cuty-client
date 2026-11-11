import { Fragment, useEffect, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from 'react'
import { createBooking, getBooking, updateBooking } from '../api/booking'
import { createPayment } from '../api/payment'
import { getTourQuote } from '../api/tour'
import { AppLink } from '../components/AppLink'
import { Icon } from '../components/Icon'
import { TripSummary } from '../components/TripSummary'
import { getRecruitmentDeadline } from '../data/bookingPolicy'
import { formatPrice } from '../data/travel'
import { fromBookingDetail, quoteRequestFromBooking, toBookingRequest, toQuoteRequest } from '../data/bookingApiAdapter'
import { useAuth } from '../hooks/useAuth'
import { navigate } from '../hooks/useRoute'
import type { Tour, TravelDraft } from '../types/travel'
import type { BookingResponse } from '../types/bookingApi'
import type { PaymentResponse } from '../types/paymentApi'
import type { QuoteResponse } from '../types/tourApi'

function quoteRequestKey(request: ReturnType<typeof toQuoteRequest>) {
  return JSON.stringify({
    ...request,
    drinkOptions: [...(request.drinkOptions ?? [])].sort((a, b) => a.optionId - b.optionId),
  })
}

function discountedPaymentAmount(totalPrice: number, discountRate: number) {
  return Math.floor(totalPrice * (100 - discountRate) / 100)
}

function ApiCheckout({ tour, draft, onDraftChange }: { tour: Tour; draft: TravelDraft; onDraftChange: (draft: TravelDraft) => void }) {
  const search = new URLSearchParams(window.location.search)
  const requestedBookingId = search.get('booking')
  const updatingExisting = search.get('update') === '1'
  const [quote, setQuote] = useState<QuoteResponse | null>(null)
  const [booking, setBooking] = useState<BookingResponse | null>(null)
  const [serverSelectionKey, setServerSelectionKey] = useState('')
  const [payment, setPayment] = useState<PaymentResponse | null>(null)
  const [cardNumber, setCardNumber] = useState('')
  const [cardParts, setCardParts] = useState(['', '', '', ''])
  const cardInputs = useRef<Array<HTMLInputElement | null>>([])
  const [loading, setLoading] = useState(true)
  const [restoring, setRestoring] = useState(Boolean(requestedBookingId))
  const [resumeBlocked, setResumeBlocked] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const currentRequest = toQuoteRequest(tour, draft)
  const currentSelectionKey = quoteRequestKey(currentRequest)
  const selectionChanged = Boolean(booking && serverSelectionKey && serverSelectionKey !== currentSelectionKey)
  const bookingPaymentAmount = booking
    ? discountedPaymentAmount(booking.totalPrice, booking.discountRate)
    : 0

  function updateCardPart(index: number, value: string) {
    const next = [...cardParts]
    next[index] = value.replace(/\D/g, '').slice(0, 4)
    setCardParts(next)
    setCardNumber(next.join(''))
    if (next[index].length === 4 && index < 3) cardInputs.current[index + 1]?.focus()
  }

  function cardPartKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !cardParts[index] && index > 0) cardInputs.current[index - 1]?.focus()
  }

  function pasteCardNumber(event: ClipboardEvent<HTMLInputElement>) {
    const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 16)
    if (!digits) return
    event.preventDefault()
    const next = [0, 4, 8, 12].map(start => digits.slice(start, start + 4))
    setCardParts(next)
    setCardNumber(digits)
    cardInputs.current[Math.min(3, Math.floor((digits.length - 1) / 4))]?.focus()
  }

  useEffect(() => {
    let active = true
    setLoading(true)
    setErrorMessage('')
    void getTourQuote(Number(tour.id), toQuoteRequest(tour, draft)).then(response => {
      if (active) setQuote(response.data)
    }).catch(error => {
      if (active) setErrorMessage(error instanceof Error ? error.message : '결제 예정 금액을 확인하지 못했습니다.')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [draft, tour])

  useEffect(() => {
    if (!requestedBookingId) {
      setRestoring(false)
      setResumeBlocked(false)
      return
    }
    if (!/^\d+$/.test(requestedBookingId)) {
      setErrorMessage('예약번호가 올바르지 않습니다.')
      setRestoring(false)
      setResumeBlocked(true)
      return
    }
    let active = true
    setRestoring(true)
    setResumeBlocked(false)
    void getBooking(Number(requestedBookingId)).then(response => {
      if (!active) return
      const detail = response.data
      if (String(detail.tour.tourId) !== tour.id) throw new Error('이 상품의 예약이 아닙니다.')
      if (detail.bookingStatus !== 'PENDING') throw new Error('결제 전 예약만 이 화면에서 이어갈 수 있습니다.')
      setBooking({
        bookingId: detail.bookingId,
        bookingStatus: detail.bookingStatus,
        totalPrice: detail.totalPrice,
        discountRate: detail.discountRate,
        expectedPaymentAmount: discountedPaymentAmount(detail.totalPrice, detail.discountRate),
      })
      setServerSelectionKey(quoteRequestKey(quoteRequestFromBooking(detail)))
      if (!updatingExisting) onDraftChange(fromBookingDetail(tour, detail))
    }).catch(error => {
      if (!active) return
      setResumeBlocked(true)
      setErrorMessage(error instanceof Error ? error.message : '예약을 불러오지 못했습니다.')
    }).finally(() => {
      if (active) setRestoring(false)
    })
    return () => { active = false }
  // 예약번호나 수정 진입 여부가 바뀔 때만 서버 예약을 다시 읽습니다.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedBookingId, tour, updatingExisting])

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (processing || !quote || !event.currentTarget.reportValidity()) return
    setProcessing(true)
    setErrorMessage('')
    try {
      const { data } = await createBooking(toBookingRequest(tour, draft))
      setBooking(data)
      setServerSelectionKey(currentSelectionKey)
      const params = new URLSearchParams(window.location.search)
      params.set('booking', String(data.bookingId))
      params.delete('update')
      navigate(`/tours/${tour.id}/checkout?${params}`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '예약을 생성하지 못했습니다.')
    } finally {
      setProcessing(false)
    }
  }

  async function syncBooking() {
    if (!booking || processing) return
    setProcessing(true)
    setErrorMessage('')
    try {
      const { data } = await updateBooking(booking.bookingId, currentRequest)
      setBooking(data)
      setServerSelectionKey(currentSelectionKey)
      const params = new URLSearchParams(window.location.search)
      params.set('booking', String(data.bookingId))
      params.delete('update')
      navigate(`/tours/${tour.id}/checkout?${params}`)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '예약 구성을 수정하지 못했습니다.')
    } finally {
      setProcessing(false)
    }
  }

  async function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (processing || !booking || selectionChanged || !event.currentTarget.reportValidity()) return
    setProcessing(true)
    setErrorMessage('')
    try {
      const { data } = await createPayment({ bookingId: booking.bookingId, cardNumber })
      setPayment(data)
      if (data.paymentStatus === 'SUCCESS') {
        const params = new URLSearchParams(window.location.search)
        params.set('booking', String(data.bookingId))
        navigate(`/tours/${tour.id}/preview?${params}`)
      } else {
        setErrorMessage('결제가 승인되지 않았습니다. 다시 시도해 주세요.')
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '결제를 처리하지 못했습니다.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading || restoring) return <p className="notice" role="status">예약과 결제 예정 금액을 확인하는 중입니다.</p>
  if (resumeBlocked) return <div className="empty-state"><Icon name="compass" size={36} /><h1>예약을 이어가지 못했어요.</h1><p>{errorMessage}</p><div className="action-row"><AppLink className="button secondary" href="/my-trips?tab=bookings">예약 목록으로</AppLink><AppLink className="button primary" href={`/tours/${tour.id}/configure`}>새 구성 시작</AppLink></div></div>
  if (!quote) return <div className="empty-state"><Icon name="compass" size={36} /><h1>신청 내용을 확인하지 못했어요.</h1><p>{errorMessage}</p><AppLink className="button secondary" href={`/tours/${tour.id}/configure${window.location.search}`}>구성으로 돌아가기</AppLink></div>

  return <>
    <div className="page-heading"><p className="eyebrow">신청·결제</p><h1>{booking ? '예약이 생성됐어요.' : '선택한 구성으로 예약할까요?'}</h1><p>{booking ? '결제 정보를 입력해 예약을 완료하세요.' : '결제 금액과 출발·취소 조건을 확인해 주세요.'}</p></div>
    {(payment || errorMessage) && <div className="notification-stack">
      {payment && <div className={`notice app-notification${payment.paymentStatus === 'FAILED' ? ' notice-error' : ''}`} role={payment.paymentStatus === 'FAILED' ? 'alert' : 'status'} onAnimationEnd={() => setPayment(null)}><span>최근 결제 결과: {payment.paymentStatus === 'SUCCESS' ? '승인' : payment.paymentStatus === 'FAILED' ? '거절' : '환불'} · {formatPrice(payment.amount)}원</span><button className="notification-close" type="button" aria-label="알림 닫기" onClick={() => setPayment(null)}>×</button></div>}
      {errorMessage && <div className="notice notice-error app-notification" role="alert" onAnimationEnd={() => setErrorMessage('')}><span>{errorMessage}</span><button className="notification-close" type="button" aria-label="알림 닫기" onClick={() => setErrorMessage('')}>×</button></div>}
    </div>}
    <div className="flow-layout">
      <div className="flow-main checkout-fields">
        {!booking ? <form className="surface-card" onSubmit={submitBooking}>
          <h2 className="section-title">예약 생성</h2>
          <dl className="detail-facts"><div><dt>예약 상태</dt><dd>결제 전</dd></div><div><dt>할인율</dt><dd>{quote.discountRate}%</dd></div><div><dt>결제 예정 금액</dt><dd>{formatPrice(quote.expectedPaymentAmount)}원</dd></div></dl>
          <label className="checkout-agreement"><input type="checkbox" required /><span>선택 구성과 결제 금액을 확인했습니다.</span></label>
          <div className="action-row"><AppLink className="button secondary" href={`/tours/${tour.id}/configure${window.location.search}`}>구성 수정하기</AppLink><button className="button primary" type="submit" disabled={processing}>{processing ? '예약 중…' : '예약하기'}</button></div>
        </form> : <form className="surface-card" onSubmit={submitPayment}>
          <h2 className="section-title">카드 결제</h2>
          <dl className="detail-facts"><div><dt>예약번호</dt><dd>{booking.bookingId}</dd></div><div><dt>예약 상태</dt><dd>결제 전</dd></div><div><dt>결제 예정 금액</dt><dd>{formatPrice(bookingPaymentAmount)}원</dd></div></dl>
          <div className="field"><span>카드번호</span><div className="card-number-group" role="group" aria-label="카드번호를 입력하세요">
            {cardParts.map((part, index) => <Fragment key={index}>{index > 0 && <span aria-hidden="true">-</span>}<input ref={element => { cardInputs.current[index] = element }} required={index === 0} inputMode="numeric" maxLength={4} autoComplete="off" value={part} placeholder="0000" aria-label={`카드번호 ${index + 1}번째 4자리`} onChange={event => updateCardPart(index, event.target.value)} onKeyDown={event => cardPartKeyDown(index, event)} onPaste={index === 0 ? pasteCardNumber : undefined} /></Fragment>)}
          </div></div>
          {selectionChanged && <div className="notice"><strong>저장한 구성과 예약 내용이 다릅니다.</strong><p>결제 전 현재 구성으로 예약 내용을 수정해 주세요.</p><button className="button secondary" type="button" disabled={processing} onClick={() => void syncBooking()}>{processing ? '예약 수정 중…' : '현재 구성으로 예약 수정'}</button></div>}
          <div className="action-row"><AppLink className="button secondary" href={`/tours/${tour.id}/configure${window.location.search}`}>구성 수정하기</AppLink><AppLink className="button secondary" href="/my-trips?tab=bookings">내 예약 보기</AppLink><button className="button primary" type="submit" disabled={processing || selectionChanged}>{processing ? '결제 처리 중…' : '결제하기'} <Icon name="arrow" size={18} /></button></div>
        </form>}
        <section className="surface-card"><h2 className="section-title">출발·취소 조건</h2><dl className="detail-facts"><div><dt>모집 마감</dt><dd>{getRecruitmentDeadline(draft.date)} · 출발 7일 전</dd></div><div><dt>출발 확정 기준</dt><dd>전체 결제 인원 3명 이상</dd></div><div><dt>재고 부족</dt><dd>예약·결제를 차단하지 않음</dd></div></dl></section>
      </div>
      <TripSummary tour={tour} draft={draft} quote={quote} />
    </div>
  </>
}

export function CheckoutPage({ tour, draft, onDraftChange }: { tour: Tour; draft: TravelDraft; onDraftChange: (draft: TravelDraft) => void }) {
  const { session: authSession } = useAuth()
  if (authSession?.role === 'CUSTOMER' && tour.source === 'api') return <ApiCheckout tour={tour} draft={draft} onDraftChange={onDraftChange} />
  return <div className="empty-state"><Icon name="compass" size={36} /><h1>고객 계정이 필요한 화면이에요.</h1><p>직원 계정에서는 고객 예약과 결제를 진행할 수 없습니다.</p><AppLink className="button primary" href="/tours">여행 목록으로</AppLink></div>
}
