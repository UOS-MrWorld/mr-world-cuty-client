import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { AppLink } from '../components/AppLink'
import { Icon } from '../components/Icon'
import { TourCard } from '../components/TourCard'
import { demoContactPattern, getDepartureState } from '../data/demoBookings'
import { formatPrice, tours } from '../data/travel'
import { getEstimate, getToday, gradeLabels } from '../data/configuration'
import { useDemoSession } from '../hooks/useDemoSession'
import { navigate, useRoute } from '../hooks/useRoute'
import type { DemoBooking } from '../types/demo'
import type { TravelDraft } from '../types/travel'

type MyTripsTab = 'drafts' | 'bookings' | 'history' | 'profile'
const tabLabels: Record<MyTripsTab, string> = { drafts: '저장한 구성', bookings: '신청한 여행', history: '이전 여행', profile: '개인정보' }
const tabIds = Object.keys(tabLabels) as MyTripsTab[]

function BookingCards({ records }: { records: DemoBooking[] }) {
  const { bookings } = useDemoSession()
  return <div className="draft-list">{records.map(booking => {
    const tour = tours.find(item => item.id === booking.tourId)
    const departure = tour ? getDepartureState(tour, booking.draft.date, bookings) : undefined
    return <article className="draft-card surface-card" key={booking.id}>
      <img src={booking.image} alt="" />
      <div><span className="demo-badge">DEMO</span><span className="status-pill">{booking.status === 'cancelled' ? '신청 취소 · 시연' : departure?.label}</span><h2>{booking.title}</h2><p className="muted">{booking.draft.date} · {booking.duration} · {booking.draft.travelers}명 · {gradeLabels[booking.draft.grade]}</p><strong>{booking.status === 'cancelled' ? '환불 시연 금액' : '결제 시연 금액'} {formatPrice(booking.amount)}원</strong><p className="summary-note booking-id">{booking.id}</p></div>
      <AppLink className="button secondary" href={`/tours/${booking.tourId}/preview?booking=${encodeURIComponent(booking.id)}`}>신청 상세 <Icon name="arrow" size={17} /></AppLink>
    </article>
  })}</div>
}

function ProfilePanel() {
  const { session, updateProfile } = useDemoSession()
  const [profile, setProfile] = useState(() => session!.profile)
  const [message, setMessage] = useState('')
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!event.currentTarget.reportValidity()) return
    updateProfile(profile)
    setMessage('시연 프로필에 반영했습니다. 다음 신청자의 기본 정보로 사용돼요. 서버에는 저장되지 않습니다.')
  }
  return <div className="profile-layout"><section className="surface-card">
    <h2>나의 정보</h2><p className="muted">현재 시연 메모리에서만 수정할 수 있어요. 실제 개인정보를 입력하지 마세요.</p>
    <form className="profile-form" onSubmit={submit}>
      <label className="field" htmlFor="profile-account">계정<input id="profile-account" value={profile.account} readOnly /></label>
      <label className="field" htmlFor="profile-name">성명<input id="profile-name" required maxLength={40} autoComplete="off" value={profile.name} onChange={event => setProfile({ ...profile, name: event.target.value })} /></label>
      <label className="field" htmlFor="profile-contact">연락처<input id="profile-contact" type="tel" required pattern={demoContactPattern} autoComplete="off" value={profile.contact} onChange={event => setProfile({ ...profile, contact: event.target.value })} /></label>
      <label className="field" htmlFor="profile-address">주소<input id="profile-address" required maxLength={160} autoComplete="off" value={profile.address} onChange={event => setProfile({ ...profile, address: event.target.value })} /></label>
      <button className="button primary" type="submit">시연 프로필 반영 <Icon name="check" size={17} /></button>
    </form>{message && <p className="notice" role="status">{message}</p>}
  </section></div>
}

export function MyTripsPage({ drafts }: { drafts: TravelDraft[] }) {
  const route = useRoute()
  const { session, bookings } = useDemoSession()
  const requested = new URLSearchParams(route.split('?')[1]).get('tab') as MyTripsTab | null
  const tab: MyTripsTab = requested && tabIds.includes(requested) ? requested : 'drafts'
  const currentBookings = bookings.filter(booking => booking.draft.date >= getToday())
  // 이전 여행의 범위는 완료 건뿐 아니라 신청·결제 건까지 포함합니다.
  const previousBookings = bookings
  const counts = { drafts: drafts.length, bookings: currentBookings.length, history: previousBookings.length, profile: undefined }
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
        <p className="notice">저장한 구성은 이 브라우저에 보관됩니다.</p>
        {drafts.length ? <div className="draft-list">{drafts.map(draft => {
          const tour = tours.find(item => item.id === draft.tourId)
          if (!tour) return null
          return <article className="draft-card surface-card" key={tour.id}><img src={tour.image} alt={tour.imageAlt} /><div><span className="status-pill">구성 중</span><h2>{tour.title}</h2><p className="muted">{draft.date || '출발일 미선택'} · {tour.duration} · {draft.travelers}명 · {gradeLabels[draft.grade]}</p><strong>예상 합계 {formatPrice(getEstimate(tour, draft).total)}원</strong></div><AppLink className="button secondary" href={`/tours/${tour.id}/configure`}>이어서 구성 <Icon name="arrow" size={17} /></AppLink></article>
        })}</div> : <div className="empty-state"><Icon name="compass" size={36} /><h2>저장한 여행이 없어요.</h2><p>상품을 고르고 일정·등급·옵션을 저장해 보세요.</p><AppLink className="button primary" href="/tours">여행 둘러보기 <Icon name="arrow" size={17} /></AppLink></div>}
      </>}
      {tab !== 'drafts' && session?.role !== 'customer' && <div className="empty-state"><Icon name="compass" size={36} /><h2>고객 계정으로 확인해 주세요.</h2><p>실제 로그인 연결 전에는 고객 시연 모드로 내 여행을 체험할 수 있어요.</p><AppLink className="button primary" href={`/login?next=${encodeURIComponent(route)}`}>로그인 화면으로 <Icon name="arrow" size={17} /></AppLink></div>}
      {session?.role === 'customer' && (tab === 'bookings' || tab === 'history') && <>
        <p className="notice demo-notice"><span className="demo-badge">DEMO</span><span>현재 시연 내역만 표시됩니다.</span></p>
        {(tab === 'bookings' ? currentBookings : previousBookings).length ? <BookingCards records={tab === 'bookings' ? currentBookings : previousBookings} /> : <div className="empty-state"><Icon name="compass" size={36} /><h2>{tab === 'history' ? '아직 여행 이력이 없어요.' : '신청한 여행이 없어요.'}</h2><p>{tab === 'history' ? '완료한 여행뿐 아니라 신청·결제 내역도 여기서 확인할 수 있어요.' : '여행을 선택하고 결제 시연을 완료하면 내역이 표시돼요.'}</p><AppLink className="button primary" href="/tours">여행 둘러보기 <Icon name="arrow" size={17} /></AppLink></div>}
      </>}
      {session?.role === 'customer' && tab === 'profile' && <ProfilePanel />}
    </div>
  </>
}

export function CartPage({ cartIds, onCartToggle }: { cartIds: string[]; onCartToggle: (id: string) => void }) {
  const cartItems = tours.filter(tour => cartIds.includes(tour.id))
  return <>
    <div className="page-heading"><p className="eyebrow">여행 관리</p><h1>장바구니</h1><p>담은 여행을 확인하고 상품 구성으로 이어가세요.</p></div>
    {cartItems.length ? <div className="product-list">{cartItems.map(tour => <TourCard key={tour.id} tour={tour} inCart onCartToggle={() => onCartToggle(tour.id)} />)}</div> : <div className="empty-state"><Icon name="cart" size={36} /><h2>장바구니가 비어 있어요.</h2><p>여행상품을 장바구니에 담아 비교해 보세요.</p><AppLink className="button primary" href="/tours">여행 둘러보기 <Icon name="arrow" size={17} /></AppLink></div>}
  </>
}
