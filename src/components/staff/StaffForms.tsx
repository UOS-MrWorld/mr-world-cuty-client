import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { AppLink } from '../AppLink'
import { formatPrice, tours } from '../../data/travel'
import { themeLabels } from '../../data/catalogue'
import { gradeLabels, hotelLabels, mealLabels, themeBenefits, transportLabels } from '../../data/configuration'
import { createStaffProduct, staffOptionLabels } from '../../data/staff'
import { validateInventoryQuantity, validateStaffContact, validateStaffProduct } from '../../data/staffValidation'
import type { StaffCustomer, StaffFeedback, StaffInventoryItem, StaffOptionId, StaffProduct } from '../../types/staff'
import type { Tour, TravelGrade } from '../../types/travel'

const themeEntries = Object.entries(themeLabels).filter(([id]) => id !== 'all')
const gradeOrder: TravelGrade[] = ['classic', 'grand', 'premium']

type Errors = Record<string, string>

function useDirtyReport(dirty: boolean, onDirtyChange: (value: boolean) => void) {
  useEffect(() => {
    onDirtyChange(dirty)
    return () => onDirtyChange(false)
  }, [dirty, onDirtyChange])
}

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return <label className={`staff-field${error ? ' has-error' : ''}`}>
    <span>{label}</span>{children}
    {error ? <small className="staff-field-error" role="alert">{error}</small> : hint ? <small>{hint}</small> : null}
  </label>
}

function Feedback({ value }: { value: StaffFeedback | null }) {
  return value && <p className={`staff-message ${value.kind}`} role={value.kind === 'error' ? 'alert' : 'status'}>{value.message}</p>
}

function FormActions({ failed, onFail, dirty }: { failed: boolean; onFail: () => void; dirty: boolean }) {
  return <div className="staff-form-actions">
    <button className="staff-button primary" type="submit">{failed ? '다시 초안에 적용' : '초안에 적용'}</button>
    <button className="staff-button soft" type="button" onClick={onFail}>실패 상태 미리보기</button>
    <span>{dirty ? '적용하지 않은 변경 내용이 있습니다.' : '현재 화면에서만 보관하는 초안입니다.'}</span>
  </div>
}

function focusFirstError(form: HTMLFormElement, errors: Errors) {
  const first = Object.keys(errors)[0]
  if (first) form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus()
}

function failedPreview(): StaffFeedback {
  return { kind: 'error', message: '적용 실패 상태의 화면 예시입니다. 입력 내용은 그대로 두었으며 목록에는 반영하지 않았습니다. 다시 초안에 적용할 수 있습니다. 실제 서버 요청은 하지 않습니다.' }
}

export function ProductEditor({ product, onApply, onDirtyChange }: {
  product?: StaffProduct
  onApply: (value: StaffProduct) => void
  onDirtyChange: (value: boolean) => void
}) {
  const [initial] = useState(() => product ?? { ...createStaffProduct(tours[0]), id: `preview-${Date.now()}`, title: '', location: '', description: '', duration: '', departureDates: '' })
  const [value, setValue] = useState(initial)
  const [errors, setErrors] = useState<Errors>({})
  const [feedback, setFeedback] = useState<StaffFeedback | null>(null)
  const dirty = JSON.stringify(initial) !== JSON.stringify(value)
  useDirtyReport(dirty, onDirtyChange)
  const restricted = value.theme === 'romance' || value.theme === 'healing'
  const minimumIndex = gradeOrder.indexOf(value.minimumGrade)

  function update<K extends keyof StaffProduct>(key: K, next: StaffProduct[K]) {
    setValue(current => ({ ...current, [key]: next }))
    setErrors(current => ({ ...current, [key]: '' }))
  }

  function changeTheme(theme: Tour['theme']) {
    const defaults = createStaffProduct({ ...value, theme })
    setValue(current => ({ ...current, theme, grades: defaults.grades, minimumGrade: defaults.minimumGrade, maximumPeople: defaults.maximumPeople, supplies: themeBenefits[theme].join('\n'), limitations: defaults.limitations, minimumDeparturePeople: defaults.minimumDeparturePeople, options: defaults.options }))
    setFeedback({ kind: 'success', message: '선택한 테마의 등급·차량·제공 물품·선택 제한을 기본값으로 바꿨습니다. 상품명·여행지·일정은 유지했습니다. 아직 목록에 적용하지 않았습니다.' })
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = validateStaffProduct(value)
    const dates = value.departureDates.split(/\n|,/).map(date => date.trim()).filter(Boolean)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) { focusFirstError(event.currentTarget, nextErrors); return }
    onDirtyChange(false)
    onApply({ ...value, title: value.title.trim(), location: value.location.trim(), duration: value.duration.trim(), departureDates: [...new Set(dates)].join('\n'), imageAlt: `${value.title.trim()} 참고 사진` })
  }

  return <>
    <div className="staff-page-heading"><div><p className="staff-kicker">상품 관리 / {product ? '상품 수정' : '상품 등록'}</p><h1>{product ? '상품 수정' : '새 상품 등록'}</h1><p>고객에게 보여 줄 여행의 구성과 선택 조건을 정리합니다.</p></div><AppLink className="staff-button soft" href="/staff/tours">목록으로</AppLink></div>
    <form className="staff-editor" onSubmit={submit} noValidate>
      <section className="staff-sheet"><div className="staff-section-heading"><h2>여행의 기본 정보</h2><span>고객 상품 화면에 표시할 내용</span></div><div className="staff-fields two">
        <Field label="상품명 · 필수" error={errors.title}><input name="title" value={value.title} onChange={e => update('title', e.target.value)} autoComplete="off" aria-invalid={!!errors.title} /></Field>
        <Field label="여행 테마" hint="테마 변경 시 기본 구성·물품·선택 제한을 초기화합니다."><select value={value.theme} onChange={e => changeTheme(e.target.value as Tour['theme'])}>{themeEntries.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></Field>
        <Field label="여행지 · 필수" error={errors.location}><input name="location" value={value.location} onChange={e => update('location', e.target.value)} placeholder="예: 일본 · 교토" aria-invalid={!!errors.location} /></Field>
        <Field label="여행 기간 · 필수" error={errors.duration}><input name="duration" value={value.duration} onChange={e => update('duration', e.target.value)} placeholder="예: 3박 4일" aria-invalid={!!errors.duration} /></Field>
        <Field label="1인 기본 가격 · 원" error={errors.price} hint="선택 가능한 가장 낮은 등급의 표시 가격 예시입니다."><input name="price" type="number" min="1" step="1" value={value.price} onChange={e => { const price = Number(e.target.value); setValue(current => ({ ...current, price, grades: current.grades.map(grade => grade.id === current.minimumGrade ? { ...grade, price } : grade) })); setErrors(current => ({ ...current, price: '' })) }} aria-invalid={!!errors.price} /></Field>
        <Field label="운영 상태" hint="실제 판매 상태를 변경하지 않는 화면 예시입니다."><select value={value.state} onChange={e => update('state', e.target.value as StaffProduct['state'])}><option value="draft">초안</option><option value="preview">판매 화면 예시</option><option value="paused">운영 중지 예시</option></select></Field>
      </div><Field label="상품 소개"><textarea value={value.description} onChange={e => update('description', e.target.value)} rows={3} /></Field></section>

      <section className="staff-sheet"><div className="staff-section-heading"><h2>출발 일정과 인원</h2><span>차량 좌석 수와 상품 정원을 구분합니다.</span></div><div className="staff-fields two">
        <Field label="출발일 목록" error={errors.departureDates} hint="YYYY-MM-DD 형식으로 한 줄에 하나씩. 실제 예약 가능일과 연동 전입니다."><textarea name="departureDates" value={value.departureDates} onChange={e => update('departureDates', e.target.value)} rows={3} placeholder={'2026-11-20\n2026-12-05'} aria-invalid={!!errors.departureDates} /></Field>
        <div className="staff-fields"><Field label={value.theme === 'romance' ? '신청 가능 최대 인원 · 커플 단위' : '상품 정원 · 명'} error={errors.maximumPeople} hint={value.theme === 'romance' ? '2~10명 중 짝수로 설정합니다. 커플마다 2인 차량이 제공되며, 출발은 최소 2커플의 결제 완료 인원이 기준입니다.' : '10인승은 차량 좌석 수입니다. 상품 정원과 같은 뜻으로 사용하지 않습니다.'}><input name="maximumPeople" type="number" min={value.theme === 'romance' ? 2 : 1} max={value.theme === 'romance' ? 10 : undefined} step={value.theme === 'romance' ? 2 : 1} value={value.maximumPeople} onChange={e => update('maximumPeople', Number(e.target.value))} aria-invalid={!!errors.maximumPeople} /></Field><Field label="최소 출발 기준 인원 · 명" error={errors.minimumDeparturePeople} hint="동일 상품·동일 출발일의 결제 완료 인원을 합산합니다. 허니문은 최소 2커플(4명), 다른 테마는 최소 3명입니다."><input name="minimumDeparturePeople" type="number" min="1" step="1" value={value.minimumDeparturePeople} onChange={e => update('minimumDeparturePeople', e.target.value)} placeholder={value.theme === 'romance' ? '4' : '3'} aria-invalid={!!errors.minimumDeparturePeople} /></Field></div>
      </div></section>

      <section className="staff-sheet"><div className="staff-section-heading"><h2>등급별 기본 구성</h2><span>등급 가격과 기본 포함 사항을 개별 편집합니다.</span></div><Field label="최소 선택 등급" error={errors.minimumGrade} hint={restricted ? '허니문·효도 테마는 그랜드 이상만 선택할 수 있습니다.' : '최소 등급보다 낮은 등급은 고객 선택에서 제외됩니다.'}><select name="minimumGrade" value={value.minimumGrade} onChange={e => { const minimumGrade = e.target.value as TravelGrade; setValue(current => ({ ...current, minimumGrade, price: current.grades.find(grade => grade.id === minimumGrade)?.price ?? current.price })) }}>{gradeOrder.map(id => <option key={id} value={id} disabled={restricted && id === 'classic'}>{gradeLabels[id]}</option>)}</select></Field>
        <div className="staff-grade-grid">{value.grades.map((grade, index) => <article className={`staff-grade-card${index < minimumIndex ? ' unavailable' : ''}`} key={grade.id}><div className="staff-grade-heading"><h3>{gradeLabels[grade.id]}</h3><span>{index < minimumIndex ? '고객 선택 불가' : '선택 가능'}</span></div><div className="staff-fields">
          <Field label="1인 등급 가격 · 원" error={errors[`grade-${grade.id}`]}><input name={`grade-${grade.id}`} type="number" min="1" step="1" value={grade.price} onChange={e => setValue(current => ({ ...current, price: current.minimumGrade === grade.id ? Number(e.target.value) : current.price, grades: current.grades.map(item => item.id === grade.id ? { ...item, price: Number(e.target.value) } : item) }))} aria-invalid={!!errors[`grade-${grade.id}`]} /></Field>
          <Field label="기본 호텔"><select value={grade.hotel} onChange={e => update('grades', value.grades.map(item => item.id === grade.id ? { ...item, hotel: e.target.value as typeof grade.hotel } : item))}>{Object.entries(hotelLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></Field>
          <Field label={value.theme === 'romance' ? '기본 교통 · 커플별' : '기본 교통'}><select value={grade.transport} disabled={value.theme === 'romance'} onChange={e => update('grades', value.grades.map(item => item.id === grade.id ? { ...item, transport: e.target.value as typeof grade.transport } : item))}>{Object.entries(transportLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></Field>
          <Field label="기본 식사"><select value={grade.meal} onChange={e => update('grades', value.grades.map(item => item.id === grade.id ? { ...item, meal: e.target.value as typeof grade.meal } : item))}>{Object.entries(mealLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></Field>
          <Field label="샴페인 기본 제공" hint={grade.id === 'premium' ? '프리미엄은 샴페인이 기본 포함됩니다.' : undefined}><select disabled={grade.id === 'premium'} value={String(grade.champagneIncluded)} onChange={e => update('grades', value.grades.map(item => item.id === grade.id ? { ...item, champagneIncluded: e.target.value === 'true' } : item))}><option value="false">별도 선택</option><option value="true">기본 포함 · 추가 과금 없음</option></select></Field>
        </div>{index < minimumIndex && <p className="staff-small-note">현재 테마·최소 등급 조건에 따라 고객에게 선택 불가 사유를 표시합니다.</p>}</article>)}</div>
      </section>

      <section className="staff-sheet"><div className="staff-section-heading"><h2>변경 가능한 옵션</h2><span>기본 제공과 추가 선택을 분리합니다.</span></div><p className="staff-small-note">호텔·교통·식사는 선택 조합별 차액 정책과 서버 계산이 필요합니다. 아래 금액은 옵션 설정 화면 예시이며 실제 고객 가격 계산에는 반영하지 않습니다.</p><div className="staff-option-grid">{Object.entries(value.options).map(([rawId, rule]) => {
        const id = rawId as StaffOptionId
        const change = (next: Partial<typeof rule>) => update('options', { ...value.options, [id]: { ...rule, ...next } })
        return <article className="staff-option-card" key={id}><h3>{staffOptionLabels[id]}</h3><div className="staff-fields two"><Field label="선택 허용"><select value={String(rule.enabled)} disabled={id === 'transport' && value.theme === 'romance'} onChange={e => change({ enabled: e.target.value === 'true' })}><option value="true">허용</option><option value="false">제한</option></select></Field><Field label="과금 단위"><select value={rule.unit} onChange={e => change({ unit: e.target.value as typeof rule.unit })}><option value="person">1인 기준</option><option value="booking">신청 건 기준</option></select></Field><Field label="추가금·차감액 · 원" error={errors[`option-${id}`]}><input name={`option-${id}`} type="number" step="1" value={rule.adjustment} onChange={e => change({ adjustment: Number(e.target.value) })} aria-invalid={!!errors[`option-${id}`]} /></Field><Field label={rule.enabled ? '선택 안내' : '선택 불가 이유 · 필수'} error={errors[`reason-${id}`]}><input name={`reason-${id}`} value={rule.reason} onChange={e => change({ reason: e.target.value })} aria-invalid={!!errors[`reason-${id}`]} /></Field></div>{id === 'champagne' && <p className="staff-small-note">등급의 샴페인 기본 제공이 켜져 있으면 추가 옵션은 중복 과금하지 않습니다.</p>}</article>
      })}</div></section>

      <section className="staff-sheet"><div className="staff-section-heading"><h2>제공 물품과 선택 제한</h2><span>고객 안내와 준비 물품의 기준</span></div><div className="staff-fields two"><Field label="물품·서비스 목록" hint="한 줄에 하나씩 입력합니다. 실제 재고 차감은 연결 전입니다."><textarea value={value.supplies} onChange={e => update('supplies', e.target.value)} rows={4} /></Field><Field label="테마·등급·인원 제한 안내"><textarea value={value.limitations} onChange={e => update('limitations', e.target.value)} rows={4} /></Field></div></section>
      <div className="staff-policy-card"><h2>수정 내용은 다음 신청부터</h2><p>화면 설계에서는 이미 신청한 여행의 상품·구성·가격을 신청 당시 내용으로 유지하고, 수정 내용은 이후 새 신청에 적용합니다. 실제 신청 데이터와 서버 반영은 연결 전입니다.</p><p>지금 적용하는 내용은 이 직원 미리보기 목록에서만 유지됩니다. 고객 상품 목록과 실제 예약은 변경되지 않습니다.</p></div>
      <Feedback value={feedback} /><FormActions dirty={dirty} failed={feedback?.kind === 'error'} onFail={() => setFeedback(failedPreview())} />
    </form>
  </>
}

export function InventoryForm({ item, onApply, onDirtyChange }: {
  item?: StaffInventoryItem
  onApply: (value: StaffInventoryItem, previous: number) => void
  onDirtyChange: (value: boolean) => void
}) {
  const [value, setValue] = useState({ name: item?.name ?? '', kind: item?.kind ?? '기념품', theme: item?.theme ?? 'romance' as Tour['theme'], mode: 'incoming', amount: '' })
  const [initial] = useState(value)
  const [errors, setErrors] = useState<Errors>({})
  const [feedback, setFeedback] = useState<StaffFeedback | null>(null)
  const dirty = JSON.stringify(value) !== JSON.stringify(initial)
  useDirtyReport(dirty, onDirtyChange)
  const nextQuantity = validateInventoryQuantity(value.amount, item?.quantity ?? 0, value.mode as 'incoming' | 'replace')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: Errors = {}
    if (!value.name.trim()) nextErrors.name = '물품명을 입력해 주세요.'
    if (!value.kind.trim()) nextErrors.kind = '물품 종류를 입력해 주세요.'
    if (nextQuantity === null) nextErrors.amount = '수량은 0 이상의 정수로 입력해 주세요.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) { focusFirstError(event.currentTarget, nextErrors); return }
    onDirtyChange(false)
    onApply({ id: item?.id ?? Date.now(), name: value.name.trim(), kind: value.kind.trim(), theme: value.theme, quantity: nextQuantity! }, item?.quantity ?? 0)
  }
  return <form className="staff-panel-form" onSubmit={submit} noValidate><p className="staff-panel-intro">{item ? '기존 물품은 입고 수량을 더하거나 현재 수량을 직접 수정합니다.' : '새 물품의 종류와 초기 수량을 등록합니다.'}</p><div className="staff-fields two"><Field label="물품명 · 필수" error={errors.name}><input name="name" value={value.name} onChange={e => setValue(current => ({ ...current, name: e.target.value }))} readOnly={!!item} aria-invalid={!!errors.name} /></Field><Field label="물품 종류 · 필수" error={errors.kind}><input name="kind" value={value.kind} onChange={e => setValue(current => ({ ...current, kind: e.target.value }))} readOnly={!!item} aria-invalid={!!errors.kind} /></Field><Field label="관련 테마"><select value={value.theme} disabled={!!item} onChange={e => setValue(current => ({ ...current, theme: e.target.value as Tour['theme'] }))}>{themeEntries.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></Field>{item && <Field label="수량 변경 방식"><select value={value.mode} onChange={e => setValue(current => ({ ...current, mode: e.target.value }))}><option value="incoming">입고 수량 더하기</option><option value="replace">현재 수량 직접 수정</option></select></Field>}</div><Field label={item ? value.mode === 'incoming' ? '입고 수량 · 개' : '변경 후 수량 · 개' : '초기 수량 · 개'} error={errors.amount} hint="0 이상의 정수로 입력합니다."><input name="amount" type="number" min="0" step="1" value={value.amount} onChange={e => { setValue(current => ({ ...current, amount: e.target.value })); setErrors(current => ({ ...current, amount: '' })) }} aria-invalid={!!errors.amount} /></Field><dl className="staff-quantity-preview" aria-live="polite"><div><dt>변경 전</dt><dd>{item?.quantity ?? 0}<small>개</small></dd></div><div><dt>변경 후</dt><dd>{nextQuantity === null ? '입력 전' : nextQuantity}<small>{nextQuantity === null ? '' : '개'}</small></dd></div></dl><p className="staff-small-note">현재 미리보기의 수량만 바뀝니다. 실제 창고와 서버 재고는 변경되지 않습니다.</p><Feedback value={feedback} /><FormActions dirty={dirty} failed={feedback?.kind === 'error'} onFail={() => setFeedback(failedPreview())} /></form>
}

export function CustomerForm({ customer, onApply, onDirtyChange }: {
  customer?: StaffCustomer
  onApply: (value: StaffCustomer) => void
  onDirtyChange: (value: boolean) => void
}) {
  const [value, setValue] = useState({ name: customer?.name ?? '', address: customer?.address ?? '', contact: customer?.contact ?? '' })
  const [initial] = useState(value)
  const [tab, setTab] = useState<'info' | 'history' | 'loyalty'>('info')
  const [errors, setErrors] = useState<Errors>({})
  const [feedback, setFeedback] = useState<StaffFeedback | null>(null)
  const dirty = JSON.stringify(value) !== JSON.stringify(initial)
  useDirtyReport(dirty, onDirtyChange)
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: Errors = {}
    if (!value.name.trim()) nextErrors.name = '고객 성명을 입력해 주세요.'
    if (!validateStaffContact(value.contact)) nextErrors.contact = '연락처의 숫자와 형식을 확인해 주세요. 예: 010-0000-0000'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) { const form = event.currentTarget; setTab('info'); requestAnimationFrame(() => focusFirstError(form, nextErrors)); return }
    onDirtyChange(false)
    onApply({ id: customer?.id ?? Date.now(), name: value.name.trim(), address: value.address.trim(), contact: value.contact.trim(), history: customer?.history ?? [] })
  }
  return <form className="staff-panel-form" onSubmit={submit} noValidate><p className="staff-panel-intro">현재 화면에서만 편집하는 고객 예시입니다. 실제 개인정보를 입력하지 않아도 화면을 확인할 수 있습니다.</p><div className="staff-panel-tabs" role="tablist" aria-label="고객 상세 정보">{[{ id: 'info', label: '고객 정보' }, { id: 'history', label: '이용 이력' }, { id: 'loyalty', label: '단골 정보' }].map(item => <button key={item.id} id={`staff-customer-${item.id}-tab`} type="button" role="tab" aria-selected={tab === item.id} aria-controls={`staff-customer-${item.id}-panel`} onClick={() => setTab(item.id as typeof tab)} onKeyDown={event => { const ids = ['info', 'history', 'loyalty'] as const; const index = ids.indexOf(tab); const next = event.key === 'ArrowRight' ? ids[(index + 1) % ids.length] : event.key === 'ArrowLeft' ? ids[(index + ids.length - 1) % ids.length] : event.key === 'Home' ? ids[0] : event.key === 'End' ? ids[ids.length - 1] : null; if (next) { event.preventDefault(); setTab(next); document.getElementById(`staff-customer-${next}-tab`)?.focus() } }} tabIndex={tab === item.id ? 0 : -1}>{item.label}</button>)}</div>
    <div id="staff-customer-info-panel" role="tabpanel" aria-labelledby="staff-customer-info-tab" hidden={tab !== 'info'}><div className="staff-fields"><Field label="성명 · 필수" error={errors.name}><input name="name" value={value.name} onChange={e => { setValue(current => ({ ...current, name: e.target.value })); setErrors(current => ({ ...current, name: '' })) }} autoComplete="off" aria-invalid={!!errors.name} /></Field><Field label="주소"><input name="address" value={value.address} onChange={e => setValue(current => ({ ...current, address: e.target.value }))} autoComplete="off" placeholder="입력하지 않아도 됩니다." /></Field><Field label="연락처" error={errors.contact}><input name="contact" type="tel" value={value.contact} onChange={e => { setValue(current => ({ ...current, contact: e.target.value })); setErrors(current => ({ ...current, contact: '' })) }} autoComplete="off" placeholder="010-0000-0000" aria-invalid={!!errors.contact} /></Field></div></div>
    <div id="staff-customer-history-panel" role="tabpanel" aria-labelledby="staff-customer-history-tab" hidden={tab !== 'history'}><p className="staff-small-note">아래 내용은 이용 이력의 배치와 연결을 보여 주는 화면 예시입니다. 실제 신청·결제 데이터가 아닙니다.</p>{customer?.history.length ? customer.history.map((history, index) => <article className="staff-history-item" key={`${history.product}-${index}`}><div><span>{history.state}</span><h3>{history.product}</h3><p>{history.date} · {history.grade}</p></div><strong>{formatPrice(history.price)}원<small>가격 예시</small></strong></article>) : <div className="staff-panel-empty"><h3>표시할 이용 이력이 없습니다</h3><p>신청·결제·여행 완료 이력 API 연결 후 실제 고객 이력을 표시합니다.</p></div>}</div>
    <div id="staff-customer-loyalty-panel" role="tabpanel" aria-labelledby="staff-customer-loyalty-tab" hidden={tab !== 'loyalty'}><dl className="staff-loyalty-facts"><div><dt>단골 등급</dt><dd>산정 정책 확인 전</dd></div><div><dt>할인율</dt><dd>미적용</dd></div><div><dt>등급 산정에 연결할 이력</dt><dd>{customer?.history.length ?? 0}건의 화면 예시</dd></div><div><dt>직원 직접 변경</dt><dd>권한·정책 확인 전</dd></div></dl><p className="staff-small-note">등급 기준·할인율·이전 여행의 범위·직원 수정 권한이 정해지기 전까지 등급을 임의로 지정하지 않습니다. 여행 완료 이력과 자동 계산 결과를 연결해 조회할 수 있도록 구성했습니다.</p></div>
    <p className="staff-small-note">입력 내용은 현재 미리보기의 메모리에만 유지합니다. 서버·브라우저 저장소에는 저장하지 않습니다.</p><Feedback value={feedback} /><FormActions dirty={dirty} failed={feedback?.kind === 'error'} onFail={() => setFeedback(failedPreview())} /></form>
}
