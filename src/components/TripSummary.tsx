import type { ReactNode } from 'react'
import type { Tour, TravelDraft } from '../types/travel'
import {
  getEstimate,
  getTransportDescription,
  gradeLabels,
  hotelLabels,
  mealLabels,
} from '../data/configuration'
import { formatPrice } from '../data/travel'

export function TripSummary({
  tour,
  draft,
  children,
}: {
  tour: Tour
  draft: TravelDraft
  children?: ReactNode
}) {
  const estimate = getEstimate(tour, draft)
  const selectedDate = draft.date
    ? draft.date.split('-').join('.')
    : '미선택'

  return (
    <aside className="flow-summary surface-card" aria-label="선택한 여행과 예상 금액">
      <h2 className="section-title">선택 상품</h2>
      <div className="summary-product">
        <img src={tour.image} alt={tour.imageAlt} />
        <div>
          <p className="muted">{tour.location}</p>
          <h3>{tour.title}</h3>
          <p className="muted">{tour.duration}</p>
        </div>
      </div>

      <dl className="detail-facts">
        <div><dt>출발일</dt><dd>{selectedDate}</dd></div>
        <div><dt>여행 인원</dt><dd>{draft.travelers}명</dd></div>
        <div><dt>투어 등급</dt><dd>{gradeLabels[draft.grade]}</dd></div>
        <div><dt>호텔</dt><dd>{hotelLabels[draft.hotel]}</dd></div>
        <div><dt>교통</dt><dd>{getTransportDescription(tour, draft)}</dd></div>
        <div><dt>식사</dt><dd>{mealLabels[draft.meal]}</dd></div>
        <div>
          <dt>샴페인</dt>
          <dd>{draft.grade === 'premium' ? '기본 포함' : draft.champagne ? '추가 선택' : '선택 안 함'}</dd>
        </div>
        <div><dt>커피</dt><dd>{draft.coffee ? '추가 선택' : '선택 안 함'}</dd></div>
      </dl>

      <dl className="price-breakdown">
        <div><dt>등급 기본 금액 · {draft.travelers}명</dt><dd>{formatPrice(estimate.base)}원</dd></div>
        <div>
          <dt>옵션 변경·추가</dt>
          <dd>{estimate.options === 0 ? '' : estimate.options < 0 ? '−' : '+'}{formatPrice(Math.abs(estimate.options))}원</dd>
        </div>
        <div><dt>단골 할인</dt><dd>정책 확인 전 · 미적용</dd></div>
      </dl>
      <div className="summary-total" aria-live="polite" aria-atomic="true">
        <span>예상 총액</span>
        <strong>{formatPrice(estimate.total)}원</strong>
      </div>
      <p className="summary-note muted">1인 {formatPrice(estimate.perPerson)}원 · 예시 금액</p>
      {children}
    </aside>
  )
}
