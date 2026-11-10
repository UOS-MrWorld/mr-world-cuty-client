import { useEffect, useRef, useState } from 'react'
import { getTourQuote } from '../api/tour'
import {
  getEstimate,
  getGradeDefaults,
  getTransportDescription,
  getEarliestDepartureDate,
  gradeDefaults,
  gradeLabels,
  hotelLabels,
  isOpenTravelDate,
  mealLabels,
  minimumGrade,
  normalizeDraft,
  themeBenefits,
  transportLabels,
} from '../data/configuration'
import { formatPrice } from '../data/travel'
import { findDrinkOption, toQuoteRequest } from '../data/bookingApiAdapter'
import type { QuoteResponse } from '../types/tourApi'
import type { HotelGrade, Tour, TravelDraft, TravelGrade, TravelMeal, TravelTransport } from '../types/travel'

export function ConfigurePage({ tour, draft, onChange, onContinue, onSave, inCart, onCartToggle }: {
  tour: Tour
  draft: TravelDraft
  onChange: (draft: TravelDraft) => void
  onContinue: () => void
  onSave: () => void
  inCart: boolean
  onCartToggle: () => void
}) {
  const dateInput = useRef<HTMLInputElement>(null)
  const [dateError, setDateError] = useState(false)
  const [changeNotice, setChangeNotice] = useState('')
  const [quote, setQuote] = useState<QuoteResponse | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(tour.source === 'api')
  const [quoteError, setQuoteError] = useState('')
  const estimate = getEstimate(tour, draft)
  const defaults = getGradeDefaults(tour, draft.grade)
  const champagneOption = findDrinkOption(tour, 'CHAMPAGNE')
  const coffeeOption = findDrinkOption(tour, 'COFFEE')
  const champagneIncluded = tour.source !== 'api' && draft.grade === 'premium'

  useEffect(() => {
    if (tour.source !== 'api') return
    let active = true
    setQuoteLoading(true)
    setQuoteError('')
    const timer = window.setTimeout(() => {
      void getTourQuote(Number(tour.id), toQuoteRequest(tour, draft)).then(response => {
        if (active) setQuote(response.data)
      }).catch(error => {
        if (!active) return
        setQuote(null)
        setQuoteError(error instanceof Error ? error.message : '선택한 옵션의 가격을 계산하지 못했습니다.')
      }).finally(() => {
        if (active) setQuoteLoading(false)
      })
    }, 250)
    return () => { active = false; window.clearTimeout(timer) }
  }, [draft, tour])

  function update(value: Partial<TravelDraft>) {
    onChange(normalizeDraft(tour, { ...draft, ...value }))
  }

  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">여행 구성</p>
        <h1>등급·옵션 선택</h1>
        <p>{tour.title} · {tour.duration}</p>
      </div>
      <form className="flow-layout configure-layout" noValidate onSubmit={(event) => {
        event.preventDefault()
        if (tour.source !== 'api' && !isOpenTravelDate(draft.date)) {
          setDateError(true)
          dateInput.current?.focus()
          return
        }
        if (tour.source === 'api' && (!quote || quoteLoading || quoteError)) return
        onContinue()
      }}>
        <div className="flow-main">
          <section className="surface-card">
            <h2>출발 희망일·인원</h2>
            <div className="field-grid">
              <div className="field">
                <label htmlFor="travel-date">{tour.source === 'api' ? '출발일' : '희망 출발일'} <span className="muted">필수</span></label>
                <input ref={dateInput} id="travel-date" type="date" min={tour.source === 'api' ? undefined : getEarliestDepartureDate()} readOnly={tour.source === 'api'} required value={draft.date}
                  aria-invalid={dateError || undefined} aria-describedby={dateError ? 'travel-date-error travel-date-help' : 'travel-date-help'}
                  onInput={(event) => {
                    update({ date: event.currentTarget.value })
                    setDateError(false)
                  }} />
                <small id="travel-date-help" className="muted">출발 7일 전 모집 마감</small>
                {dateError && <p className="field-error" id="travel-date-error" role="alert">모집 마감 전인 {getEarliestDepartureDate()} 이후의 출발일을 선택해 주세요.</p>}
              </div>
              <div className="field">
                <label htmlFor="travelers">여행 인원</label>
                <input id="travelers" type="number" min="1" step="1" value={draft.travelers} readOnly={tour.theme === 'romance'} aria-describedby="travelers-help"
                  onChange={(event) => {
                    const travelers = Number(event.currentTarget.value)
                    update({ travelers })
                    setChangeNotice(travelers > 2 && draft.transport === 'private' ? '3명 이상 선택 시 10인승 차량이 적용됩니다. 예시 기준입니다.' : '')
                  }} />
                <small className="muted" id="travelers-help">{tour.theme === 'romance' ? '허니문 예약은 정확히 2명 · 전체 결제 인원 3명 이상이면 출발 확정' : '예약 인원 상한 없음 · 전체 결제 인원 3명 이상이면 출발 확정'}</small>
              </div>
            </div>
          </section>

          <section className="surface-card">
            <fieldset>
              <legend><h2>여행 등급</h2></legend>
              <p className="muted">등급 변경 시 호텔·교통·식사·음료가 기본 구성으로 초기화됩니다. 희망일과 인원은 유지됩니다.</p>
              <div className="choice-grid grade-choices">
                {(Object.keys(gradeLabels) as TravelGrade[]).map((grade) => {
                  const unavailable = tour.source === 'api'
                    ? !tour.apiConfiguration?.availableGrades.includes(grade)
                    : grade === 'classic' && minimumGrade(tour) === 'grand'
                  const basic = getGradeDefaults(tour, grade)
                  const price = getEstimate(tour, { ...draft, grade, ...basic }).perPerson
                  return (
                    <label key={grade} className={`choice-card ${draft.grade === grade ? 'selected' : ''} ${unavailable ? 'unavailable' : ''}`}>
                      <input type="radio" name="grade" value={grade} disabled={unavailable} checked={draft.grade === grade}
                        onChange={() => {
                          update({ grade, ...basic })
                          setChangeNotice(`${gradeLabels[grade]} 기본 구성을 적용했습니다. 희망일과 인원은 유지됩니다.`)
                        }} />
                      <strong>{gradeLabels[grade]}{draft.grade === grade && <span className="selection-label"> · 선택됨</span>}</strong>
                      <span>{hotelLabels[gradeDefaults[grade].hotel]}</span>
                      <span>{mealLabels[gradeDefaults[grade].meal]}{tour.source !== 'api' && grade === 'premium' ? ' · 샴페인 포함' : ''}</span>
                      <small>{unavailable ? '선택할 수 없는 등급' : tour.source === 'api' ? `${hotelLabels[gradeDefaults[grade].hotel]} · ${mealLabels[gradeDefaults[grade].meal]}` : `${formatPrice(price)}원 / 1인`}</small>
                    </label>
                  )
                })}
              </div>
            </fieldset>
            {changeNotice && <p className="notice" role="status">{changeNotice}</p>}
          </section>

          <section className="surface-card">
            <h2>호텔·교통·식사</h2>
            <fieldset className="option-fieldset">
              <legend>호텔</legend>
              <div className="choice-grid">
                {(Object.keys(hotelLabels) as HotelGrade[]).map((hotel) => (
                  <label key={hotel} className={`choice-card ${draft.hotel === hotel ? 'selected' : ''}`}>
                    <input type="radio" name="hotel" checked={draft.hotel === hotel} onChange={() => update({ hotel })} />
                    <strong>{hotelLabels[hotel]}</strong>
                    {draft.hotel === hotel && <span className="selection-label">선택됨</span>}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="option-fieldset">
              <legend>교통</legend>
              <div className="choice-grid">
                {(Object.keys(transportLabels) as TravelTransport[]).map((transport) => {
                  const reason = tour.theme === 'romance' && transport === 'van'
                    ? '허니문은 커플별 2인 전용 차량 제공'
                    : tour.theme !== 'romance' && draft.travelers > 2 && transport === 'private' ? '2명 이하일 때 선택 가능' : ''
                  return (
                    <label key={transport} className={`choice-card ${draft.transport === transport ? 'selected' : ''} ${reason ? 'unavailable' : ''}`}>
                      <input type="radio" name="transport" disabled={Boolean(reason)} checked={draft.transport === transport} onChange={() => update({ transport })} />
                      <strong>{tour.theme === 'romance' && transport === 'private' ? `커플별 2인 전용 차량 · ${draft.travelers / 2}대` : transportLabels[transport]}</strong>
                      {reason && <small>{reason}</small>}
                      {draft.transport === transport && <span className="selection-label">선택됨</span>}
                    </label>
                  )
                })}
              </div>
            </fieldset>
            <fieldset className="option-fieldset">
              <legend>식사</legend>
              <div className="choice-grid">
                {(Object.keys(mealLabels) as TravelMeal[]).map((meal) => (
                  <label key={meal} className={`choice-card ${draft.meal === meal ? 'selected' : ''}`}>
                    <input type="radio" name="meal" checked={draft.meal === meal} onChange={() => update({ meal })} />
                    <strong>{mealLabels[meal]}</strong>
                    {draft.meal === meal && <span className="selection-label">선택됨</span>}
                  </label>
                ))}
              </div>
            </fieldset>
          </section>

          <section className="surface-card">
            <h2>추가 옵션</h2>
            <div className="choice-grid">
              <label className={`choice-card ${draft.champagneQuantity > 0 || champagneIncluded ? 'selected' : ''}`}>
                <strong>샴페인</strong>
                <small>{champagneIncluded ? '프리미엄 기본 포함 · 추가금 0원' : champagneOption ? `+ ${formatPrice(champagneOption.price)}원 / 예약` : '+ 50,000원 / 1인'}</small>
                <input aria-label="샴페인 수량" type="number" min="0" max="100" step="1" value={draft.champagneQuantity} disabled={champagneIncluded || (tour.source === 'api' && !champagneOption)} onChange={(event) => update({ champagneQuantity: Number(event.target.value) })} />
                {(draft.champagneQuantity > 0 || champagneIncluded) && <span className="selection-label">{champagneIncluded ? '기본 제공' : `${draft.champagneQuantity}개 선택`}</span>}
              </label>
              <label className={`choice-card ${draft.coffeeQuantity > 0 ? 'selected' : ''}`}>
                <strong>커피</strong>
                <small>{coffeeOption ? `+ ${formatPrice(coffeeOption.price)}원 / 예약` : '+ 10,000원 / 1인'}</small>
                <input aria-label="커피 수량" type="number" min="0" max="100" step="1" value={draft.coffeeQuantity} disabled={tour.source === 'api' && !coffeeOption} onChange={(event) => update({ coffeeQuantity: Number(event.target.value) })} />
                {draft.coffeeQuantity > 0 && <span className="selection-label">{draft.coffeeQuantity}개 선택</span>}
              </label>
            </div>
            <p className="muted">수량은 0~100개에서 선택하며 예약 전체 기준으로 계산됩니다.</p>
          </section>
        </div>

        <aside className="flow-summary surface-card" aria-labelledby="configuration-summary">
          <p className="eyebrow">선택한 여행</p>
          <h2 id="configuration-summary">{tour.title}</h2>
          <dl className="summary-details">
            <div><dt>일정</dt><dd>{draft.date || '출발일 선택 전'} · {tour.duration}</dd></div>
            <div><dt>인원 / 등급</dt><dd>{draft.travelers}명 · {gradeLabels[draft.grade]}</dd></div>
            <div><dt>호텔</dt><dd>{hotelLabels[draft.hotel]}{draft.hotel !== defaults.hotel ? ' · 변경' : ' · 기본'}</dd></div>
            <div><dt>교통</dt><dd>{getTransportDescription(tour, draft)}{draft.transport !== defaults.transport ? ' · 변경' : ' · 기본'}</dd></div>
            <div><dt>식사</dt><dd>{mealLabels[draft.meal]}{draft.meal !== defaults.meal ? ' · 변경' : ' · 기본'}</dd></div>
            <div><dt>추가 구성</dt><dd>{[champagneIncluded ? '샴페인 기본 포함' : draft.champagneQuantity ? `샴페인 ${draft.champagneQuantity}개` : '', draft.coffeeQuantity ? `커피 ${draft.coffeeQuantity}개` : ''].filter(Boolean).join(' · ') || '선택 없음'}</dd></div>
          </dl>
          {tour.source === 'api' ? <div className="price-breakdown" aria-live="polite" aria-atomic="true">
            {quoteLoading ? <p className="muted">가격을 계산하는 중입니다.</p> : quoteError ? <p className="field-error" role="alert">{quoteError}</p> : quote && <>
              <div><span>기본 금액</span><strong>{formatPrice(quote.basePrice)}원</strong></div>
              <div><span>옵션 금액</span><strong>{formatPrice(quote.optionPrice)}원</strong></div>
              <div><span>단골 할인</span><strong>{quote.discountRate}%</strong></div>
              <div className="price-total"><span>결제 예정 금액</span><strong>{formatPrice(quote.expectedPaymentAmount)}원</strong></div>
            </>}
          </div> : <div className="price-breakdown" aria-live="polite" aria-atomic="true">
            <div><span>등급 기본 금액 · {draft.travelers}명</span><strong>{formatPrice(estimate.base)}원</strong></div>
            <div><span>옵션 변경·추가</span><strong>{estimate.options > 0 ? '+' : estimate.options < 0 ? '−' : ''}{formatPrice(Math.abs(estimate.options))}원</strong></div>
            <div className="price-total"><span>예상 합계</span><strong>{formatPrice(estimate.total)}원</strong></div>
            <p className="muted">1인 {formatPrice(estimate.perPerson)}원 · 할인 적용 전</p>
          </div>}
          <div className="action-row">
            <button className="button primary" type="submit" disabled={tour.source === 'api' && (!quote || quoteLoading || Boolean(quoteError))}>신청 내용 확인하기</button>
            <button className="button secondary" type="button" disabled={tour.source === 'api' && (!quote || quoteLoading || Boolean(quoteError))} onClick={onCartToggle}>{inCart ? '장바구니에서 빼기' : '장바구니 담기'}</button>
            <button className="button secondary" type="button" onClick={onSave}>구성 저장하기</button>
          </div>
          <p className="muted">선택 내용은 이 브라우저에 자동 저장됩니다.</p>
          <details className="included-details">
            <summary>테마 기본 제공 사항</summary>
            <ul>{themeBenefits[tour.theme].map((benefit) => <li key={benefit}>{benefit}</li>)}</ul>
          </details>
          {tour.source !== 'api' && <p className="notice">예시 상품입니다. 실제 신청·결제는 진행되지 않습니다.</p>}
        </aside>
        <div className="mobile-configure-bar" aria-label="예상 금액과 다음 단계">
          <div><small>{draft.travelers}명 · {gradeLabels[draft.grade]} · {tour.source === 'api' ? '결제 예정 금액' : '예상 합계'}</small><strong>{formatPrice(quote?.expectedPaymentAmount ?? estimate.total)}원</strong></div>
          <button className="button primary" type="submit" disabled={tour.source === 'api' && (!quote || quoteLoading || Boolean(quoteError))}>다음 단계</button>
        </div>
      </form>
    </>
  )
}
