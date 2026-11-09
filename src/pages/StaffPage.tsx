import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { createInventory, getInventories, updateInventory } from '../api/inventory'
import { getLoyaltyPolicy } from '../api/customer'
import { createTour, getStaffTour, getStaffTours, updateTour } from '../api/tour'
import { AppLink } from '../components/AppLink'
import { navigate } from '../hooks/useRoute'
import type { ApiLoyaltyGrade, ApiTheme, ApiTransport } from '../types/api'
import type { InventoryResponse, LoyaltyPolicyResponse } from '../types/staffApi'
import type { StaffTourSummaryResponse, TourCreateRequest } from '../types/tourApi'

type Section = 'tours' | 'inventory' | 'customers'
const nav = [
  { href: '/staff/tours', label: '상품 관리', description: '여행과 기본 구성' },
  { href: '/staff/inventory', label: '물품·재고 관리', description: '제공 물품과 수량' },
  { href: '/staff/customers', label: '등급 관리', description: '여행 횟수 기준 정책' },
]
const loyaltyLabels: Record<ApiLoyaltyGrade, string> = { NORMAL: '일반', VIP: 'VIP' }
const themeLabels: Record<ApiTheme, string> = { HONEYMOON: '허니문', HEALING: '효도·힐링', GOLF: '골프', TREKKING: '트레킹' }

export default function StaffPage({ path }: { path: string }) {
  const section: Section = path.startsWith('/staff/inventory') ? 'inventory' : path.startsWith('/staff/customers') ? 'customers' : 'tours'
  return <div className="staff-workspace">
    <aside className="staff-sidebar">
      <div className="staff-space-title"><p>CUTY</p><h2>여행 운영</h2><span>실제 서버 업무 화면</span></div>
      <nav aria-label="직원 업무">{nav.map(item => <AppLink key={item.href} href={item.href} aria-current={item.href.includes(section) ? 'page' : undefined}><strong>{item.label}</strong><span>{item.description}</span></AppLink>)}</nav>
      <div className="staff-sidebar-note"><p>STAFF 전용</p><span>변경 내용은 서버에 저장됩니다.</span><AppLink href="/">고객 홈으로</AppLink></div>
    </aside>
    <div className="staff-content">
      {section === 'tours' ? <ToursSection path={path} /> : section === 'inventory' ? <InventorySection /> : <CustomersSection />}
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
  if (path === '/staff/tours/new' || editId) return <TourEditor tourId={editId ? Number(editId) : undefined} />

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
    {loading || error ? <LoadingState error={error} retry={() => setRetry(value => value + 1)} /> : <section className="staff-sheet staff-list-sheet">
      <div className="staff-toolbar"><span>{items.length}개 상품</span></div>
      <div className="staff-table-scroll" tabIndex={0}><table className="staff-table"><thead><tr><th>상품명</th><th>테마</th><th>출발일</th><th>결제 인원</th><th>상태</th><th>관리</th></tr></thead><tbody>
        {items.map(item => <tr key={item.tourId}><td><strong>{item.tourName}</strong></td><td>{themeLabels[item.theme]}</td><td>{item.startDate}</td><td className="staff-number">{item.paidGuestCount}명</td><td><span className="staff-state">{item.tourStatus}</span></td><td><AppLink className="staff-text-action" href={`/staff/tours/${item.tourId}/edit`}>수정</AppLink></td></tr>)}
      </tbody></table></div>
    </section>}
  </>
}

function TourEditor({ tourId }: { tourId?: number }) {
  const [loading, setLoading] = useState(Boolean(tourId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [value, setValue] = useState<TourCreateRequest>({
    theme: 'GOLF', tourName: '', description: '', startDate: '', endDate: '',
    basePrice: 0, defaultTransport: 'PREMIUM_VAN_10', gifts: [],
  })
  useEffect(() => {
    if (!tourId) return
    let active = true
    void getStaffTour(tourId).then(({ data }) => {
      if (!active) return
      setValue({
        theme: data.tour.theme, tourName: data.tour.tourName, description: data.tour.description,
        startDate: data.tour.startDate, endDate: data.tour.endDate, basePrice: data.tour.basePrice,
        defaultTransport: data.tour.defaultTransport,
        gifts: data.gifts.map(gift => ({ itemId: gift.itemId, quantityPerGuest: gift.quantityPerGuest })),
      })
    }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : '상품을 불러오지 못했습니다.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [tourId])
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
      {error && <p className="staff-message error" role="alert">{error}</p>}
      <div className="staff-form-actions"><button className="staff-button primary" disabled={saving}>{saving ? '저장 중…' : '서버에 저장'}</button></div>
    </form>
  </>
}

function InventorySection() {
  const [items, setItems] = useState<InventoryResponse[]>([])
  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [retry, setRetry] = useState(0)
  const focusedShortage = useRef(false)
  useEffect(() => {
    let active = true
    setLoading(true); setError('')
    void getInventories({ page: 0, size: 100 }).then(({ data }) => {
      if (!active) return
      setItems(data.content)
      setQuantities(Object.fromEntries(data.content.map(item => [item.itemId, item.quantity])))
      const first = data.content.find(item => item.quantity < item.requiredQuantity)
      if (first && !focusedShortage.current) {
        focusedShortage.current = true
        window.requestAnimationFrame(() => document.getElementById(`inventory-quantity-${first.itemId}`)?.focus())
      }
    }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : '재고를 불러오지 못했습니다.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [retry])
  const shortages = items.filter(item => item.quantity < item.requiredQuantity)
  async function save(item: InventoryResponse) {
    setError(''); setMessage('')
    try {
      await updateInventory(item.itemId, { quantity: quantities[item.itemId] })
      setMessage(`${item.itemName} 수량을 저장했습니다.`)
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
    {loading ? <LoadingState error={error} retry={() => setRetry(value => value + 1)} /> : <section className="staff-sheet staff-list-sheet"><div className="staff-table-scroll" tabIndex={0}><table className="staff-table"><thead><tr><th>물품명</th><th>현재 수량</th><th>사용 예정</th><th>상태</th><th>저장</th></tr></thead><tbody>
      {items.map(item => { const shortage = item.quantity < item.requiredQuantity; return <tr key={item.itemId} className={shortage ? 'inventory-shortage' : ''}><td><strong>{item.itemName}</strong></td><td><input id={`inventory-quantity-${item.itemId}`} aria-label={`${item.itemName} 현재 수량`} type="number" min="0" step="1" value={quantities[item.itemId] ?? 0} onChange={event => setQuantities(current => ({ ...current, [item.itemId]: Number(event.target.value) }))} /></td><td>{item.requiredQuantity}개</td><td>{shortage ? <span className="staff-state paused">부족 {item.requiredQuantity - item.quantity}개</span> : <span className="staff-state preview">충분</span>}</td><td><button className="staff-text-action" onClick={() => void save(item)} disabled={quantities[item.itemId] === item.quantity}>수량 저장</button></td></tr> })}
    </tbody></table></div></section>}
  </>
}

function CustomersSection() {
  const [policies, setPolicies] = useState<LoyaltyPolicyResponse['policies']>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    setLoading(true); setError('')
    void getLoyaltyPolicy().then(({ data }) => { if (active) setPolicies(data.policies) })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : '등급 기준을 불러오지 못했습니다.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [retry])
  const sortedPolicies = [...policies].sort((first, second) => first.requiredTourCount - second.requiredTourCount)
  return <>
    <Heading title="등급 관리" description="완료한 여행 횟수에 따라 고객 등급이 자동으로 변경됩니다." />
    {error && !loading && <p className="staff-message error" role="alert">{error}</p>}
    {loading ? <LoadingState error={error} retry={() => setRetry(value => value + 1)} /> : <>
      <section className="staff-loyalty-overview" aria-label="등급 운영 방식">
        <div><span>1</span><strong>여행 완료</strong><p>결제한 여행이 완료 상태가 되면 횟수에 포함됩니다.</p></div>
        <div><span>2</span><strong>횟수 재계산</strong><p>같은 여행을 여러 번 예약해도 한 번으로 계산합니다.</p></div>
        <div><span>3</span><strong>등급 자동 반영</strong><p>충족한 기준 중 가장 높은 등급으로 변경됩니다.</p></div>
      </section>
      <section className="staff-sheet staff-loyalty-sheet">
        <div className="staff-section-heading"><div><p className="staff-kicker">현재 서버 정책</p><h2>등급별 적용 기준</h2></div><span>개별 고객을 직접 지정하지 않습니다.</span></div>
        <div className="staff-table-scroll" tabIndex={0}><table className="staff-table staff-loyalty-table"><caption className="sr-only">완료 여행 횟수에 따른 고객 등급과 할인율</caption><thead><tr><th scope="col">고객 등급</th><th scope="col">완료 여행 기준</th><th scope="col">할인율</th><th scope="col">등급 반영</th></tr></thead><tbody>
          {sortedPolicies.map(policy => <tr key={policy.grade}><td><strong>{loyaltyLabels[policy.grade]}</strong>{policy.grade === 'VIP' && <span className="staff-grade-badge">우수 고객</span>}</td><td><strong>{policy.requiredTourCount}회 이상</strong><small>결제 후 완료된 서로 다른 여행</small></td><td><strong>{policy.discountRate}%</strong><small>{policy.discountRate ? '등급 할인 기준' : '기본 할인 없음'}</small></td><td><span className="staff-state preview">자동 산정</span></td></tr>)}
          {!sortedPolicies.length && <tr><td className="staff-loyalty-empty" colSpan={4}>등록된 등급 기준이 없습니다.</td></tr>}
        </tbody></table></div>
      </section>
      <aside className="staff-loyalty-notice">
        <strong>운영 안내</strong>
        <p>등급 기준과 할인율은 서버에 고정된 정책입니다. 여행 완료 시 등급은 자동으로 다시 계산되며, 현재 API에서는 정책 조회만 지원합니다.</p>
      </aside>
    </>}
  </>
}
