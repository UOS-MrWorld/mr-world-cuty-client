import { useEffect, useRef, useState, type FormEvent } from 'react'
import { createBooking } from '../api/booking'
import { createPayment } from '../api/payment'
import { getTourQuote } from '../api/tour'
import { AppLink } from '../components/AppLink'
import { Icon } from '../components/Icon'
import { TripSummary } from '../components/TripSummary'
import { getEstimate, getToday } from '../data/configuration'
import { demoContactPattern, getRecruitmentDeadline, paymentMethodLabels } from '../data/demoBookings'
import { formatPrice } from '../data/travel'
import { toBookingRequest, toQuoteRequest } from '../data/bookingApiAdapter'
import { useDemoSession } from '../hooks/useDemoSession'
import { useAuth } from '../hooks/useAuth'
import { navigate } from '../hooks/useRoute'
import type { DemoPaymentMethod, DemoPerson } from '../types/demo'
import type { Tour, TravelDraft } from '../types/travel'
import type { BookingResponse } from '../types/bookingApi'
import type { PaymentResponse } from '../types/paymentApi'
import type { QuoteResponse } from '../types/tourApi'

const emptyPerson: DemoPerson = { name: '', address: '', contact: '' }

function PersonFields({ person, prefix, onChange }: {
  person: DemoPerson
  prefix: string
  onChange: (person: DemoPerson) => void
}) {
  return <div className="person-fields">
    <label className="field" htmlFor={`${prefix}-name`}>성명 <span className="required-mark">필수</span><input id={`${prefix}-name`} required maxLength={40} autoComplete="off" value={person.name} onChange={event => onChange({ ...person, name: event.target.value })} /></label>
    <label className="field" htmlFor={`${prefix}-contact`}>연락처 <span className="required-mark">필수</span><input id={`${prefix}-contact`} type="tel" required autoComplete="off" pattern={demoContactPattern} placeholder="010-0000-0000" value={person.contact} onChange={event => onChange({ ...person, contact: event.target.value })} /><small>휴대전화번호 또는 지역번호를 포함해 입력해 주세요.</small></label>
    <label className="field person-address" htmlFor={`${prefix}-address`}>주소 <span className="required-mark">필수</span><input id={`${prefix}-address`} required maxLength={160} autoComplete="off" value={person.address} onChange={event => onChange({ ...person, address: event.target.value })} /></label>
  </div>
}

function ApiCheckout({ tour, draft }: { tour: Tour; draft: TravelDraft }) {
  const [quote, setQuote] = useState<QuoteResponse | null>(null)
  const [booking, setBooking] = useState<BookingResponse | null>(null)
  const [payment, setPayment] = useState<PaymentResponse | null>(null)
  const [cardNumber, setCardNumber] = useState('')
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

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

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (processing || !quote || !event.currentTarget.reportValidity()) return
    setProcessing(true)
    setErrorMessage('')
    try {
      const { data } = await createBooking(toBookingRequest(tour, draft))
      setBooking(data)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '예약을 생성하지 못했습니다.')
    } finally {
      setProcessing(false)
    }
  }

  async function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (processing || !booking || !event.currentTarget.reportValidity()) return
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
        setErrorMessage('Mock 결제가 거절되었습니다. 예약은 PENDING 상태로 유지되며 카드번호를 바꿔 다시 시도할 수 있습니다.')
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Mock 결제를 처리하지 못했습니다.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return <p className="notice" role="status">서버에서 결제 예정 금액을 확인하는 중입니다.</p>
  if (!quote) return <div className="empty-state"><Icon name="compass" size={36} /><h1>신청 내용을 확인하지 못했어요.</h1><p>{errorMessage}</p><AppLink className="button secondary" href={`/tours/${tour.id}/configure${window.location.search}`}>구성으로 돌아가기</AppLink></div>

  return <>
    <div className="page-heading"><p className="eyebrow">신청·결제</p><h1>{booking ? 'PENDING 예약이 생성됐어요.' : '선택한 구성으로 예약할까요?'}</h1><p>{booking ? 'Mock 카드번호를 입력해 결제 결과를 확인하세요.' : '서버가 계산한 금액과 출발·취소 조건을 확인해 주세요.'}</p></div>
    <div className="flow-layout">
      <div className="flow-main checkout-fields">
        {!booking ? <form className="surface-card" onSubmit={submitBooking}>
          <h2 className="section-title">예약 생성</h2>
          <dl className="detail-facts"><div><dt>예약 상태</dt><dd>PENDING으로 생성</dd></div><div><dt>할인율</dt><dd>{quote.discountRate}%</dd></div><div><dt>결제 예정 금액</dt><dd>{formatPrice(quote.expectedPaymentAmount)}원</dd></div></dl>
          <label className="checkout-agreement"><input type="checkbox" required /><span>선택 구성과 서버 계산 금액을 확인했습니다.</span></label>
          {errorMessage && <p className="notice notice-error" role="alert">{errorMessage}</p>}
          <div className="action-row"><AppLink className="button secondary" href={`/tours/${tour.id}/configure${window.location.search}`}>구성 수정하기</AppLink><button className="button primary" type="submit" disabled={processing}>{processing ? '예약 생성 중…' : 'PENDING 예약 생성'}</button></div>
        </form> : <form className="surface-card" onSubmit={submitPayment}>
          <h2 className="section-title">Mock 카드 결제</h2>
          <dl className="detail-facts"><div><dt>예약번호</dt><dd>{booking.bookingId}</dd></div><div><dt>예약 상태</dt><dd>{booking.bookingStatus}</dd></div><div><dt>결제 예정 금액</dt><dd>{formatPrice(booking.expectedPaymentAmount)}원</dd></div></dl>
          <label className="field" htmlFor="api-card-number">Mock 카드번호 <span className="required-mark">필수</span><input id="api-card-number" required autoComplete="off" value={cardNumber} onChange={event => setCardNumber(event.target.value)} placeholder="승인: 1 / 거절: 그 외 값" /><small>실제 카드번호를 입력하지 마세요. 서버 Mock 결제는 숫자 1만 승인합니다.</small></label>
          {payment && <p className={`notice${payment.paymentStatus === 'FAILED' ? ' notice-error' : ''}`} role="status">최근 결제 결과: {payment.paymentStatus} · {formatPrice(payment.amount)}원</p>}
          {errorMessage && <p className="notice notice-error" role="alert">{errorMessage}</p>}
          <div className="action-row"><AppLink className="button secondary" href={`/my-trips?tab=bookings`}>내 예약 보기</AppLink><button className="button primary" type="submit" disabled={processing}>{processing ? '결제 처리 중…' : 'Mock 결제 요청'} <Icon name="arrow" size={18} /></button></div>
        </form>}
        <section className="surface-card"><h2 className="section-title">출발·취소 조건</h2><dl className="detail-facts"><div><dt>모집 마감</dt><dd>{getRecruitmentDeadline(draft.date)} · 출발 7일 전</dd></div><div><dt>출발 확정 기준</dt><dd>전체 결제 인원 3명 이상</dd></div><div><dt>재고 부족</dt><dd>예약·결제를 차단하지 않음</dd></div></dl></section>
      </div>
      <TripSummary tour={tour} draft={draft} quote={quote} />
    </div>
  </>
}

export function CheckoutPage({ tour, draft, onPreview }: { tour: Tour; draft: TravelDraft; onPreview: () => void }) {
  const { session: authSession } = useAuth()
  const { session: demoSession, createDemoBooking } = useDemoSession()
  const [applicant, setApplicant] = useState<DemoPerson>(() => demoSession?.profile ?? { ...emptyPerson })
  const [companions, setCompanions] = useState<DemoPerson[]>(() => Array.from({ length: draft.travelers - 1 }, () => ({ ...emptyPerson })))
  const [method, setMethod] = useState<DemoPaymentMethod>('card')
  const [resultCase, setResultCase] = useState<'success' | 'failure'>('success')
  const [processing, setProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const busy = useRef(false)
  const estimate = getEstimate(tour, draft)
  const deadline = getRecruitmentDeadline(draft.date)
  const recruitmentClosed = getToday() >= deadline
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  function fillDemoPeople() {
    setApplicant({ name: '시연 고객', address: '시연용 주소 · 실제 주소 아님', contact: '010-0000-0000' })
    setCompanions(Array.from({ length: draft.travelers - 1 }, (_, index) => ({ name: `시연 동행자 ${index + 1}`, address: '시연용 주소 · 실제 주소 아님', contact: '010-0000-0000' })))
  }

  function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy.current || recruitmentClosed || !event.currentTarget.reportValidity()) return
    busy.current = true
    setProcessing(true)
    setPaymentError('')
    timer.current = setTimeout(() => {
      timer.current = null
      busy.current = false
      setProcessing(false)
      if (resultCase === 'failure') {
        setPaymentError('시연 결제가 실패했습니다. 입력 내용은 유지됩니다. 결과를 ‘성공’으로 바꾸고 다시 시도해 주세요.')
        return
      }
      try {
        const booking = createDemoBooking({ tour, draft, applicant, companions, paymentMethod: method })
        const search = new URLSearchParams(window.location.search)
        search.set('booking', booking.id)
        navigate(`/tours/${tour.id}/preview?${search}`)
      } catch (error) {
        setPaymentError(error instanceof Error ? error.message : '시연 결제를 진행하지 못했습니다. 다시 확인해 주세요.')
      }
    }, 1300)
  }

  if (authSession?.role === 'CUSTOMER' && demoSession?.role !== 'customer' && tour.source === 'api') return <ApiCheckout tour={tour} draft={draft} />

  if (demoSession?.role !== 'customer') return <>
    <div className="page-heading"><p className="eyebrow">신청·결제</p><h1>신청을 이어가려면 로그인해 주세요.</h1><p>선택한 일정과 구성은 그대로 유지돼요.</p></div>
    <div className="flow-layout"><section className="surface-card flow-main">
      <h2>고객 계정으로 신청해 주세요.</h2>
      <p className="muted">실제 로그인 연결 전에는 고객 시연 모드로 신청·결제 화면을 체험할 수 있어요.</p>
      {(authSession?.role === 'STAFF' || demoSession?.role === 'staff') && <p className="notice">직원 계정에서는 고객 신청을 진행할 수 없습니다.</p>}
      <div className="action-row"><AppLink className="button primary" href={`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`}>로그인 화면으로 <Icon name="arrow" size={18} /></AppLink><button className="button secondary" type="button" onClick={onPreview}>선택 구성 미리보기</button></div>
    </section><TripSummary tour={tour} draft={draft} /></div>
  </>

  return <>
    <div className="page-heading"><p className="eyebrow">신청·결제</p><h1>여행 신청을 마무리해요.</h1><p>신청자와 모든 동행자의 정보, 선택한 여행과 결제 금액을 확인해 주세요.</p></div>
    <div className="notice demo-notice"><span className="demo-badge">DEMO</span><strong>실제 결제는 진행되지 않습니다.</strong></div>
    <form className="flow-layout" onSubmit={submitPayment} aria-busy={processing} onInvalidCapture={event => {
      const field = event.target
      if (field instanceof HTMLInputElement) field.closest('details')?.setAttribute('open', '')
    }}>
      <fieldset className="flow-main checkout-fields" disabled={processing}>
        <section className="surface-card" aria-labelledby="applicant-heading">
          <div className="section-heading-row"><h2 className="section-title" id="applicant-heading">신청자 정보</h2><button className="text-link" type="button" onClick={fillDemoPeople}>시연 정보 채우기</button></div>
          <PersonFields person={applicant} prefix="applicant" onChange={setApplicant} />
        </section>
        {draft.travelers > 1 && <section className="surface-card" aria-labelledby="companions-heading">
          <h2 className="section-title" id="companions-heading">동행자 정보 <span className="muted">{draft.travelers - 1}명</span></h2>
          {Array.from({ length: draft.travelers - 1 }, (_, index) => <details className="companion-block" key={index} open>
            <summary>동행자 {index + 1}{tour.theme === 'romance' ? ` · ${Math.floor((index + 1) / 2) + 1}번째 커플` : ''}</summary>
            <PersonFields person={companions[index] ?? emptyPerson} prefix={`companion-${index}`} onChange={person => setCompanions(previous => Array.from({ length: draft.travelers - 1 }, (_, position) => position === index ? person : previous[position] ?? { ...emptyPerson }))} />
          </details>)}
        </section>}
        <section className="surface-card" aria-labelledby="payment-heading">
          <h2 className="section-title" id="payment-heading">결제 방법</h2>
          <div className="payment-methods">{(Object.keys(paymentMethodLabels) as DemoPaymentMethod[]).map(value => <label key={value} className={`payment-method ${method === value ? 'selected' : ''}`}><input type="radio" name="paymentMethod" value={value} checked={method === value} onChange={() => setMethod(value)} /><strong>{paymentMethodLabels[value]}</strong><small>시연</small></label>)}</div>
          <label className="field" htmlFor="demo-payment-input">테스트 입력값 <span className="required-mark">필수</span><input id="demo-payment-input" required maxLength={40} autoComplete="off" placeholder="예: DEMO" /><small>실제 카드 정보를 입력하지 마세요.</small></label>
          <label className="field" htmlFor="demo-payment-case">결제 시연 결과<select id="demo-payment-case" value={resultCase} onChange={event => setResultCase(event.target.value as 'success' | 'failure')}><option value="success">성공 흐름 확인</option><option value="failure">실패·재시도 흐름 확인</option></select></label>
        </section>
        <section className="surface-card" aria-labelledby="checkout-policy-heading">
          <h2 className="section-title" id="checkout-policy-heading">출발·취소 조건</h2>
          <dl className="detail-facts"><div><dt>모집 마감</dt><dd>{deadline} · 출발 7일 전</dd></div><div><dt>출발 확정 기준</dt><dd>전체 결제 인원 3명 이상</dd></div><div><dt>취소·환불</dt><dd>마감 전까지 가능</dd></div></dl>
          <p className="summary-note">마감 시 최소 인원 미달이면 출발이 취소됩니다.</p>
          <label className="checkout-agreement"><input type="checkbox" required /><span>여행 구성·금액과 출발·취소 조건을 확인했습니다.</span></label>
          {recruitmentClosed && <p className="field-error" role="alert">모집 마감일이 지난 일정입니다. 구성 화면에서 출발일을 변경해 주세요.</p>}
        </section>
        {paymentError && <p className="notice notice-error" role="alert">{paymentError}</p>}
        <div className="action-row checkout-submit"><AppLink className="button secondary" aria-disabled={processing || undefined} tabIndex={processing ? -1 : undefined} href={`/tours/${tour.id}/configure${window.location.search}`} onClick={event => { if (processing) event.preventDefault() }}>구성 수정하기</AppLink><button className="button primary" type="submit" disabled={processing || recruitmentClosed}>{processing ? '시연 결제 처리 중…' : `${formatPrice(estimate.total)}원 결제 시연`} {!processing && <Icon name="arrow" size={18} />}</button></div>
        <p className="summary-note" role={processing ? 'status' : undefined}>{processing ? '처리 중에는 같은 신청을 다시 전송할 수 없습니다.' : '결제 완료와 출발 확정은 별도 상태로 안내돼요.'}</p>
      </fieldset>
      <TripSummary tour={tour} draft={draft} />
    </form>
  </>
}
