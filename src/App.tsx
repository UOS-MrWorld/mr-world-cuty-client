import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { AppLink } from './components/AppLink'
import { BrandMark } from './components/BrandMark'
import { FlowSteps } from './components/FlowSteps'
import { Icon } from './components/Icon'
import { createDraft, getEstimate, gradeLabels, hotelLabels, isOpenTravelDate, isValidTravelDate, mealLabels, minimumGrade, normalizeDraft, getGradeDefaults, transportLabels } from './data/configuration'
import { formatPrice } from './data/travel'
import { themes, tours } from './data/travel'
import { getVisibleTours, themeLabels } from './data/catalogue'
import { sendVoiceCommand, type VoiceResponse, type VoiceScreenContext } from './api/voice'
import { useLocalStorage } from './hooks/useLocalStorage'
import { navigate, useRoute, useRouteTransitioning } from './hooks/useRoute'
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

import type { HotelGrade, ThemeId, TravelDraft, TravelGrade, TravelMeal, TravelTransport } from './types/travel'

// 음성 AI 서버의 Theme 값(BE Enum) → FE 테마 id
const voiceThemes: Record<string, Exclude<ThemeId, 'all'>> = {
  HONEYMOON: 'romance', HEALING: 'healing', GOLF: 'golf', TREKKING: 'outdoor',
}
// 음성 AI 서버의 구성 값(BE Enum) → FE 여행 구성 값
const voiceGrades: Record<string, TravelGrade> = { CLASSIC: 'classic', GRAND: 'grand', PREMIUM: 'premium' }
const voiceHotels: Record<string, HotelGrade> = { THREE_STAR: '3', FOUR_STAR: '4', FIVE_STAR: '5' }
const voiceMeals: Record<string, TravelMeal> = { LUNCH_BOX: 'lunch', LOCAL_RESTAURANT: 'local', FINE_DINING: 'steak' }
const voiceTransports: Record<string, TravelTransport> = { PREMIUM_CAR_2: 'private', PREMIUM_VAN_10: 'van' }
const voiceDrinks = [{ optionId: 1, name: '샴페인', key: 'champagne' }, { optionId: 2, name: '커피', key: 'coffee' }] as const

function describeDraft(draft: TravelDraft) {
  const drinks = [draft.grade === 'premium' || draft.champagne ? '샴페인' : '', draft.coffee ? '커피' : ''].filter(Boolean).join('·')
  return [draft.date && `${draft.date} 출발`, `${draft.travelers}명`, gradeLabels[draft.grade], hotelLabels[draft.hotel],
    mealLabels[draft.meal], transportLabels[draft.transport], drinks].filter(Boolean).join(' · ')
}

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
  const routeTransitioning = useRouteTransitioning()
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
  const [voicePending, setVoicePending] = useState<string | null>(null)
  const voiceTriggerRef = useRef<HTMLButtonElement>(null)
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

  // 음성 AI 서버에 보낼 '지금 화면' 정보. 목록 화면이면 보이는 순서 그대로 상품을 보낸다.
  function voiceContext(): VoiceScreenContext {
    const visible = pathname === '/tours' ? getVisibleTours(new URLSearchParams(search), cartIds) : tour ? [tour] : []
    return {
      screen: pathname === '/tours' ? 'list' : tour ? (screen === 'configure' ? 'configure' : screen === 'checkout' ? 'checkout' : 'detail') : 'other',
      tours: visible.map(item => ({ tourId: item.id, tourName: item.title, location: item.location, theme: themeLabels[item.theme], price: item.price })),
      availableTourLevels: tour ? (minimumGrade(tour) === 'grand' ? ['GRAND', 'PREMIUM'] : ['CLASSIC', 'GRAND', 'PREMIUM']) : [],
      drinkOptions: tour ? voiceDrinks.map(({ optionId, name }) => ({ optionId, name })) : [],
      pendingAction: voicePending,
    }
  }

  // 음성 AI 서버가 돌려준 명령을 기존 화면 이동·검색 기능으로 실행한다.
  function applyVoice(result: VoiceResponse) {
    const heard = result.recognizedText ? `“${result.recognizedText}” ` : ''
    let target = route
    let message = ''
    // 한 문장에 명령이 여러 개일 수 있어서("11월 20일로 하고 다음으로") 바뀐 구성·화면을 따라가며 처리한다
    let currentTour = tour
    let current = draft
    let currentScreen = screen
    setVoicePending(result.pending?.action ?? null)
    for (const command of result.commands) {
      const params = command.params
      if (command.action === 'search') {
        const next = new URLSearchParams()
        const theme = voiceThemes[String(params.theme ?? '')]
        if (theme) next.set('theme', theme)
        if (typeof params.maxPrice === 'number') next.set('budget', String(params.maxPrice))
        if (typeof params.keyword === 'string' && params.keyword) next.set('q', params.keyword)
        target = next.size ? `/tours?${next.toString()}` : '/tours'
        message = `${heard}조건으로 여행을 찾았어요.`
        navigate(target)
      } else if (command.action === 'select' && tours.some(item => item.id === params.tourId)) {
        currentTour = tours.find(item => item.id === params.tourId)!
        current = drafts.find(item => item.tourId === currentTour!.id) ?? createDraft(currentTour)
        currentScreen = undefined
        target = `/tours/${currentTour.id}${search}`
        navigate(target)
      } else if (command.action === 'configure' && currentTour && current) {
        // 등급을 바꾸면 화면에서 고를 때처럼 그 등급 기본 구성부터 적용하고, 말한 항목을 덮어쓴다
        const grade = voiceGrades[String(params.tourLevel ?? '')]
        const changes: Partial<TravelDraft> = grade ? { grade, ...getGradeDefaults(currentTour, grade) } : {}
        const hotel = voiceHotels[String(params.hotelGrade ?? '')]
        const meal = voiceMeals[String(params.mealType ?? '')]
        const transport = voiceTransports[String(params.transport ?? '')]
        if (hotel) changes.hotel = hotel
        if (meal) changes.meal = meal
        if (transport) changes.transport = transport
        if (typeof params.guestCount === 'number') changes.travelers = params.guestCount
        if (typeof params.departureDate === 'string') changes.date = params.departureDate
        if (Array.isArray(params.drinkOptions)) {
          for (const option of params.drinkOptions as { optionId?: number; quantity?: number }[]) {
            const drink = voiceDrinks.find(item => item.optionId === option.optionId)
            if (drink) changes[drink.key] = (option.quantity ?? 0) > 0
          }
        }
        const next = normalizeDraft(currentTour, { ...current, ...changes })
        updateDraft(next)
        current = next
        // 상품 규칙(허니문은 짝수 인원·클래식 불가 등) 때문에 말한 값과 달라진 항목이 있으면 알려준다
        const adjusted = (Object.keys(changes) as (keyof TravelDraft)[]).some(key => next[key] !== changes[key])
        const dateNote = changes.date && !isOpenTravelDate(next.date) ? ' 출발일은 모집 마감 전 날짜로 다시 골라 주세요.' : ''
        message = `${heard}구성을 바꿨어요: ${describeDraft(next)}. 예상 합계 ${formatPrice(getEstimate(currentTour, next).total)}원.${adjusted ? ' 상품 규칙에 맞게 일부 선택을 조정했어요.' : ''}${dateNote}`
        const onlyDateOrTravelers = Object.keys(changes).every(key => key === 'date' || key === 'travelers')
        if (!currentScreen && !onlyDateOrTravelers) {
          target = `/tours/${currentTour.id}/configure${search}`
          currentScreen = 'configure'
          navigate(target)
        }
      } else if (command.action === 'next' && currentTour && current) {
        if (currentScreen !== 'configure' && currentScreen) {
          message = `${heard}이 화면에서는 다음 단계가 없어요.`
        } else if (!isOpenTravelDate(current.date)) {
          message = `${heard}먼저 출발 희망일을 말해 주세요. 예: “11월 20일 출발로 해줘”`
        } else {
          currentScreen = currentScreen === 'configure' ? 'checkout' : 'configure'
          target = `/tours/${currentTour.id}/${currentScreen}${search}`
          navigate(target)
        }
      } else if (command.action === 'checkout' && currentTour && current) {
        if (!isOpenTravelDate(current.date)) {
          message = `${heard}신청하려면 출발 희망일이 필요해요. 예: “11월 20일 출발로 해줘”`
        } else {
          currentScreen = 'checkout'
          target = `/tours/${currentTour.id}/checkout${search}`
          message = `${heard}신청 화면으로 왔어요. 여행자 정보 입력과 결제는 직접 진행해 주세요.`
          navigate(target)
        }
      } else if (command.action === 'summary' && currentTour && current) {
        message = `${heard}${describeDraft(current)} · 예상 합계 ${formatPrice(getEstimate(currentTour, current).total)}원이에요.`
      } else if (command.action === 'back') {
        window.history.back()
        return
      } else if (command.action === 'unknown') {
        message = `${heard}${String(params.message ?? '다시 말씀해 주세요.')}`
      } else if (['configure', 'next', 'checkout', 'summary'].includes(command.action)) {
        message = `${heard}먼저 여행 상품을 골라 주세요. 예: “두 번째 거 보여줘”`
      } else if (command.action !== 'cancel') {
        message = `${heard}이 요청은 아직 음성으로 처리할 수 없어요. 화면에서 직접 선택해 주세요.`
      }
    }
    if (result.pending?.message) message = `${heard}${result.pending.message} 마이크를 눌러 “응”이라고 답해 주세요.`
    if (message) setFeedback({ route: target, message })
  }

  async function handleVoiceAudio(audio: Blob) {
    try {
      applyVoice(await sendVoiceCommand(audio, voiceContext()))
    } catch {
      setFeedback({ route, message: '음성 서버에 연결하지 못했어요. 화면에서 직접 선택해 주세요.' })
    }
  }

  function closeVoice() {
    setVoiceOpen(false)
    window.requestAnimationFrame(() => voiceTriggerRef.current?.focus())
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
      <div className={`site-globe-backdrop${isLanding ? ' is-landing' : ''}`} aria-hidden="true"><div className="site-globe-dome-window"><Suspense fallback={null}><SnowGlobe mood={backdropMood} paused={routeTransitioning} reducedMotion={reducedMotion} /></Suspense></div></div>
      <header className={`site-header app-header${isLanding ? ' landing-header' : ''}`}>
        <div className="header-main">
          <AppLink className="brand" href="/" aria-label="CUTY 홈"><BrandMark /></AppLink>
          <nav className="main-nav" aria-label="주요 메뉴"><AppLink href="/" aria-current={isLanding ? 'page' : undefined}>홈</AppLink><AppLink href="/tours" aria-current={pathname === '/tours' || tour ? 'page' : undefined}>여행 둘러보기</AppLink><AppLink href="/my-trips" aria-current={pathname === '/my-trips' ? 'page' : undefined}>내 여행</AppLink></nav>
          <nav className="utility-nav" aria-label="보조 메뉴">{!isStaff && <AppLink href="/cart" aria-label={`장바구니 ${cartIds.length}개`} aria-current={pathname === '/cart' || pathname === '/saved' ? 'page' : undefined}><Icon name="cart" size={18} /><span>장바구니</span>{cartIds.length > 0 && <b>{cartIds.length}</b>}</AppLink>}{session ? <button className="session-pill" onClick={exitDemo} title="시연 정보와 개인정보를 지우고 시연을 종료합니다">{session.role === 'staff' ? '직원' : '고객'} 시연 종료</button> : <AppLink href={`/login?next=${encodeURIComponent(isAuth ? '/my-trips' : route)}`}>로그인</AppLink>}<AppLink href="/staff/tours" className="staff-entry" aria-current={isStaff ? 'page' : undefined}>직원 화면</AppLink></nav>
        </div>
        {!isLanding && !isStaff && !isAuth && pathname !== '/tours' && pathname !== '/my-trips' && <nav className="category-nav" aria-label="여행 테마 메뉴">{themes.map(item => {
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

      {isLanding ? <footer className={`home-footer${voiceOpen ? ' is-voice-open' : ''}`}><VoiceFooterCta buttonRef={voiceTriggerRef} compact onClick={() => setVoiceOpen(true)} /></footer> : <footer className={`site-footer app-footer${voiceOpen ? ' is-voice-open' : ''}`}>
          <div className="footer-top"><AppLink className="brand" href="/" aria-label="CUTY 홈"><BrandMark /></AppLink><nav aria-label="하단 메뉴"><AppLink href="/tours">전체 여행</AppLink><AppLink href="/my-trips">내 여행</AppLink><AppLink href="/cart">장바구니</AppLink></nav></div>
          <VoiceFooterCta buttonRef={voiceTriggerRef} onClick={() => setVoiceOpen(true)} />
          <p>Mr.CUTY · 테마여행 상품 구성 서비스</p>
          <small>© Mr.CUTY.</small>
      </footer>}
      <TravelHistoryDialog />
      {voiceOpen && <VoiceSearchPanel display={isLanding ? 'waveform' : 'floating'} onClose={closeVoice} onRecorded={handleVoiceAudio} />}
    </>
  )
}
