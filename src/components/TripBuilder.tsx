import { useEffect, useRef, useState } from 'react'
import type { Tour, TravelDraft } from '../types/travel'
import { formatPrice } from '../data/travel'
import { Icon } from './Icon'

const options = {
  grade: [
    { label: '스탠다드', extra: 0 },
    { label: '프리미엄', extra: 300000 },
  ],
  hotel: [
    { label: '편안한 4성급', extra: 0 },
    { label: '특별한 5성급', extra: 400000 },
  ],
  transport: [
    { label: '함께 이동', extra: 0 },
    { label: '우리만의 전용 차량', extra: 200000 },
  ],
  meal: [
    { label: '조식 포함', extra: 0 },
    { label: '전 일정 식사 포함', extra: 150000 },
  ],
}
const labels = {
  grade: '투어 등급',
  hotel: '호텔',
  transport: '교통',
  meal: '식사',
}

export function TripBuilder({
  tour,
  initial,
  onClose,
  onSave,
}: {
  tour: Tour
  initial?: TravelDraft
  onClose: () => void
  onSave: (draft: TravelDraft) => boolean
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [selection, setSelection] = useState<TravelDraft>(
    () =>
      initial ?? {
        tourId: tour.id,
        grade: options.grade[0].label,
        hotel: options.hotel[0].label,
        transport: options.transport[0].label,
        meal: options.meal[0].label,
      },
  )
  const [saved, setSaved] = useState(false)
  const [persisted, setPersisted] = useState(true)
  useEffect(() => {
    const element = dialog.current!
    const previous = document.activeElement as HTMLElement | null
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    element.showModal()
    return () => {
      element.close()
      document.body.style.overflow = oldOverflow
      previous?.focus()
    }
  }, [])
  const total =
    tour.price +
    (Object.keys(options) as (keyof typeof options)[]).reduce(
      (sum, key) =>
        sum +
        (options[key].find((option) => option.label === selection[key])
          ?.extra ?? 0),
      0,
    )
  return (
    <dialog
      ref={dialog}
      className="builder"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      aria-labelledby="builder-title"
    >
      <div
        className="builder-cover"
        style={{ backgroundImage: `url('${tour.image}')` }}
      >
        <button
          className="save-button"
          onClick={onClose}
          aria-label="여행 구성 닫기"
        >
          <Icon name="close" />
        </button>
        <span className="photo-tag">MAKE IT YOURS</span>
      </div>
      <div className="builder-body">
        <p className="eyebrow">YOUR PERSONAL JOURNEY</p>
        <h2 id="builder-title">{tour.title}</h2>
        <p className="builder-intro">
          머무는 곳부터 한 끼까지, 내 취향대로 골라보세요.
        </p>
        <div className="builder-options">
          {(Object.keys(options) as (keyof typeof options)[]).map((key) => (
            <fieldset key={key}>
              <legend>{labels[key]}</legend>
              {options[key].map((option) => (
                <label
                  key={option.label}
                  className={selection[key] === option.label ? 'selected' : ''}
                >
                  <input
                    type="radio"
                    name={key}
                    value={option.label}
                    checked={selection[key] === option.label}
                    onChange={() => {
                      setSelection({ ...selection, [key]: option.label })
                      setSaved(false)
                    }}
                  />
                  <span>{option.label}</span>
                  <small>
                    {option.extra === 0
                      ? '기본'
                      : `+ ₩${formatPrice(option.extra)}`}
                  </small>
                </label>
              ))}
            </fieldset>
          ))}
        </div>
        <div className="builder-total">
          <span>
            1인 예상 금액<strong>₩{formatPrice(total)}</strong>
          </span>
          <button
            className="button primary"
            onClick={() => {
              setPersisted(onSave(selection))
              setSaved(true)
            }}
          >
            <Icon name={saved ? 'check' : 'heart'} />
            {saved ? '저장했어요' : '내 여행으로 저장'}
          </button>
        </div>
        <p className="demo-note" role="status">
          {saved
            ? persisted
              ? '이 브라우저에 저장했어요. 상단 ‘내 여행’에서 다시 볼 수 있어요.'
              : '현재 화면에만 저장했어요. 브라우저 저장 공간을 사용할 수 없어 새로고침하면 사라집니다.'
            : '초안 미리보기 · 샘플 상품과 가격이며, 실제 예약이나 결제는 진행되지 않아요.'}
        </p>
      </div>
    </dialog>
  )
}
