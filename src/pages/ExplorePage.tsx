import { useRef, useState } from 'react'
import { Icon } from '../components/Icon'
import { BrandMark } from '../components/BrandMark'
import { NeonLogo } from '../components/NeonLogo'
import { ThemeIllustration } from '../components/ThemeIllustration'
import { TourCard } from '../components/TourCard'
import { TripBuilder } from '../components/TripBuilder'
import { heroImage, themes, tours } from '../data/travel'
import { useLocalStorage } from '../hooks/useLocalStorage'
import type { ThemeId, Tour, TravelDraft } from '../types/travel'

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')
const isDraftArray = (value: unknown): value is TravelDraft[] =>
  Array.isArray(value) &&
  value.every(
    (item) =>
      item &&
      typeof item === 'object' &&
      ['tourId', 'grade', 'hotel', 'transport', 'meal'].every(
        (key) => typeof item[key] === 'string',
      ),
  )

export default function ExplorePage() {
  const [theme, setTheme] = useState<ThemeId>('all')
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'explore' | 'saved' | 'drafts'>('explore')
  const [activeTour, setActiveTour] = useState<Tour | null>(null)
  const [savedIds, saveIds, savedError] = useLocalStorage(
    'cuty:wishes:v1',
    [],
    isStringArray,
  )
  const [drafts, saveDrafts, draftsError] = useLocalStorage(
    'cuty:drafts:v1',
    [],
    isDraftArray,
  )
  const results = useRef<HTMLElement>(null)
  const themeSection = useRef<HTMLElement>(null)
  const filtered = tours.filter(
    (tour) =>
      (theme === 'all' || tour.theme === theme) &&
      `${tour.title} ${tour.location} ${tour.description}`
        .toLowerCase()
        .includes(search.toLowerCase().trim()) &&
      (view !== 'saved' || savedIds.includes(tour.id)) &&
      (view !== 'drafts' || drafts.some((draft) => draft.tourId === tour.id)),
  )
  function showView(next: typeof view) {
    setView(next)
    setTheme('all')
    setSearch('')
    setQuery('')
    results.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  function selectTheme(next: ThemeId) {
    setTheme(next)
    setView('explore')
    results.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  return (
    <>
      <a className="skip-link" href="#journeys">
        여행 목록으로 건너뛰기
      </a>
      <header className="site-header">
        <a
          className="brand"
          href="#"
          aria-label="CUTY 홈"
          onClick={() => {
            setView('explore')
            setTheme('all')
            setSearch('')
            setQuery('')
          }}
        >
          <BrandMark />
        </a>
        <nav aria-label="메인 메뉴">
          <button
            className={view === 'explore' ? 'nav-active' : ''}
            onClick={() => showView('explore')}
          >
            여행 발견
          </button>
          <button
            onClick={() =>
              themeSection.current?.scrollIntoView({ behavior: 'smooth' })
            }
          >
            테마 컬렉션
          </button>
          <button
            className={view === 'drafts' ? 'nav-active' : ''}
            onClick={() => showView('drafts')}
          >
            내 여행
            {drafts.length > 0 && (
              <span className="count">{drafts.length}</span>
            )}
          </button>
        </nav>
        <button
          className={`header-save ${view === 'saved' ? 'nav-active' : ''}`}
          aria-label={`찜한 여행 ${savedIds.length}개`}
          onClick={() => showView('saved')}
        >
          <Icon name="heart" size={18} />
          <span>찜한 여행</span>
          <span className="count">{savedIds.length}</span>
        </button>
      </header>
      <main className="organic-experience">
        <section className="masthead" aria-labelledby="hero-title">
          <div className="sky-cloud cloud-one" aria-hidden="true" />
          <div className="sky-cloud cloud-two" aria-hidden="true" />
          <div className="masthead-copy">
            <span className="hello-badge">
              <Icon name="sparkles" size={16} /> 만나서 반가워요, 여행의 시작
              CUTY!
            </span>
            <h1 id="hero-title">
              취향 한 스푼,
              <br />
              <span>설렘 가득한 여행!</span>
            </h1>
            <p>
              누구와 떠나든, 무엇을 좋아하든.
              <br />
              나를 닮은 여행을 함께 찾아볼까요?
            </p>
            <button
              className="button masthead-cta"
              onClick={() =>
                themeSection.current?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              나의 여행 발견하기 <Icon name="arrow" size={20} />
            </button>
            <div className="masthead-note">
              <span className="tiny-heart">
                <Icon name="heart" size={14} />
              </span>{' '}
              좋아하는 순간을 모아, 나만의 여행으로
            </div>
          </div>
          <div className="brand-world">
            <span className="glass-bubble bubble-one" aria-hidden="true" />
            <span className="glass-bubble bubble-two" aria-hidden="true" />
            <span className="world-orbit" aria-hidden="true" />
            <NeonLogo />
            <span className="floating-note note-top">
              <Icon name="heart" size={17} /> 취향대로 떠나요
            </span>
            <span className="world-sparkle sparkle-one" aria-hidden="true">
              ✦
            </span>
            <span className="world-sparkle sparkle-two" aria-hidden="true">
              ✦
            </span>
            <div className="travel-postcard">
              <img
                src={heroImage}
                alt="산과 푸른 호수 위에서 바라본 나무 보트"
              />
              <span>
                다음 추억은 어디일까요?
                <Icon name="heart" size={13} />
              </span>
            </div>
            <span className="floating-note note-bottom">
              <span className="mint-dot" /> 나만의 여행, 준비 완료!
            </span>
          </div>
          <div className="masthead-signoff">
            A LITTLE MORE YOU, A LOT MORE JOY.
          </div>
        </section>
        <section className="discovery-bar" aria-label="여행 검색">
          <div className="search-intro">
            <Icon name="sparkles" size={23} />
            <span>
              마음이 이끄는 곳으로<strong>어떤 여행을 찾고 있나요?</strong>
            </span>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              setSearch(query)
              setView('explore')
              results.current?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            <label className="search-field">
              <Icon name="search" />
              <input
                aria-label="여행지 또는 키워드"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="여행지 또는 키워드를 입력해 보세요"
              />
            </label>
            <button className="button primary" type="submit">
              여행 찾기
              <Icon name="arrow" size={18} />
            </button>
          </form>
        </section>
        <section
          className="themes-section page-section"
          ref={themeSection}
          aria-labelledby="themes-title"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">FIND YOUR HAPPY</p>
              <h2 id="themes-title">오늘의 여행 취향은?</h2>
            </div>
            <p>마음이 콕! 가는 테마를 골라보세요.</p>
          </div>
          <div className="theme-trail">
            <svg
              className="theme-trail-line"
              viewBox="0 0 1000 180"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M65 75C215-15 245 200 400 110S635 5 710 90 870 170 940 65" />
            </svg>
            {themes
              .filter((item) => item.id !== 'all')
              .map((item) => (
                <button
                  className={`theme-choice theme-choice-${item.id} ${theme === item.id ? 'is-active' : ''}`}
                  key={item.id}
                  onClick={() => selectTheme(item.id)}
                  aria-pressed={theme === item.id}
                >
                  <span className="theme-shape">
                    <ThemeIllustration
                      theme={item.id as Exclude<ThemeId, 'all'>}
                    />
                    <span className="theme-chosen">
                      <Icon name="check" size={15} />
                    </span>
                  </span>
                  <span className="theme-text">
                    <span className="theme-english">{item.english}</span>
                    <strong>{item.label}</strong>
                    <span className="theme-description">
                      {item.description}
                    </span>
                  </span>
                  <Icon name="arrow" size={17} />
                </button>
              ))}
          </div>
        </section>
        <section
          id="journeys"
          className="journeys-section page-section"
          ref={results}
          aria-labelledby="journeys-title"
        >
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                {view === 'explore'
                  ? 'PICK YOUR NEXT MEMORY'
                  : 'YOUR OWN COLLECTION'}
              </p>
              <h2 id="journeys-title">
                {view === 'saved'
                  ? '마음에 담아둔 여행'
                  : view === 'drafts'
                    ? '내 취향으로 만든 여행'
                    : '이런 여행, 어때요?'}
              </h2>
            </div>
            <span className="sample-label">
              샘플 컬렉션 · {filtered.length}개의 여행
            </span>
          </div>
          <div className="filter-row">
            <div className="filters" aria-label="여행 테마 필터">
              {themes.map((item) => (
                <button
                  key={item.id}
                  className={theme === item.id ? 'active' : ''}
                  onClick={() => setTheme(item.id)}
                  aria-pressed={theme === item.id}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <span className="curated-label">
              <Icon name="check" size={14} /> 취향을 담아 고른 여행
            </span>
          </div>
          {search && (
            <p className="search-result">
              ‘{search}’ 검색 결과
              <button
                onClick={() => {
                  setSearch('')
                  setQuery('')
                }}
              >
                검색 초기화
                <Icon name="close" size={14} />
              </button>
            </p>
          )}
          <div className="tour-grid">
            {filtered.map((tour) => (
              <TourCard
                key={tour.id}
                tour={tour}
                saved={savedIds.includes(tour.id)}
                onSave={() =>
                  saveIds(
                    savedIds.includes(tour.id)
                      ? savedIds.filter((id) => id !== tour.id)
                      : [...savedIds, tour.id],
                  )
                }
                onOpen={() => setActiveTour(tour)}
              />
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="empty-state">
              <Icon name="compass" size={36} />
              <h3>
                {view === 'saved'
                  ? '아직 마음에 담은 여행이 없어요'
                  : view === 'drafts'
                    ? '나만의 여행을 만들어 보세요'
                    : '조건에 맞는 여행이 없어요'}
              </h3>
              <p>
                {view === 'drafts'
                  ? '여행 카드를 열고 원하는 옵션을 선택해 저장하세요.'
                  : '다른 테마를 둘러보거나 검색어를 바꿔보세요.'}
              </p>
              <button
                className="button primary"
                onClick={() => showView('explore')}
              >
                모든 여행 둘러보기
                <Icon name="arrow" size={16} />
              </button>
            </div>
          )}
          {(savedError || draftsError) && (
            <p role="status" className="demo-note">
              브라우저 저장 공간을 사용할 수 없어 현재 화면에서만 저장됩니다.
            </p>
          )}
        </section>
        <section className="brand-moment" aria-labelledby="brand-moment-title">
          <div className="brand-moment-art">
            <NeonLogo compact />
            <span className="moment-orbit-note">
              <Icon name="sparkles" size={15} /> A LITTLE MAGIC, JUST FOR YOU
            </span>
          </div>
          <div className="brand-moment-copy">
            <p className="eyebrow">MAKE ROOM FOR YOUR NEXT MEMORY</p>
            <h2 id="brand-moment-title">
              여행의 모양은 달라도,
              <br />
              <span>주인공은 언제나 나.</span>
            </h2>
            <p>
              좋아하는 것들을 하나씩 모아보세요.
              <br />
              호텔부터 한 끼까지, 나만의 여행이 완성돼요.
            </p>
            <button
              className="button banner-cta"
              onClick={() => setActiveTour(tours[0])}
            >
              나만의 여행 만들기
              <Icon name="arrow" size={19} />
            </button>
          </div>
        </section>
        <section
          className="how-it-works page-section"
          aria-label="CUTY 이용 방법"
        >
          {[
            {
              icon: 'compass' as const,
              title: '마음이 가는 테마를 고르고',
              text: '누구와, 무엇을 하고 싶은지 생각해 보세요.',
            },
            {
              icon: 'sparkles' as const,
              title: '나에게 맞게 여행을 구성하고',
              text: '호텔부터 식사까지, 원하는 대로 골라보세요.',
            },
            {
              icon: 'heart' as const,
              title: '설레는 여행을 내 리스트에',
              text: '완성한 여행을 저장하고 천천히 준비하세요.',
            },
          ].map((step) => (
            <div key={step.title}>
              <span>
                <Icon name={step.icon} size={23} />
              </span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </div>
          ))}
        </section>
      </main>
      <footer className="site-footer">
        <div>
          <a className="brand" href="#" aria-label="CUTY 홈으로">
            <BrandMark />
          </a>
          <p>당신의 취향으로, 당신만의 여행을.</p>
        </div>
        <div className="footer-meta">
          <span>CURATE YOUR TRAVEL</span>
          <p>© {new Date().getFullYear()} CUTY · University of Seoul</p>
          <small>서비스 초안 · 여행 상품과 금액은 예시입니다.</small>
        </div>
      </footer>
      {activeTour && (
        <TripBuilder
          key={activeTour.id}
          tour={activeTour}
          initial={drafts.find((draft) => draft.tourId === activeTour.id)}
          onClose={() => setActiveTour(null)}
          onSave={(draft) => {
            const next = [
              ...drafts.filter((item) => item.tourId !== draft.tourId),
              draft,
            ]
            return saveDrafts(next)
          }}
        />
      )}
    </>
  )
}
