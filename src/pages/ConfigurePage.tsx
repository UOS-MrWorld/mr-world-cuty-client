import { useRef, useState } from 'react'
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
import type { HotelGrade, Tour, TravelDraft, TravelGrade, TravelMeal, TravelTransport } from '../types/travel'

function adjustment(value: number) {
  return value === 0 ? '추가금 없음' : `${value > 0 ? '+' : '−'} ${formatPrice(Math.abs(value))}원 / 1인`
}

export function ConfigurePage({ tour, draft, onChange, onContinue, onSave }: {
  tour: Tour
  draft: TravelDraft
  onChange: (draft: TravelDraft) => void
  onContinue: () => void
  onSave: () => void
}) {
  const dateInput = useRef<HTMLInputElement>(null)
  const [dateError, setDateError] = useState(false)
  const [changeNotice, setChangeNotice] = useState('')
  const estimate = getEstimate(tour, draft)
  const defaults = getGradeDefaults(tour, draft.grade)
  const defaultEstimate = getEstimate(tour, { ...draft, ...defaults })

  function update(value: Partial<TravelDraft>) {
    onChange(normalizeDraft(tour, { ...draft, ...value }))
  }

  function difference(value: Partial<TravelDraft>) {
    return getEstimate(tour, { ...draft, ...defaults, ...value }).perPerson - defaultEstimate.perPerson
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
        if (!isOpenTravelDate(draft.date)) {
          setDateError(true)
          dateInput.current?.focus()
          return
        }
        onContinue()
      }}>
        <div className="flow-main">
          <section className="surface-card">
            <h2>출발 희망일·인원</h2>
            <div className="field-grid">
              <div className="field">
                <label htmlFor="travel-date">희망 출발일 <span className="muted">필수</span></label>
                <input ref={dateInput} id="travel-date" type="date" min={getEarliestDepartureDate()} required value={draft.date}
                  aria-invalid={dateError || undefined} aria-describedby={dateError ? 'travel-date-error travel-date-help' : 'travel-date-help'}
                  onInput={(event) => {
                    update({ date: event.currentTarget.value })
                    setDateError(false)
                  }} />
                <small id="travel-date-help" className="muted">출발 7일 전 모집 마감 · 실제 출발 일정은 별도 확인이 필요합니다.</small>
                {dateError && <p className="field-error" id="travel-date-error" role="alert">모집 마감 전인 {getEarliestDepartureDate()} 이후의 출발일을 선택해 주세요.</p>}
              </div>
              <div className="field">
                <label htmlFor="travelers">여행 인원</label>
                <select id="travelers" value={draft.travelers} aria-describedby="travelers-help"
                  onChange={(event) => {
                    const travelers = Number(event.target.value)
                    update({ travelers })
                    setChangeNotice(tour.theme === 'romance' ? `${travelers / 2}커플 · 커플별 전용 차량이 제공됩니다.` : travelers > 2 && draft.transport === 'private' ? '3명 이상 선택 시 10인승 차량이 적용됩니다. 예시 기준입니다.' : '')
                  }}>
                  {(tour.theme === 'romance' ? [2, 4, 6, 8, 10] : Array.from({ length: 10 }, (_, index) => index + 1)).map((count) => <option key={count} value={count}>{count}명{tour.theme === 'romance' ? ` · ${count / 2}커플` : ''}</option>)}
                </select>
                <small className="muted" id="travelers-help">{tour.theme === 'romance' ? '2명 단위 신청 · 전체 모집은 최소 2커플(4명)' : '1~10명 선택 가능 · 출발은 전체 결제 인원 최소 3명'}</small>
              </div>
            </div>
          </section>

          <section className="surface-card">
            <fieldset>
              <legend><h2>여행 등급</h2></legend>
              <p className="muted">등급 변경 시 호텔·교통·식사·음료가 기본 구성으로 초기화됩니다. 희망일과 인원은 유지됩니다.</p>
              <div className="choice-grid grade-choices">
                {(Object.keys(gradeLabels) as TravelGrade[]).map((grade) => {
                  const unavailable = grade === 'classic' && minimumGrade(tour) === 'grand'
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
                      <span>{mealLabels[gradeDefaults[grade].meal]}{grade === 'premium' ? ' · 샴페인 포함' : ''}</span>
                      <small>{unavailable ? '이 테마는 그랜드 이상 선택 가능' : `${formatPrice(price)}원 / 1인`}</small>
                    </label>
                  )
                })}
              </div>
            </fieldset>
            <p className="notice" role="status">{changeNotice || '표시 금액은 예시 가격입니다.'}</p>
          </section>

          <section className="surface-card">
            <h2>호텔·교통·식사</h2>
            <p className="muted">등급 기본 구성 대비 변경 금액이 표시됩니다. 실제 선택 가능 범위와 차액은 확정 전입니다.</p>
            <fieldset className="option-fieldset">
              <legend>호텔</legend>
              <div className="choice-grid">
                {(Object.keys(hotelLabels) as HotelGrade[]).map((hotel) => (
                  <label key={hotel} className={`choice-card ${draft.hotel === hotel ? 'selected' : ''}`}>
                    <input type="radio" name="hotel" checked={draft.hotel === hotel} onChange={() => update({ hotel })} />
                    <strong>{hotelLabels[hotel]}</strong>
                    <small>{hotel === defaults.hotel ? '등급 기본 구성' : adjustment(difference({ hotel }))}</small>
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
                      <small>{reason || (transport === defaults.transport ? '테마 기본 구성' : adjustment(difference({ transport })))}</small>
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
                    <small>{meal === defaults.meal ? '등급 기본 구성' : adjustment(difference({ meal }))}</small>
                    {draft.meal === meal && <span className="selection-label">선택됨</span>}
                  </label>
                ))}
              </div>
            </fieldset>
          </section>

          <section className="surface-card">
            <h2>추가 옵션</h2>
            <div className="choice-grid">
              <label className={`choice-card ${draft.champagne || draft.grade === 'premium' ? 'selected' : ''}`}>
                <input type="checkbox" checked={draft.champagne || draft.grade === 'premium'} disabled={draft.grade === 'premium'} onChange={(event) => update({ champagne: event.target.checked })} />
                <strong>샴페인</strong>
                <small>{draft.grade === 'premium' ? '프리미엄 기본 포함 · 추가금 0원' : '+ 50,000원 / 1인'}</small>
                {(draft.champagne || draft.grade === 'premium') && <span className="selection-label">{draft.grade === 'premium' ? '기본 제공' : '선택됨'}</span>}
              </label>
              <label className={`choice-card ${draft.coffee ? 'selected' : ''}`}>
                <input type="checkbox" checked={draft.coffee} onChange={(event) => update({ coffee: event.target.checked })} />
                <strong>커피</strong>
                <small>+ 10,000원 / 1인</small>
                {draft.coffee && <span className="selection-label">선택됨</span>}
              </label>
            </div>
            <p className="muted">예시 기준: 음료 옵션은 1인당 과금됩니다.</p>
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
            <div><dt>추가 구성</dt><dd>{[draft.grade === 'premium' ? '샴페인 기본 포함' : draft.champagne ? '샴페인' : '', draft.coffee ? '커피' : ''].filter(Boolean).join(' · ') || '선택 없음'}</dd></div>
          </dl>
          <div className="price-breakdown" aria-live="polite" aria-atomic="true">
            <div><span>등급 기본 금액 · {draft.travelers}명</span><strong>{formatPrice(estimate.base)}원</strong></div>
            <div><span>옵션 변경·추가</span><strong>{estimate.options > 0 ? '+' : estimate.options < 0 ? '−' : ''}{formatPrice(Math.abs(estimate.options))}원</strong></div>
            <div className="price-total"><span>예상 합계</span><strong>{formatPrice(estimate.total)}원</strong></div>
            <p className="muted">1인 {formatPrice(estimate.perPerson)}원 · 할인 적용 전</p>
          </div>
          <div className="action-row">
            <button className="button primary" type="submit">신청 내용 확인하기</button>
            <button className="button secondary" type="button" onClick={onSave}>구성 저장하기</button>
          </div>
          <p className="muted">선택 내용은 이 브라우저에 자동 저장됩니다.</p>
          <details className="included-details">
            <summary>테마 기본 제공 사항</summary>
            <ul>{themeBenefits[tour.theme].map((benefit) => <li key={benefit}>{benefit}</li>)}</ul>
          </details>
          <p className="notice">예시 상품입니다. 실제 신청·결제는 진행되지 않습니다.</p>
        </aside>
        <div className="mobile-configure-bar" aria-label="예상 금액과 다음 단계">
          <div><small>{draft.travelers}명 · {gradeLabels[draft.grade]} · 예상 합계</small><strong>{formatPrice(estimate.total)}원</strong></div>
          <button className="button primary" type="submit">다음 단계</button>
        </div>
      </form>
    </>
  )
}
