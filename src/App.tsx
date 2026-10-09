import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { AppLink } from './components/AppLink'
import { BrandMark } from './components/BrandMark'
import { FlowSteps } from './components/FlowSteps'
import { Icon } from './components/Icon'
import { createDraft, isValidTravelDate, normalizeDraft } from './data/configuration'
import { themes, tours } from './data/travel'
import { themeLabels } from './data/catalogue'
import { useLocalStorage } from './hooks/useLocalStorage'
import { navigate, useRoute } from './hooks/useRoute'
import ExplorePage from './pages/ExplorePage'
import TourDetailPage from './pages/TourDetailPage'
import { ConfigurePage } from './pages/ConfigurePage'
import { CheckoutPage } from './pages/CheckoutPage'
import { BookingPreviewPage } from './pages/BookingPreviewPage'
import { CartPage, MyTripsPage } from './pages/MyTripsPage'
import LandingPage from './pages/LandingPage'
import { AuthPage } from './pages/AuthPage'
import { DemoSessionProvider, useDemoSession } from './hooks/useDemoSession'
import { TravelHistoryDialog } from './components/TravelHistoryDialog'
import { VoiceSearchPanel } from './components/VoiceSearchPanel'
import { VoiceFooterCta } from './components/VoiceFooterCta'
import { useReducedMotion } from './hooks/useReducedMotion'
import type { GlobeMood } from './types/landing'
const SnowGlobe = lazy(() => import('./components/SnowGlobe'))
const StaffPage = lazy(() => import('./pages/StaffPage'))

import type { TravelDraft } from './types/travel'

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

const isStoredDraftArray = (value: unknown): value is Record<string, unknown>[] =>
  Array.isArray(value) && value.every((item) =>
    item && typeof item === 'object' && typeof item.tourId === 'string',
  )

const pageNames: Record<string, string> = {
  configure: '여행 구성',
  checkout: '신청·결제',
  preview: '신청 결과·상세',
}
const collectionNames: Record<string, string> = {
  '/': 'CUTY 테마여행',
  '/tours': '여행상품',
  '/my-trips': '내 여행',
  '/cart': '장바구니',
  '/saved': '장바구니',
  '/login': '로그인',
  '/signup': '회원가입',
}
const flowSteps: Record<string, number> = { configure: 2, checkout: 3, preview: 4 }

export default function App() {
  return <DemoSessionProvider><CutyApp /></DemoSessionProvider>
}

function CutyApp() {
  const { session, bookings, exitDemo } = useDemoSession()
  const route = useRoute()
  const pathname = route.split('?')[0].replace(/\/$/, '') || '/'
  const search = window.location.search
  const match = pathname.match(/^\/tours\/([^/]+)(?:\/(configure|checkout|preview))?$/)
  const tour = match ? tours.find((item) => item.id === match[1]) : undefined
  const screen = match?.[2]
  const isStaff = /^\/staff\/(?:tours(?:\/new|\/[^/]+\/edit)?|inventory|customers)$/.test(pathname)
  const isLanding = pathname === '/'
  const isAuth = pathname === '/login' || pathname === '/signup'
  const reducedMotion = useReducedMotion()
  const [homeMood, setHomeMood] = useState<GlobeMood>('honeymoon')
  const requestedTheme = new URLSearchParams(search).get('theme')
  const selectedTheme = tour?.theme ?? themes.find(item => item.id === requestedTheme)?.id ?? 'all'
  const routeMood: GlobeMood = selectedTheme === 'golf' ? 'golf'
    : selectedTheme === 'healing' ? 'family'
      : selectedTheme === 'outdoor' ? 'trekking' : 'honeymoon'
  const backdropMood = isLanding || selectedTheme === 'all' ? homeMood : routeMood
  const pageLabel = isStaff ? '직원 화면 미리보기' : tour
    ? pageNames[screen ?? ''] ?? '상품 상세'
    : collectionNames[pathname] ?? '페이지를 찾을 수 없습니다'
  const title = tour ? `${pageLabel} · ${tour.title}` : pageLabel
  const legacyCart = (() => {
    try {
      const value: unknown = JSON.parse(localStorage.getItem('cuty:wishes:v1') ?? 'null')
      return isStringArray(value) ? value : []
    } catch {
      return []
    }
  })()
  const [cartIds, saveCartIds, cartError] = useLocalStorage('cuty:cart:v1', legacyCart, isStringArray)
  const [storedDrafts, saveDrafts, draftsError] = useLocalStorage('cuty:drafts:v1', [], isStoredDraftArray)
  const [feedback, setFeedback] = useState({ route: '', message: '' })
  const [voiceOpen, setVoiceOpen] = useState(false)
  const previousPath = useRef<string | null>(null)
  const drafts = tours.flatMap((item) => {
    const stored = storedDrafts.find((draft) => draft.tourId === item.id)
    return stored ? [normalizeDraft(item, stored)] : []
  })
  const bookingId = new URLSearchParams(search).get('booking')
  const previewBooking = screen === 'preview' ? bookings.find(item => item.id === bookingId && item.tourId === tour?.id) : undefined
  const draft = tour
    ? previewBooking?.draft ?? drafts.find((item) => item.tourId === tour.id) ?? createDraft(tour)
    : undefined

  useEffect(() => {
    document.title = `${title} | CUTY`
    if (previousPath.current !== pathname) {
      window.scrollTo({ top: 0, behavior: 'instant' })
      if (previousPath.current !== null) {
        const heading = document.querySelector<HTMLElement>('main h1')
        heading?.setAttribute('tabindex', '-1')
        heading?.focus({ preventScroll: true })
      }
      previousPath.current = pathname
    }
  }, [pathname, title])

  function updateDraft(next: TravelDraft) {
    return saveDrafts([
      ...storedDrafts.filter((item) => item.tourId !== next.tourId),
      { ...next },
    ])
  }

  function toggleCart(id: string) {
    saveCartIds(cartIds.includes(id) ? cartIds.filter((item) => item !== id) : [...cartIds, id])
  }

  function renderPage() {
    if (isAuth) return <AuthPage key={pathname} mode={pathname === '/login' ? 'login' : 'signup'} next={new URLSearchParams(search).get('next') ?? undefined} />
    if (isStaff) {
      if (!session) return <AuthPage mode="login" next={`${pathname}${search}`} />
      if (session.role !== 'staff') return <div className="empty-state"><h1>직원 권한이 필요한 화면이에요.</h1><p>고객 시연 모드에서는 상품·재고·고객 정보를 관리할 수 없어요.</p><div className="action-row"><AppLink className="button secondary" href="/tours">여행 둘러보기</AppLink><AppLink className="button primary" href={`/login?next=${encodeURIComponent(pathname)}`}>직원 시연 모드 선택</AppLink></div></div>
      return <Suspense fallback={<p role="status">직원 화면을 불러오는 중입니다.</p>}><StaffPage path={pathname} /></Suspense>
    }
    if (pathname === '/') return <LandingPage onMoodChange={setHomeMood} />
    if (pathname === '/tours') {
      return <ExplorePage cartIds={cartIds} onCartToggle={toggleCart} />
    }
    if (pathname === '/my-trips') {
      return <MyTripsPage drafts={drafts} />
    }
    if (pathname === '/cart' || pathname === '/saved') {
      return <CartPage cartIds={cartIds} onCartToggle={toggleCart} />
    }
    if (!tour || !draft) {
      return (
        <div className="empty-state">
          <Icon name="compass" size={36} />
          <h1>페이지를 찾을 수 없습니다</h1>
          <p>주소를 확인하거나 여행 목록에서 다시 시작해 주세요.</p>
          <AppLink className="button primary" href="/tours">여행 목록으로</AppLink>
        </div>
      )
    }

    const requiresDate = screen === 'checkout' || screen === 'preview'
    if (requiresDate && !bookingId && !previewBooking && !isValidTravelDate(draft.date)) {
      return (
        <div className="empty-state">
          <Icon name="compass" size={36} />
          <h1>출발 희망일을 선택해 주세요</h1>
          <p>저장된 구성에서 출발 희망일을 선택한 뒤 진행해 주세요.</p>
          <AppLink className="button primary" href={`/tours/${tour.id}/configure${search}`}>
            여행 구성으로 이동
          </AppLink>
        </div>
      )
    }
    if (screen === 'configure') {
      return (
        <ConfigurePage
          key={tour.id}
          tour={tour}
          draft={draft}
          onChange={updateDraft}
          onSave={() => {
            const persisted = updateDraft(draft)
            setFeedback({
              route,
              message: persisted
                ? '구성을 저장했습니다. 내 여행에서 다시 확인할 수 있습니다.'
                : '현재 화면에만 구성을 보관했습니다. 브라우저 저장 공간을 확인해 주세요.',
            })
          }}
          onContinue={() => {
            updateDraft(draft)
            navigate(`/tours/${tour.id}/checkout${search}`)
          }}
        />
      )
    }
    if (screen === 'checkout') {
      return (
        <CheckoutPage
          tour={tour}
          draft={draft}
          onPreview={() => navigate(`/tours/${tour.id}/preview${search}`)}
        />
      )
    }
    if (screen === 'preview') {
      return <BookingPreviewPage tour={tour} draft={draft} />
    }
    return (
      <TourDetailPage
        key={tour.id}
        tour={tour}
        draft={draft}
        onChange={updateDraft}
        onContinue={() => navigate(`/tours/${tour.id}/configure${search}`)}
        inCart={cartIds.includes(tour.id)}
        onCartToggle={() => toggleCart(tour.id)}
      />
    )
  }

  return (
    <>
      <a className="skip-link" href="#page-content">본문으로 건너뛰기</a>
      <div className={`site-globe-backdrop${isLanding ? ' is-landing' : ''}`} aria-hidden="true"><div className="site-globe-dome-window"><Suspense fallback={null}><SnowGlobe mood={backdropMood} paused={false} reducedMotion={reducedMotion} /></Suspense></div></div>
      <header className={`site-header app-header${isLanding ? ' landing-header' : ''}`}>
        <div className="header-main">
          <AppLink className="brand" href="/" aria-label="CUTY 홈"><BrandMark /></AppLink>
          <nav className="main-nav" aria-label="주요 메뉴"><AppLink href="/" aria-current={isLanding ? 'page' : undefined}>홈</AppLink><AppLink href="/tours" aria-current={pathname === '/tours' || tour ? 'page' : undefined}>여행 둘러보기</AppLink><AppLink href="/my-trips" aria-current={pathname === '/my-trips' ? 'page' : undefined}>내 여행</AppLink></nav>
          <nav className="utility-nav" aria-label="보조 메뉴">{!isStaff && <AppLink href="/cart" aria-label={`장바구니 ${cartIds.length}개`} aria-current={pathname === '/cart' || pathname === '/saved' ? 'page' : undefined}><Icon name="cart" size={18} /><span>장바구니</span>{cartIds.length > 0 && <b>{cartIds.length}</b>}</AppLink>}{session ? <button className="session-pill" onClick={exitDemo} title="시연 정보와 개인정보를 지우고 시연을 종료합니다">{session.role === 'staff' ? '직원' : '고객'} 시연 종료</button> : <AppLink href={`/login?next=${encodeURIComponent(isAuth ? '/my-trips' : route)}`}>로그인</AppLink>}<AppLink href="/staff/tours" className="staff-entry" aria-current={isStaff ? 'page' : undefined}>직원 화면</AppLink></nav>
        </div>
        {!isLanding && !isStaff && !isAuth && <nav className="category-nav" aria-label="여행 테마 메뉴">{themes.map(item => {
          const href = item.id === 'all' ? '/tours' : `/tours?theme=${item.id}`
          const selected = tour ? tour.theme === item.id : pathname === '/tours' && (new URLSearchParams(search).get('theme') ?? 'all') === item.id
          return <AppLink key={item.id} href={href} className={selected ? 'nav-active' : ''} aria-current={selected && pathname === '/tours' ? 'page' : undefined}>{themeLabels[item.id]}</AppLink>
        })}</nav>}
      </header>
      {isStaff && <div className="prototype-strip"><div>직원 화면 미리보기</div></div>}

      <main id="page-content" className={`app-main${isLanding ? ' landing-main' : ''}${isStaff ? ' staff-main' : ''}`} tabIndex={-1}>
        {!isLanding && !isStaff && !isAuth && pathname !== '/tours' && (
          <nav className="breadcrumbs" aria-label="현재 위치">
            <AppLink href={`/tours${search}`}>테마여행</AppLink>
            <span aria-hidden="true">/</span>
            {tour && screen && (
              <>
                <AppLink href={`/tours/${tour.id}${search}`}>{tour.title}</AppLink>
                <span aria-hidden="true">/</span>
              </>
            )}
            <span aria-current="page">{pageLabel}</span>
          </nav>
        )}
        {tour && screen && (
          <FlowSteps tourId={tour.id} step={flowSteps[screen ?? ''] ?? 1} search={search} />
        )}
        {(cartError || draftsError) && (
          <p className="notice notice-error" role="alert">
            브라우저 저장 공간을 사용할 수 없습니다. 새로고침하면 변경 내용이 사라질 수 있습니다.
          </p>
        )}
        {feedback.route === route && feedback.message && (
          <p className="notice" role="status">{feedback.message}</p>
        )}
        {renderPage()}
      </main>

      {isLanding ? <footer className={`home-footer${voiceOpen ? ' is-voice-open' : ''}`}><VoiceFooterCta compact onClick={() => setVoiceOpen(true)} /></footer> : <footer className={`site-footer app-footer${voiceOpen ? ' is-voice-open' : ''}`}>
          <div className="footer-top"><AppLink className="brand" href="/" aria-label="CUTY 홈"><BrandMark /></AppLink><nav aria-label="하단 메뉴"><AppLink href="/tours">전체 여행</AppLink><AppLink href="/my-trips">내 여행</AppLink><AppLink href="/cart">장바구니</AppLink></nav></div>
          <VoiceFooterCta onClick={() => setVoiceOpen(true)} />
          <p>Mr.CUTY · 테마여행 상품 구성 서비스</p>
          <small>© Mr.CUTY.</small>
      </footer>}
      <TravelHistoryDialog />
      {voiceOpen && <VoiceSearchPanel onClose={() => setVoiceOpen(false)} />}
    </>
  )
}
