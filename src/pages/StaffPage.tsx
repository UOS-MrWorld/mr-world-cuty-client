import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { createInventory, getInventories, updateInventory } from '../api/inventory'
import { activateLoyaltyDiscountByGrade, getCustomerDetail, getCustomers, getLoyaltyPolicy, updateCustomerLoyaltyGrades } from '../api/customer'
import { createTour, getStaffTour, getStaffTours, updateTour } from '../api/tour'
import { AppLink } from '../components/AppLink'
import { Icon } from '../components/Icon'
import { formatPrice } from '../data/travel'
import { navigate } from '../hooks/useRoute'
import type { ApiBookingStatus, ApiLoyaltyGrade, ApiTheme, ApiTourStatus, ApiTransport } from '../types/api'
import type { CustomerDetailResponse, CustomerSummaryResponse, InventoryResponse, LoyaltyPolicyResponse } from '../types/staffApi'
import type { StaffTourDetailResponse, StaffTourSummaryResponse, TourCreateRequest } from '../types/tourApi'

type Section = 'tours' | 'inventory' | 'customers'
const nav = [
  { href: '/staff/tours', label: '상품 관리' },
  { href: '/staff/inventory', label: '물품·재고 관리' },
  { href: '/staff/customers', label: '고객 관리' },
]
const loyaltyLabels: Record<ApiLoyaltyGrade, string> = { NORMAL: '일반', VIP: 'VIP' }
const themeLabels: Record<ApiTheme, string> = { HONEYMOON: '허니문', HEALING: '효도·힐링', GOLF: '골프', TREKKING: '트레킹' }
const tourStatusLabels: Record<ApiTourStatus, string> = { RECRUITING: '모집 중', CONFIRMED: '출발 확정', COMPLETED: '여행 완료', CANCELLED: '취소됨' }
const bookingStatusLabels: Record<ApiBookingStatus, string> = { PENDING: '결제 전', PAID: '결제 완료', CANCELLED: '취소됨' }

export default function StaffPage({ path }: { path: string }) {
  const section: Section = path.startsWith('/staff/inventory') ? 'inventory' : path.startsWith('/staff/customers') ? 'customers' : 'tours'
  return <div className="staff-workspace">
    <aside className="staff-sidebar">
      <div className="staff-space-title"><p>CUTY</p><h2>여행 운영</h2><span>실제 서버 업무 화면</span></div>
      <nav aria-label="직원 업무">{nav.map(item => <AppLink key={item.href} href={item.href} aria-current={item.href.includes(section) ? 'page' : undefined}><strong>{item.label}</strong></AppLink>)}</nav>
    </aside>
    <div className="staff-content">
      {section === 'tours' ? <ToursSection path={path} /> : section === 'inventory' ? <InventorySection /> : <CustomersSection path={path} />}
    </div>
  </div>
}

function Heading({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="staff-page-heading"><div><p className="staff-kicker">CUTY 직원 업무</p><h1>{title}</h1><p>{description}</p></div>{action}</div>
}

function LoadingState({ error, retry }: { error: string; retry: () => void }) {
  return error
    ? <div className="staff-sheet staff-empty"><h2>정보를 불러오지 못했습니다</h2><p role="alert">{error}</p><button className="staff-button primary" onClick={retry}>다시 시도</button></div>
    : <p className="staff-message" role="status">서버에서 정보를 불러오는 중입니다.</p>
}

function ToursSection({ path }: { path: string }) {
  const editId = path.match(/^\/staff\/tours\/(\d+)\/edit$/)?.[1]
  const detailId = path.match(/^\/staff\/tours\/(\d+)$/)?.[1]
  if (path === '/staff/tours/new' || editId) return <TourEditor tourId={editId ? Number(editId) : undefined} />
  if (detailId) return <TourStatus tourId={Number(detailId)} />

  const [items, setItems] = useState<StaffTourSummaryResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    setLoading(true); setError('')
    void getStaffTours({ page: 0, size: 100 }).then(response => { if (active) setItems(response.data.content) })
      .catch(value => { if (active) setError(value instanceof Error ? value.message : '상품을 불러오지 못했습니다.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [retry])

  return <>
    <Heading title="상품 관리" description="서버에 저장된 여행상품을 등록하고 수정합니다." action={<AppLink className="staff-button primary" href="/staff/tours/new">상품 등록</AppLink>} />
    {loading || error ? <LoadingState error={error} retry={() => setRetry(value => value + 1)} /> : <section className="staff-sheet staff-list-sheet staff-tour-list">
      <div className="staff-toolbar"><span>{items.length}개 상품</span></div>
      <div className="staff-table-scroll" tabIndex={0}><table className="staff-table"><thead><tr><th>상품명</th><th>테마</th><th>출발일</th><th>결제 인원</th><th>상태</th><th>관리</th></tr></thead><tbody>
        {items.map(item => <tr key={item.tourId}><td><strong>{item.tourName}</strong></td><td>{themeLabels[item.theme]}</td><td>{item.startDate}</td><td className="staff-number">{item.paidGuestCount}명</td><td><span className="staff-state">{tourStatusLabels[item.tourStatus]}</span></td><td><div className="staff-row-actions"><AppLink className="staff-text-action" href={`/staff/tours/${item.tourId}`}>현황</AppLink><AppLink className="staff-text-action" href={`/staff/tours/${item.tourId}/edit`}>수정</AppLink></div></td></tr>)}
      </tbody></table></div>
    </section>}
  </>
}

function TourStatus({ tourId }: { tourId: number }) {
  const [data, setData] = useState<StaffTourDetailResponse | null>(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    setError('')
    void getStaffTour(tourId).then(response => { if (active) setData(response.data) })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : '상품 현황을 불러오지 못했습니다.') })
    return () => { active = false }
  }, [retry, tourId])
  if (!data || error) return <LoadingState error={error} retry={() => setRetry(value => value + 1)} />
  return <>
    <Heading title={data.tour.tourName} description="결제 인원, 신청 고객과 제공 물품 현황을 확인합니다." action={<div className="staff-row-actions"><AppLink className="staff-button soft" href="/staff/tours">목록으로</AppLink><AppLink className="staff-button primary" href={`/staff/tours/${tourId}/edit`}>상품 수정</AppLink></div>} />
    <section className="staff-status-overview" aria-label="상품 운영 요약">
      <div><span>상품 상태</span><strong>{tourStatusLabels[data.tour.tourStatus]}</strong></div>
      <div><span>결제 인원</span><strong>{data.paidGuestCount}명</strong></div>
      <div><span>여행 일정</span><strong>{data.tour.startDate} ~ {data.tour.endDate}</strong></div>
      <div><span>1인 기본 가격</span><strong>{formatPrice(data.tour.basePrice)}원</strong></div>
    </section>
    <section className="staff-sheet staff-list-sheet staff-status-section">
      <div className="staff-section-heading"><h2>신청 고객</h2><span>예약 {data.bookings.length}건</span></div>
      <div className="staff-table-scroll" tabIndex={0}><table className="staff-table"><thead><tr><th>예약번호</th><th>고객명</th><th>인원</th><th>예약 상태</th></tr></thead><tbody>
        {data.bookings.map(booking => <tr key={booking.bookingId}><td>#{booking.bookingId}</td><td><strong>{booking.name}</strong><small className="staff-subtext">고객번호 {booking.customerId}</small></td><td>{booking.guestCount}명</td><td><span className="staff-state">{bookingStatusLabels[booking.bookingStatus]}</span></td></tr>)}
        {!data.bookings.length && <tr><td colSpan={4} className="staff-table-empty">신청 고객이 없습니다.</td></tr>}
      </tbody></table></div>
    </section>
    <section className="staff-sheet staff-list-sheet staff-status-section">
      <div className="staff-section-heading"><h2>기념품 구성</h2><span>결제 인원을 기준으로 필요한 재고를 계산합니다.</span></div>
      <div className="staff-table-scroll" tabIndex={0}><table className="staff-table"><thead><tr><th>물품명</th><th>1인 제공 수량</th><th>필요 수량</th><th>현재 재고</th><th>상태</th></tr></thead><tbody>
        {data.gifts.map(gift => { const required = data.paidGuestCount * gift.quantityPerGuest; const enough = gift.currentStock >= required; return <tr key={gift.itemId}><td><strong>{gift.itemName}</strong></td><td>{gift.quantityPerGuest}개</td><td>{required}개</td><td>{gift.currentStock}개</td><td><span className={`staff-state ${enough ? 'preview' : 'paused'}`}>{enough ? '충분' : `${required - gift.currentStock}개 부족`}</span></td></tr> })}
        {!data.gifts.length && <tr><td colSpan={5} className="staff-table-empty">등록된 기념품 구성이 없습니다.</td></tr>}
      </tbody></table></div>
    </section>
  </>
}

function TourEditor({ tourId }: { tourId?: number }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [inventoryItems, setInventoryItems] = useState<InventoryResponse[]>([])
  const [value, setValue] = useState<TourCreateRequest>({
    theme: 'GOLF', tourName: '', description: '', startDate: '', endDate: '',
    basePrice: 0, defaultTransport: 'PREMIUM_VAN_10', gifts: [],
  })
  useEffect(() => {
    let active = true
    const tourRequest = tourId ? getStaffTour(tourId) : Promise.resolve(null)
    void Promise.all([getInventories({ page: 0, size: 100 }), tourRequest]).then(([inventoryResponse, tourResponse]) => {
      if (!active) return
      setInventoryItems(inventoryResponse.data.content)
      if (tourResponse) setValue({
        theme: tourResponse.data.tour.theme, tourName: tourResponse.data.tour.tourName, description: tourResponse.data.tour.description,
        startDate: tourResponse.data.tour.startDate, endDate: tourResponse.data.tour.endDate, basePrice: tourResponse.data.tour.basePrice,
        defaultTransport: tourResponse.data.tour.defaultTransport,
        gifts: tourResponse.data.gifts.map(gift => ({ itemId: gift.itemId, quantityPerGuest: gift.quantityPerGuest })),
      })
    }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : '상품과 재고 정보를 불러오지 못했습니다.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [tourId])
  function updateGift(itemId: number, selected: boolean, quantity = 1) {
    setValue(current => ({
      ...current,
      gifts: selected
        ? [...(current.gifts ?? []).filter(gift => gift.itemId !== itemId), { itemId, quantityPerGuest: Math.max(1, quantity) }]
        : (current.gifts ?? []).filter(gift => gift.itemId !== itemId),
    }))
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!event.currentTarget.reportValidity() || saving) return
    setSaving(true); setError('')
    const request = tourId
      ? updateTour(tourId, {
        tourName: value.tourName, description: value.description, startDate: value.startDate,
        endDate: value.endDate, basePrice: value.basePrice, defaultTransport: value.defaultTransport, gifts: value.gifts,
      })
      : createTour(value)
    void request.then(() => navigate('/staff/tours'))
      .catch(reason => setError(reason instanceof Error ? reason.message : '상품을 저장하지 못했습니다.'))
      .finally(() => setSaving(false))
  }
  if (loading) return <LoadingState error={error} retry={() => window.location.reload()} />
  return <>
    <Heading title={tourId ? '상품 수정' : '상품 등록'} description="입력한 내용은 서버 상품과 고객 화면에 반영됩니다." action={<AppLink className="staff-button soft" href="/staff/tours">목록으로</AppLink>} />
    <form className="staff-sheet staff-editor" onSubmit={submit}>
      <div className="staff-fields two">
        <label className="staff-field"><span>상품명</span><input required value={value.tourName} onChange={e => setValue(current => ({ ...current, tourName: e.target.value }))} /></label>
        <label className="staff-field"><span>테마</span><select disabled={Boolean(tourId)} value={value.theme} onChange={e => setValue(current => ({ ...current, theme: e.target.value as ApiTheme }))}>{Object.entries(themeLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
        <label className="staff-field"><span>출발일</span><input required type="date" value={value.startDate} onChange={e => setValue(current => ({ ...current, startDate: e.target.value }))} /></label>
        <label className="staff-field"><span>종료일</span><input required type="date" min={value.startDate} value={value.endDate} onChange={e => setValue(current => ({ ...current, endDate: e.target.value }))} /></label>
        <label className="staff-field"><span>1인 기본 가격</span><input required min="1" step="1" type="number" value={value.basePrice} onChange={e => setValue(current => ({ ...current, basePrice: Number(e.target.value) }))} /></label>
        <label className="staff-field"><span>기본 교통</span><select value={value.defaultTransport} onChange={e => setValue(current => ({ ...current, defaultTransport: e.target.value as ApiTransport }))}><option value="PREMIUM_CAR_2">2인 전용 차량</option><option value="PREMIUM_VAN_10">10인승 밴</option></select></label>
      </div>
      <label className="staff-field"><span>상품 설명</span><textarea rows={5} value={value.description ?? ''} onChange={e => setValue(current => ({ ...current, description: e.target.value }))} /></label>
      <section className="staff-gift-editor" aria-labelledby="gift-editor-title">
        <div className="staff-section-heading"><div><h2 id="gift-editor-title">기념품 구성</h2><p>여행 완료 시 고객 1명에게 제공할 물품과 수량을 선택하세요.</p></div><span>{value.gifts?.length ?? 0}개 선택</span></div>
        {inventoryItems.length ? <div className="staff-gift-grid">{inventoryItems.map(item => {
          const selected = value.gifts?.find(gift => gift.itemId === item.itemId)
          return <div className={`staff-gift-card ${selected ? 'selected' : ''}`} key={item.itemId}><label><input type="checkbox" checked={Boolean(selected)} onChange={event => updateGift(item.itemId, event.target.checked)} /><span><strong>{item.itemName}</strong><small>현재 재고 {item.quantity}개</small></span></label><label className="staff-gift-quantity"><span>1인 제공 수량</span><input type="number" min="1" step="1" disabled={!selected} value={selected?.quantityPerGuest ?? 1} onChange={event => updateGift(item.itemId, true, Number(event.target.value))} /></label></div>
        })}</div> : <p className="staff-message">먼저 물품·재고 관리에서 기념품을 등록해 주세요.</p>}
      </section>
      {error && <p className="staff-message error" role="alert">{error}</p>}
      <div className="staff-form-actions"><button className="staff-button primary" disabled={saving}>{saving ? '저장 중…' : '서버에 저장'}</button></div>
    </form>
  </>
}

function InventorySection() {
  const [items, setItems] = useState<InventoryResponse[]>([])
  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const [names, setNames] = useState<Record<number, string>>({})
  const [keyword, setKeyword] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [retry, setRetry] = useState(0)
  const focusedShortage = useRef(false)
  useEffect(() => {
    let active = true
    setLoading(true); setError('')
    void getInventories({ page: 0, size: 100, ...(appliedKeyword ? { keyword: appliedKeyword } : {}) }).then(({ data }) => {
      if (!active) return
      setItems(data.content)
      setQuantities(Object.fromEntries(data.content.map(item => [item.itemId, item.quantity])))
      setNames(Object.fromEntries(data.content.map(item => [item.itemId, item.itemName])))
      const first = data.content.find(item => item.quantity < item.requiredQuantity)
      if (first && !focusedShortage.current) {
        focusedShortage.current = true
        window.requestAnimationFrame(() => document.getElementById(`inventory-quantity-${first.itemId}`)?.focus())
      }
    }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : '재고를 불러오지 못했습니다.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [appliedKeyword, retry])
  const shortages = items.filter(item => item.quantity < item.requiredQuantity)
  async function save(item: InventoryResponse) {
    setError(''); setMessage('')
    try {
      await updateInventory(item.itemId, { itemName: names[item.itemId].trim(), quantity: quantities[item.itemId] })
      setMessage(`${names[item.itemId].trim()} 정보를 저장했습니다.`)
      setRetry(value => value + 1)
    } catch (reason) { setError(reason instanceof Error ? reason.message : '수량을 저장하지 못했습니다.') }
  }
  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    if (!form.reportValidity()) return
    const values = new FormData(form)
    try {
      await createInventory({ itemName: String(values.get('itemName')), quantity: Number(values.get('quantity')) })
      form.reset(); setMessage('새 물품을 등록했습니다.'); setRetry(value => value + 1)
    } catch (reason) { setError(reason instanceof Error ? reason.message : '물품을 등록하지 못했습니다.') }
  }
  return <>
    <Heading title="물품·재고 관리" description="부족 재고를 확인하고 현재 수량을 바로 보충합니다." />
    <form className="staff-sheet staff-fields two" onSubmit={register}><label className="staff-field"><span>새 물품명</span><input name="itemName" required /></label><label className="staff-field"><span>초기 수량</span><input name="quantity" type="number" min="0" step="1" required /></label><button className="staff-button primary">물품 등록</button></form>
    {shortages.length > 0 && <p className="staff-message error" role="alert">재고가 부족한 물품이 {shortages.length}개 있습니다. 첫 번째 부족 수량 입력으로 이동했습니다.</p>}
    {message && <p className="staff-message" role="status">{message}</p>}
    {error && !loading && <p className="staff-message error" role="alert">{error}</p>}
    {loading ? <LoadingState error={error} retry={() => setRetry(value => value + 1)} /> : <section className="staff-sheet staff-list-sheet"><form className="staff-toolbar staff-inventory-search" role="search" onSubmit={event => { event.preventDefault(); setAppliedKeyword(keyword.trim()) }}><label className="staff-search"><span className="sr-only">재고 물품 검색</span><input type="search" value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="물품명 검색" /></label><div className="staff-row-actions"><button className="staff-text-action staff-icon-action" type="submit" aria-label="검색" title="검색"><Icon name="search" size={20} /></button>{appliedKeyword && <button className="staff-text-action" type="button" onClick={() => { setKeyword(''); setAppliedKeyword('') }}>초기화</button>}</div></form><div className="staff-table-scroll" tabIndex={0}><table className="staff-table"><thead><tr><th>물품명</th><th>현재 수량</th><th>사용 예정</th><th>상태</th><th>저장</th></tr></thead><tbody>
      {items.map(item => { const shortage = item.quantity < item.requiredQuantity; const changed = quantities[item.itemId] !== item.quantity || names[item.itemId]?.trim() !== item.itemName; return <tr key={item.itemId} className={shortage ? 'inventory-shortage' : ''}><td><input className="staff-inventory-name" aria-label={`${item.itemName} 물품명`} required value={names[item.itemId] ?? ''} onChange={event => setNames(current => ({ ...current, [item.itemId]: event.target.value }))} /></td><td><input id={`inventory-quantity-${item.itemId}`} aria-label={`${item.itemName} 현재 수량`} type="number" min="0" step="1" value={quantities[item.itemId] ?? 0} onChange={event => setQuantities(current => ({ ...current, [item.itemId]: Number(event.target.value) }))} /></td><td>{item.requiredQuantity}개</td><td>{shortage ? <span className="staff-state paused">부족 {item.requiredQuantity - item.quantity}개</span> : <span className="staff-state preview">충분</span>}</td><td><button className="staff-text-action" type="button" onClick={() => void save(item)} disabled={!changed || !names[item.itemId]?.trim()}>변경 저장</button></td></tr> })}
      {!items.length && <tr><td className="staff-table-empty" colSpan={5}>검색된 물품이 없습니다.</td></tr>}
    </tbody></table></div></section>}
  </>
}

function CustomersSection({ path }: { path: string }) {
  const detailId = path.match(/^\/staff\/customers\/(\d+)$/)?.[1]
  if (detailId) return <CustomerDetail customerId={Number(detailId)} />
  const [customers, setCustomers] = useState<CustomerSummaryResponse[]>([])
  const [policies, setPolicies] = useState<LoyaltyPolicyResponse['policies']>([])
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<number[]>([])
  const [gradeEdits, setGradeEdits] = useState<Record<number, ApiLoyaltyGrade>>({})
  const [discountGrade, setDiscountGrade] = useState<ApiLoyaltyGrade>('VIP')
  const [keyword, setKeyword] = useState('')
  const [gradeFilter, setGradeFilter] = useState<'' | ApiLoyaltyGrade>('')
  const [discountFilter, setDiscountFilter] = useState<'' | 'true' | 'false'>('')
  const [filters, setFilters] = useState<{ keyword?: string; loyaltyGrade?: ApiLoyaltyGrade; discountApplied?: boolean }>({})
  const [loading, setLoading] = useState(true)
  const [savingGrades, setSavingGrades] = useState(false)
  const [applyingDiscount, setApplyingDiscount] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    setLoading(true); setError('')
    void Promise.all([getCustomers({ page: 0, size: 100, ...filters }), getLoyaltyPolicy()])
      .then(([customerResponse, policyResponse]) => {
        if (!active) return
        setCustomers(customerResponse.data.content)
        setPolicies(policyResponse.data.policies)
        setGradeEdits(Object.fromEntries(customerResponse.data.content.map(customer => [customer.customerId, customer.loyaltyGrade])))
        setSelectedCustomerIds([])
      })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : '고객 정보를 불러오지 못했습니다.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [filters, retry])
  const sortedPolicies = [...policies].sort((first, second) => first.requiredTourCount - second.requiredTourCount)
  const selectedChanges = customers.flatMap(customer => selectedCustomerIds.includes(customer.customerId) && gradeEdits[customer.customerId] !== customer.loyaltyGrade
    ? [{ customerId: customer.customerId, loyaltyGrade: gradeEdits[customer.customerId] }]
    : [])
  const discountTargets = customers.filter(customer => customer.loyaltyGrade === discountGrade)
  const pendingDiscountCount = discountTargets.filter(customer => !customer.loyaltyDiscountApplied).length
  const allSelected = customers.length > 0 && selectedCustomerIds.length === customers.length

  function toggleCustomer(customerId: number) {
    setSelectedCustomerIds(current => current.includes(customerId) ? current.filter(id => id !== customerId) : [...current, customerId])
  }

  async function saveGradeChanges() {
    if (!selectedChanges.length || savingGrades) return
    setSavingGrades(true); setError(''); setMessage('')
    try {
      const { data } = await updateCustomerLoyaltyGrades({ changes: selectedChanges })
      setMessage(`고객 등급 ${data.updatedCount}건을 변경했습니다.`)
      setRetry(value => value + 1)
    } catch (reason) { setError(reason instanceof Error ? reason.message : '고객 등급을 변경하지 못했습니다.') }
    finally { setSavingGrades(false) }
  }

  async function applyDiscount() {
    if (!pendingDiscountCount || applyingDiscount) return
    setApplyingDiscount(true); setError(''); setMessage('')
    try {
      const { data } = await activateLoyaltyDiscountByGrade(discountGrade)
      setMessage(`${loyaltyLabels[discountGrade]} 등급 할인 적용 완료 · 대상 ${data.targetCount}명, 새 적용 ${data.appliedCount}명, 기존 적용 ${data.skippedCount}명`)
      setRetry(value => value + 1)
    } catch (reason) { setError(reason instanceof Error ? reason.message : '단골 할인을 승인하지 못했습니다.') }
    finally { setApplyingDiscount(false) }
  }
  return <>
    <Heading title="고객 관리" description="고객 등급을 일괄 변경하고 등급별 할인을 적용합니다." />
    {message && <p className="staff-message" role="status">{message}</p>}
    {error && !loading && <p className="staff-message error" role="alert">{error}</p>}
    {loading ? <LoadingState error={error} retry={() => setRetry(value => value + 1)} /> : <>
      <form className="staff-sheet staff-customer-filter" role="search" onSubmit={event => { event.preventDefault(); setFilters({ ...(keyword.trim() ? { keyword: keyword.trim() } : {}), ...(gradeFilter ? { loyaltyGrade: gradeFilter } : {}), ...(discountFilter ? { discountApplied: discountFilter === 'true' } : {}) }) }}>
        <label className="staff-field"><span>이름·아이디 검색</span><input type="search" value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="고객 이름 또는 로그인 아이디" /></label>
        <label className="staff-field"><span>고객 등급</span><select value={gradeFilter} onChange={event => setGradeFilter(event.target.value as '' | ApiLoyaltyGrade)}><option value="">전체 등급</option>{Object.entries(loyaltyLabels).map(([grade, label]) => <option key={grade} value={grade}>{label}</option>)}</select></label>
        <label className="staff-field"><span>할인 상태</span><select value={discountFilter} onChange={event => setDiscountFilter(event.target.value as '' | 'true' | 'false')}><option value="">전체 상태</option><option value="true">적용 완료</option><option value="false">적용 전</option></select></label>
        <div className="staff-row-actions"><button className="staff-button primary" type="submit">검색</button><button className="staff-button soft" type="button" onClick={() => { setKeyword(''); setGradeFilter(''); setDiscountFilter(''); setFilters({}) }}>초기화</button></div>
      </form>
      <section className="staff-customer-actions" aria-label="고객 등급과 할인 관리">
        <article className="staff-action-card">
          <div><p className="staff-action-kicker">등급 관리</p><h2>고객별 등급 일괄 변경</h2><p>목록에서 고객과 등급을 지정하면 선택한 변경이 한 번에 적용됩니다.</p></div>
          <dl><div><dt>선택 고객</dt><dd>{selectedCustomerIds.length}명</dd></div><div><dt>변경 예정</dt><dd>{selectedChanges.length}건</dd></div></dl>
          <button className="staff-button primary" type="button" disabled={!selectedChanges.length || savingGrades} onClick={() => void saveGradeChanges()}>{savingGrades ? '변경 중…' : `등급 변경 (${selectedChanges.length})`}</button>
        </article>
        <article className="staff-action-card">
          <div><p className="staff-action-kicker">할인 관리</p><h2>등급별 할인 적용</h2><p>선택한 등급에서 아직 할인이 적용되지 않은 고객에게 혜택을 적용합니다.</p></div>
          <label className="staff-field"><span>적용 등급</span><select value={discountGrade} onChange={event => setDiscountGrade(event.target.value as ApiLoyaltyGrade)}>{Object.entries(loyaltyLabels).map(([grade, label]) => <option key={grade} value={grade}>{label}</option>)}</select></label>
          <dl><div><dt>대상 고객</dt><dd>{discountTargets.length}명</dd></div><div><dt>적용 대기</dt><dd>{pendingDiscountCount}명</dd></div></dl>
          <button className="staff-button primary" type="button" disabled={!pendingDiscountCount || applyingDiscount} onClick={() => void applyDiscount()}>{applyingDiscount ? '적용 중…' : `${loyaltyLabels[discountGrade]} 할인 적용 (${pendingDiscountCount})`}</button>
        </article>
      </section>
      <section className="staff-sheet staff-list-sheet staff-customer-list">
        <div className="staff-toolbar"><span>고객 {customers.length}명 · 등급 변경은 선택한 고객에게만 적용됩니다.</span></div>
        <div className="staff-table-scroll" tabIndex={0}><table className="staff-table"><caption className="sr-only">고객별 단골 등급과 할인 적용 상태</caption><thead><tr><th scope="col"><label className="staff-check"><input type="checkbox" checked={allSelected} onChange={() => setSelectedCustomerIds(allSelected ? [] : customers.map(customer => customer.customerId))} /><span className="sr-only">모든 고객 선택</span></label></th><th scope="col">고객명</th><th scope="col">연락처</th><th scope="col">완료 여행</th><th scope="col">현재 등급</th><th scope="col">변경 등급</th><th scope="col">할인 상태</th><th scope="col">상세</th></tr></thead><tbody>
          {customers.map(customer => <tr key={customer.customerId}><td><label className="staff-check"><input type="checkbox" aria-label={`${customer.name} 선택`} checked={selectedCustomerIds.includes(customer.customerId)} onChange={() => toggleCustomer(customer.customerId)} /></label></td><td><strong>{customer.name}</strong></td><td>{customer.phoneNum}</td><td>{customer.completedTourCount}회</td><td><strong>{loyaltyLabels[customer.loyaltyGrade]}</strong></td><td><select aria-label={`${customer.name} 변경 등급`} value={gradeEdits[customer.customerId] ?? customer.loyaltyGrade} onChange={event => { setGradeEdits(current => ({ ...current, [customer.customerId]: event.target.value as ApiLoyaltyGrade })); setSelectedCustomerIds(current => current.includes(customer.customerId) ? current : [...current, customer.customerId]) }}>{Object.entries(loyaltyLabels).map(([grade, label]) => <option key={grade} value={grade}>{label}</option>)}</select></td><td><span className={`staff-state ${customer.loyaltyDiscountApplied ? 'preview' : customer.loyaltyGrade === 'VIP' ? 'paused' : ''}`}>{customer.loyaltyDiscountApplied ? '적용 완료' : '적용 전'}</span></td><td><AppLink className="staff-text-action" href={`/staff/customers/${customer.customerId}`}>보기</AppLink></td></tr>)}
          {!customers.length && <tr><td className="staff-loyalty-empty" colSpan={8}>표시할 고객이 없습니다.</td></tr>}
        </tbody></table></div>
      </section>
      <aside className="staff-loyalty-notice">
        <strong>단골 할인 운영 방식</strong>
        <p>등급은 완료 여행 횟수로 산정되지만 할인은 자동 적용되지 않습니다. 직원 승인 후 다음 결제부터 적용됩니다. {sortedPolicies.map(policy => `${loyaltyLabels[policy.grade]} ${policy.requiredTourCount}회 이상·${policy.discountRate}%`).join(' / ')}</p>
      </aside>
    </>}
  </>
}

function CustomerDetail({ customerId }: { customerId: number }) {
  const [customer, setCustomer] = useState<CustomerDetailResponse | null>(null)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    setError('')
    void getCustomerDetail(customerId).then(response => { if (active) setCustomer(response.data) })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : '고객 상세 정보를 불러오지 못했습니다.') })
    return () => { active = false }
  }, [customerId, retry])
  if (!customer || error) return <LoadingState error={error} retry={() => setRetry(value => value + 1)} />
  return <>
    <Heading title={customer.name} description="고객 기본정보와 단골 할인 적용 상태를 확인합니다." action={<AppLink className="staff-button soft" href="/staff/customers">목록으로</AppLink>} />
    <section className="staff-status-overview" aria-label="고객 요약">
      <div><span>고객 등급</span><strong>{loyaltyLabels[customer.loyaltyGrade]}</strong></div>
      <div><span>완료 여행</span><strong>{customer.completedTourCount}회</strong></div>
      <div><span>단골 할인</span><strong>{customer.loyaltyDiscountApplied ? '적용 완료' : '적용 전'}</strong></div>
      <div><span>고객번호</span><strong>#{customer.customerId}</strong></div>
    </section>
    <section className="staff-sheet">
      <div className="staff-section-heading"><h2>기본정보</h2></div>
      <dl className="staff-detail-list">
        <div><dt>로그인 아이디</dt><dd>{customer.loginId}</dd></div>
        <div><dt>이름</dt><dd>{customer.name}</dd></div>
        <div><dt>연락처</dt><dd>{customer.phoneNum}</dd></div>
        <div><dt>주소</dt><dd>{customer.address || '등록되지 않음'}</dd></div>
        <div><dt>할인 적용 일시</dt><dd>{customer.loyaltyDiscountAppliedAt ? new Date(customer.loyaltyDiscountAppliedAt).toLocaleString('ko-KR') : '적용 전'}</dd></div>
      </dl>
    </section>
  </>
}
