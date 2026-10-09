import { AppLink } from './AppLink'
import { Icon } from './Icon'
import { formatPrice } from '../data/travel'
import { themeLabels } from '../data/catalogue'
import { gradeLabels, minimumGrade, themeBenefits } from '../data/configuration'
import type { Tour } from '../types/travel'

export function TourCard({ tour, inCart, onCartToggle, href = `/tours/${tour.id}` }: {
  tour: Tour
  inCart: boolean
  onCartToggle: () => void
  href?: string
}) {
  return (
    <article className="product-row">
      <div className="product-image">
        <AppLink href={href} aria-label={`${tour.title} 상세 보기`}>
          <img src={tour.image} alt={tour.imageAlt} loading="lazy" />
        </AppLink>
        <button className={`save-button cart-button ${inCart ? 'saved' : ''}`} onClick={onCartToggle}
          aria-pressed={inCart} aria-label={`${tour.title} ${inCart ? '장바구니에서 빼기' : '장바구니에 담기'}`}>
          <Icon name="cart" size={18} />
        </button>
      </div>
      <div className="product-content">
        <p className="product-meta">{tour.location}<span>{themeLabels[tour.theme]}</span></p>
        <h2><AppLink href={href}>{tour.title}</AppLink></h2>
        <p className="product-description">{tour.description}</p>
        <div className="product-tags"><span>{tour.duration}</span><span>{gradeLabels[minimumGrade(tour)]}부터</span><span>{tour.theme === 'romance' ? '커플 단위 신청' : '인원 선택'}</span></div>
        <p className="product-benefits">{themeBenefits[tour.theme].slice(1, 3).join(' · ')}</p>
      </div>
      <div className="product-price">
        <span>1인 기준 · 예시 금액</span>
        <p><strong>{formatPrice(tour.price)}</strong>원~</p>
        <small>등급·옵션에 따라 변경</small>
        <AppLink className="button secondary" href={href}>상품 상세보기 <Icon name="arrow" size={16} /></AppLink>
      </div>
    </article>
  )
}
