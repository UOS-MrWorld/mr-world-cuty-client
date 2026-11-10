import { useEffect, useState, type FormEvent, type KeyboardEvent } from 'react'
import { getBookings, getTravelHistory } from '../api/booking'
import { getMyInfo, updateMyInfo } from '../api/member'
import { AppLink } from '../components/AppLink'
import { Icon } from '../components/Icon'
import { TourCard } from '../components/TourCard'
import { formatPrice } from '../data/travel'
import { gradeLabels } from '../data/configuration'
import { useAuth } from '../hooks/useAuth'
import { navigate, useRoute } from '../hooks/useRoute'
import type { Tour, TravelDraft } from '../types/travel'
import type { BookingSummaryResponse, TravelHistoryResponse } from '../types/bookingApi'
import type { MemberInfoResponse } from '../types/memberApi'

type MyTripsTab = 'drafts' | 'bookings' | 'history' | 'profile'
const tabLabels: Record<MyTripsTab, string> = { drafts: '장바구니', bookings: '신청한 여행', history: '이전 여행', profile: '개인정보' }
const tabIds = Object.keys(tabLabels) as MyTripsTab[]
const bookingStatusLabels = { PENDING: '결제 전', PAID: '결제 완료', CANCELLED: '예약 취소' }
const tourStatusLabels = { RECRUITING: '예약한 여행 · 모집 중', CONFIRMED: '예약한 여행 · 출발 확정', COMPLETED: '완료한 여행', CANCELLED: '취소된 여행' }
const apiTourLevelLabels = { CLASSIC: '클래식', GRAND: '그랜드', PREMIUM: '프리미엄' }

function ApiTripsPanel({ tab }: { tab: 'bookings' | 'history' }) {
  const [bookings, setBookings] = useState<BookingSummaryResponse[]>([])
  const [history, setHistory] = useState<TravelHistoryResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setErrorMessage('')
    const request = tab === 'bookings'
      ? getBookings({ page: 0, size: 100 }).then(response => {
        if (active) setBookings(response.data.content)
      })
      : getTravelHistory({ page: 0, size: 100 }).then(response => {
        if (active) setHistory(response.data.content)
      })
    void request.catch(error => {
      if (active) setErrorMessage(error instanceof Error ? error.message : '여행 내역을 불러오지 못했습니다.')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [tab])

  const records = tab === 'bookings' ? bookings : history
  if (loading) return <p className="notice" role="status">{tab === 'bookings' ? '예약 목록' : '여행 내역'}을 불러오는 중입니다.</p>
  if (errorMessage) return <div className="empty-state"><Icon name="compass" size={36} /><h2>내역을 불러오지 못했어요.</h2><p>{errorMessage}</p><button className="button secondary" type="button" onClick={() => window.location.reload()}>다시 시도</button></div>
  if (!records.length) return <div className="empty-state"><Icon name="compass" size={36} /><h2>{tab === 'bookings' ? '신청한 여행이 없어요.' : '아직 여행 이력이 없어요.'}</h2><p>여행을 선택하고 예약하면 이곳에서 상태를 확인할 수 있어요.</p><AppLink className="button primary" href="/tours">여행 둘러보기 <Icon name="arrow" size={17} /></AppLink></div>

  return <div className="draft-list">{tab === 'bookings'
    ? bookings.map(booking => <article className="surface-card" key={booking.bookingId}><div><span className="status-pill">{bookingStatusLabels[booking.bookingStatus]}</span><h2>{booking.tourName}</h2><p className="muted">출발일 {booking.startDate}</p><strong>예약 금액 {formatPrice(booking.totalPrice)}원</strong><p className="summary-note">할인율 {booking.discountRate}% · 예약번호 {booking.bookingId}</p></div><AppLink className="button secondary" href={`/tours/${booking.tourId}/preview?booking=${booking.bookingId}`}>예약 상세 <Icon name="arrow" size={17} /></AppLink></article>)
    : history.map(item => <article className="surface-card trip-history-card" key={item.bookingId}><img className="history-thumbnail" src="/background.webp" alt="잔잔한 물결의 여행 기본 이미지" /><div><span className="status-pill">{tourStatusLabels[item.tourStatus]}</span><h2>{item.tourName}</h2><p className="muted">{item.startDate} ~ {item.endDate} · {apiTourLevelLabels[item.tourLevel]}</p><strong>결제 금액 {formatPrice(item.paidAmount)}원</strong><p className="summary-note">예약번호 {item.bookingId}</p></div></article>)}</div>
}

function ApiProfilePanel() {
  const [profile, setProfile] = useState<MemberInfoResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let active = true
    void getMyInfo().then(response => {
      if (active) setProfile(response.data)
    }).catch(error => {
      if (active) setErrorMessage(error instanceof Error ? error.message : '회원정보를 불러오지 못했습니다.')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!profile || !event.currentTarget.reportValidity()) return
    setSaving(true)
    setMessage('')
    setErrorMessage('')
    try {
      const { data } = await updateMyInfo({ phoneNum: profile.phoneNum.replace(/\D/g, ''), address: profile.address.trim() })
      setProfile(current => current ? { ...current, phoneNum: data.phoneNum, address: data.address } : current)
      setMessage('회원정보를 수정했습니다.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '회원정보를 수정하지 못했습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="notice" role="status">회원정보를 불러오는 중입니다.</p>
  if (!profile) return <div className="empty-state"><h2>회원정보를 불러오지 못했어요.</h2><p>{errorMessage}</p></div>

  return <div className="profile-layout"><section className="surface-card">
    <h2>나의 정보</h2><p className="muted">성명과 로그인 아이디는 조회만 가능하며, 연락처와 주소를 수정할 수 있어요.</p>
    <form className="profile-form" onSubmit={submit}>
      <label className="field" htmlFor="api-profile-account">로그인 아이디<input id="api-profile-account" value={profile.loginId} readOnly /></label>
      <label className="field" htmlFor="api-profile-name">성명<input id="api-profile-name" value={profile.name} readOnly /></label>
      <label className="field" htmlFor="api-profile-contact">연락처<input id="api-profile-contact" type="tel" required pattern="[0-9]{10,11}" autoComplete="tel" value={profile.phoneNum} onChange={event => setProfile({ ...profile, phoneNum: event.target.value.replace(/\D/g, '') })} /><small>하이픈 없이 숫자 10~11자리</small></label>
      <label className="field" htmlFor="api-profile-address">주소<input id="api-profile-address" required maxLength={255} autoComplete="street-address" value={profile.address} onChange={event => setProfile({ ...profile, address: event.target.value })} /></label>
      <button className="button primary" type="submit" disabled={saving}>{saving ? '저장 중…' : '회원정보 저장'} {!saving && <Icon name="check" size={17} />}</button>
    </form>
    {message && <p className="notice" role="status">{message}</p>}
    {errorMessage && <p className="notice notice-error" role="alert">{errorMessage}</p>}
  </section></div>
}

interface SavedDraftEntry {
  tour: Tour
  draft: TravelDraft
}

export function MyTripsPage({ draftEntries, savedToursLoading, savedToursError, onRetrySavedTours }: {
  draftEntries: SavedDraftEntry[]
  savedToursLoading: boolean
  savedToursError: string
  onRetrySavedTours: () => void
}) {
  const route = useRoute()
  const { session: authSession } = useAuth()
  const requested = new URLSearchParams(route.split('?')[1]).get('tab') as MyTripsTab | null
  const tab: MyTripsTab = requested && tabIds.includes(requested) ? requested : 'drafts'
  const counts: Record<MyTripsTab, number | undefined> = { drafts: draftEntries.length, bookings: undefined, history: undefined, profile: undefined }
  function switchTab(next: MyTripsTab) { navigate(`/my-trips?tab=${next}`) }
  function tabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === 'ArrowRight' ? (index + 1) % tabIds.length : event.key === 'ArrowLeft' ? (index + tabIds.length - 1) % tabIds.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabIds.length - 1 : -1
    if (next < 0) return
    event.preventDefault()
    switchTab(tabIds[next])
    document.getElementById(`my-trips-tab-${tabIds[next]}`)?.focus()
  }
  return <>
    <div className="page-heading"><p className="eyebrow">여행 관리</p><h1>나의 여행을 한눈에.</h1><p>고르고 있는 여행부터 신청한 여행, 지난 여행까지 확인하세요.</p></div>
    <div className="collection-tabs my-trips-tabs" role="tablist" aria-label="내 여행 분류">{tabIds.map((id, index) => <button id={`my-trips-tab-${id}`} role="tab" type="button" aria-selected={tab === id} aria-controls={`my-trips-panel-${id}`} tabIndex={tab === id ? 0 : -1} key={id} onClick={() => switchTab(id)} onKeyDown={event => tabKeyDown(event, index)}>{tabLabels[id]}{counts[id] !== undefined && <b>{counts[id]}</b>}</button>)}</div>
    <div role="tabpanel" id={`my-trips-panel-${tab}`} aria-labelledby={`my-trips-tab-${tab}`} className="my-trips-panel" tabIndex={0}>
      {tab === 'drafts' && <>
        {savedToursLoading && <p className="notice" role="status">담은 상품을 불러오는 중입니다.</p>}
        {savedToursError && <p className="notice notice-error" role="alert">{savedToursError} <button className="text-link" type="button" onClick={onRetrySavedTours}>다시 시도</button></p>}
        {draftEntries.length ? <div className="draft-list">{draftEntries.map(({ tour, draft }) =>
          <article className="draft-card surface-card" key={tour.id}><img src={tour.image} alt={tour.imageAlt} /><div><span className="status-pill">구성 중</span><h2>{tour.title}</h2><p className="muted">{draft.date || '출발일 미선택'} · {tour.duration} · {draft.travelers}명 · {gradeLabels[draft.grade]}</p><strong>최신 금액은 구성 화면에서 확인해 주세요.</strong></div><AppLink className="button secondary" href={`/tours/${tour.id}/configure`}>이어서 구성 <Icon name="arrow" size={17} /></AppLink></article>
        )}</div> : !savedToursLoading && <div className="empty-state"><Icon name="cart" size={36} /><h2>장바구니가 비어 있어요.</h2><p>상품을 고르고 일정·등급·옵션을 담아 보세요.</p><AppLink className="button primary" href="/tours">여행 둘러보기 <Icon name="arrow" size={17} /></AppLink></div>}
      </>}
      {authSession?.role === 'CUSTOMER' && (tab === 'bookings' || tab === 'history') && <ApiTripsPanel tab={tab} />}
      {authSession?.role === 'CUSTOMER' && tab === 'profile' && <ApiProfilePanel />}
      {tab !== 'drafts' && authSession?.role !== 'CUSTOMER' && <div className="empty-state"><Icon name="compass" size={36} /><h2>고객 계정으로 확인해 주세요.</h2><p>고객 계정으로 로그인하면 예약과 여행 이력을 확인할 수 있어요.</p><AppLink className="button primary" href={`/login?next=${encodeURIComponent(route)}`}>로그인 화면으로 <Icon name="arrow" size={17} /></AppLink></div>}
    </div>
  </>
}

export function CartPage({ cartIds, onCartToggle, availableTours, savedToursLoading, savedToursError, onRetrySavedTours }: {
  cartIds: string[]
  onCartToggle: (id: string) => void
  availableTours: Tour[]
  savedToursLoading: boolean
  savedToursError: string
  onRetrySavedTours: () => void
}) {
  const cartItems = availableTours.filter(tour => cartIds.includes(tour.id))
  return <>
    <div className="page-heading"><p className="eyebrow">여행 관리</p><h1>장바구니</h1><p>담은 여행을 확인하고 상품 구성으로 이어가세요.</p></div>
    {savedToursLoading && <p className="notice" role="status">담은 상품을 불러오는 중입니다.</p>}
    {savedToursError && <p className="notice notice-error" role="alert">{savedToursError} <button className="text-link" type="button" onClick={onRetrySavedTours}>다시 시도</button></p>}
    {cartItems.length ? <div className="product-list">{cartItems.map(tour => <TourCard key={tour.id} tour={tour} onRemove={() => onCartToggle(tour.id)} />)}</div> : !savedToursLoading && <div className="empty-state"><Icon name="cart" size={36} /><h2>장바구니가 비어 있어요.</h2><p>여행 구성을 마친 뒤 장바구니에 담아 주세요.</p><AppLink className="button primary" href="/tours">여행 둘러보기 <Icon name="arrow" size={17} /></AppLink></div>}
  </>
}
