import { useEffect, useRef, useState } from 'react'
import { AppLink } from '../components/AppLink'
import { Icon } from '../components/Icon'
import { themeLabels } from '../data/catalogue'
import { getEarliestDepartureDate, getEstimate, gradeLabels, isOpenTravelDate, minimumGrade, normalizeDraft, themeBenefits } from '../data/configuration'
import { formatPrice } from '../data/travel'
import type { Tour, TravelDraft } from '../types/travel'

export default function TourDetailPage({ tour, inCart, onCartToggle, draft, onChange, onContinue }: {
  tour: Tour
  inCart: boolean
  onCartToggle: () => void
  draft: TravelDraft
  onChange: (draft: TravelDraft) => void
  onContinue: () => void
}) {
  const [dateError, setDateError] = useState(false)
  const dateInput = useRef<HTMLInputElement>(null)
  const searchInitialized = useRef(false)
  const requiresGrand = minimumGrade(tour) === 'grand'
  const estimate = getEstimate(tour, draft)
  useEffect(() => {
    if (searchInitialized.current) return
    searchInitialized.current = true
    const search = new URLSearchParams(window.location.search)
    const date = search.get('date')
    const travelers = Number(search.get('travelers'))
    const next = normalizeDraft(tour, {
      ...draft,
      ...(date && isOpenTravelDate(date) ? { date } : {}),
      ...(Number.isInteger(travelers) && travelers >= 1 && travelers <= 10 ? { travelers } : {}),
    })
    if (next.date !== draft.date || next.travelers !== draft.travelers) onChange(next)
  }, [draft, onChange, tour])
  function update(next: Partial<TravelDraft>) {
    onChange(normalizeDraft(tour, {...draft, ...next}))
  }
  return (
    <>
      <header className="detail-heading">
        <AppLink className="detail-back icon-button" href={`/tours${window.location.search}`} aria-label="상품 목록으로 돌아가기"><Icon name="arrow" size={21} /></AppLink>
        <div className="detail-heading-meta"><span className="theme-tag">{themeLabels[tour.theme]}</span><span>{tour.location}</span></div>
        <h1>{tour.title}</h1>
        <p>{tour.description}</p>
        <div className="detail-quick-facts"><span><Icon name="compass" size={17} />{tour.duration}</span><span>{gradeLabels[minimumGrade(tour)]} 이상</span><span>{tour.theme === 'romance' ? '커플별 2인 전용 차량' : '10인승 차량 기본'}</span></div>
      </header>
      <div className="flow-layout detail-layout">
        <div className="flow-main detail-main">
          <figure className="detail-visual"><img className="detail-photo" src={tour.image} alt={tour.imageAlt} /></figure>
          <nav className="detail-section-nav" aria-label="상품 상세 목차"><a href="#tour-overview">상품 안내</a><a href="#tour-grade">등급별 구성</a></nav>
          <section id="tour-overview" className="detail-section">
            <h2>상품 안내</h2>
            <dl className="information-table"><div><dt>여행지</dt><dd>{tour.location}</dd></div><div><dt>여행 기간</dt><dd>{tour.duration}</dd></div><div><dt>여행 테마</dt><dd>{themeLabels[tour.theme]}</dd></div><div><dt>기본 등급</dt><dd>{gradeLabels[minimumGrade(tour)]}{requiresGrand && ' · 클래식 선택 불가'}</dd></div></dl>
            <h3>테마 기본 제공</h3><ul className="benefit-list">{themeBenefits[tour.theme].map(item => <li key={item}><Icon name="check" size={16} />{item}</li>)}</ul>
          </section>
          <section id="tour-grade" className="detail-section">
            <h2>등급별 기본 구성</h2>
            <div className="table-scroll"><table className="grade-table"><caption className="sr-only">등급별 호텔과 식사 비교</caption><thead><tr><th scope="col">등급</th><th scope="col">호텔</th><th scope="col">기본 식사</th></tr></thead><tbody><tr className={requiresGrand ? 'unavailable-row' : ''}><th scope="row">클래식{requiresGrand && <small>선택 불가</small>}</th><td>3등급</td><td>도시락</td></tr><tr><th scope="row">그랜드</th><td>4등급</td><td>현지식 레스토랑</td></tr><tr><th scope="row">프리미엄</th><td>5등급</td><td>스테이크·샴페인</td></tr></tbody></table></div>
            <p className="muted">호텔·교통·식사는 다음 단계에서 변경할 수 있습니다. 기본 구성 대비 차액이 반영됩니다.</p>
          </section>
        </div>
        <aside className="flow-summary booking-panel" aria-labelledby="booking-panel-title">
          <div className="booking-panel-header"><h2 id="booking-panel-title">일정·인원 선택</h2><span>예시 상품</span></div>
          <div className="starting-price"><small>{gradeLabels[minimumGrade(tour)]} 기본 구성 · 1인</small><p><strong>{formatPrice(tour.price)}</strong>원~</p></div>
          <form id="detail-booking" noValidate onSubmit={event => {
            event.preventDefault()
            if (!isOpenTravelDate(draft.date)) { setDateError(true); dateInput.current?.focus(); return }
            onContinue()
          }}>
            <label className="field" htmlFor="detail-date">출발 희망일<input ref={dateInput} id="detail-date" type="date" min={getEarliestDepartureDate()} value={draft.date} required aria-invalid={dateError || undefined} aria-describedby={dateError ? 'detail-date-error' : 'detail-date-help'} onInput={event => { update({date:event.currentTarget.value}); setDateError(false) }} /></label>
            {dateError ? <p className="field-error" id="detail-date-error" role="alert">모집 마감 전인 {getEarliestDepartureDate()} 이후의 출발일을 선택해 주세요.</p> : <p id="detail-date-help" className="summary-note">모집 마감은 출발 7일 전이에요.</p>}
            <label className="field" htmlFor="detail-travelers">여행 인원<select id="detail-travelers" value={draft.travelers} onChange={event => update({travelers:Number(event.target.value)})}>{(tour.theme === 'romance' ? [2, 4, 6, 8, 10] : Array.from({length:10},(_,i)=>i+1)).map(n=><option key={n} value={n}>{n}명{tour.theme === 'romance' ? ` · ${n / 2}커플` : ''}</option>)}</select></label>
            <p className="summary-note">최소 출발 인원 {tour.theme === 'romance' ? '2커플' : '3명'} · 마감일에 확정</p>
            <div className="summary-total"><span>{draft.travelers}명 예상 합계</span><strong>{formatPrice(estimate.total)}<small>원</small></strong></div>
            <button className="button primary" type="submit">등급·옵션 선택<Icon name="arrow" size={17} /></button>
          </form>
          <button className={`button secondary cart-toggle-button${inCart ? ' is-in-cart' : ''}`} type="button" onClick={onCartToggle} aria-pressed={inCart}>{inCart ? '장바구니에 담김' : '장바구니 담기'}<Icon name="cart" size={17} /></button>
        </aside>
      </div>
      <div className="mobile-detail-bar"><div><small>1인 예시 가격</small><strong>{formatPrice(tour.price)}원~</strong></div><a className="button primary" href="#detail-booking">일정·인원 선택</a></div>
    </>
  )
}
