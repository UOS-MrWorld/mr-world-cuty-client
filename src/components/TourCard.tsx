import type { Tour } from '../types/travel'
import { formatPrice } from '../data/travel'
import { Icon } from './Icon'

export function TourCard({
  tour,
  saved,
  onSave,
  onOpen,
}: {
  tour: Tour
  saved: boolean
  onSave: () => void
  onOpen: () => void
}) {
  return (
    <article className="tour-card">
      <div className="tour-photo">
        <button
          className="photo-button"
          onClick={onOpen}
          aria-label={`${tour.title} 여행 구성하기`}
        >
          <img src={tour.image} alt={tour.imageAlt} loading="lazy" />
        </button>
        <span className="photo-tag">{tour.tag}</span>
        <button
          className={`save-button ${saved ? 'saved' : ''}`}
          onClick={onSave}
          aria-pressed={saved}
          aria-label={`${tour.title} 찜 ${saved ? '해제' : '하기'}`}
        >
          <Icon name="heart" size={19} />
        </button>
      </div>
      <p className="location">
        <Icon name="pin" size={13} />
        {tour.location}
        <span>{tour.duration}</span>
      </p>
      <button className="tour-title" onClick={onOpen}>
        {tour.title}
        <Icon name="arrow" size={18} />
      </button>
      <p className="tour-description">{tour.description}</p>
      <p className="price">
        <strong>₩{formatPrice(tour.price)}</strong>
        <span>부터 / 1인</span>
      </p>
    </article>
  )
}
