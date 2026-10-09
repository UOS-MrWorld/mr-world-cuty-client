import { useEffect, useRef, useState } from 'react'
import { AppLink } from '../components/AppLink'
import { PreviewDialog } from '../components/PreviewDialog'
import { CustomerForm, InventoryForm, ProductEditor } from '../components/staff/StaffForms'
import { formatPrice } from '../data/travel'
import { themeLabels } from '../data/catalogue'
import { staffCustomers, staffInventory, staffProducts, staffStateLabels } from '../data/staff'
import { navigate } from '../hooks/useRoute'
import type { StaffFeedback } from '../types/staff'

type Section = 'tours' | 'inventory' | 'customers'
type PendingLeave = { kind: 'navigate'; href: string; external: boolean } | { kind: 'close' }
const nav: { href: string; label: string; section: Section; description: string }[] = [
  { href: '/staff/tours', label: '상품 관리', section: 'tours', description: '여행과 기본 구성' },
  { href: '/staff/inventory', label: '물품·재고 관리', section: 'inventory', description: '제공 물품과 수량' },
  { href: '/staff/customers', label: '고객 관리', section: 'customers', description: '고객 정보와 이용 이력' },
]

export default function StaffPage({ path }: { path: string }) {
  const [products, setProducts] = useState(staffProducts)
  const [items, setItems] = useState(staffInventory)
  const [customers, setCustomers] = useState(staffCustomers)
  const [searchBySection, setSearchBySection] = useState({ tours: '', inventory: '', customers: '' })
  const [feedback, setFeedback] = useState<StaffFeedback | null>(null)
  const [inventoryEdit, setInventoryEdit] = useState<number | 'new' | null>(null)
  const [customerEdit, setCustomerEdit] = useState<number | 'new' | null>(null)
  const [dirty, setDirty] = useState(false)
  const [pendingLeave, setPendingLeave] = useState<PendingLeave | null>(null)
  const discardAccepted = useRef(false)
  const section: Section = path.startsWith('/staff/inventory') ? 'inventory' : path.startsWith('/staff/customers') ? 'customers' : 'tours'
  const currentNav = nav.find(item => item.section === section)!
  const search = searchBySection[section]
  const normalizedSearch = search.trim().toLocaleLowerCase('ko')
  const matchedProducts = products.filter(product => `${product.title} ${product.location} ${themeLabels[product.theme]}`.toLocaleLowerCase('ko').includes(normalizedSearch))
  const matchedItems = items.filter(item => `${item.name} ${item.kind} ${themeLabels[item.theme]}`.toLocaleLowerCase('ko').includes(normalizedSearch))
  const matchedCustomers = customers.filter(customer => `${customer.name} ${customer.contact}`.toLocaleLowerCase('ko').includes(normalizedSearch))
  const selectedInventory = items.find(item => item.id === inventoryEdit)
  const selectedCustomer = customers.find(customer => customer.id === customerEdit)
  const editId = path.match(/^\/staff\/tours\/([^/]+)\/edit$/)?.[1]
  const editedProduct = products.find(product => product.id === editId)
  const editingProduct = path === '/staff/tours/new' || !!editedProduct
  const matchingCount = section === 'tours' ? matchedProducts.length : section === 'inventory' ? matchedItems.length : matchedCustomers.length

  useEffect(() => {
    const heading = document.querySelector<HTMLElement>('.staff-content h1')
    heading?.setAttribute('tabindex', '-1')
    heading?.focus({ preventScroll: true })
  }, [path])

  useEffect(() => {
    if (!dirty) return
    discardAccepted.current = false
    function warnBeforeUnload(event: BeforeUnloadEvent) { if (!discardAccepted.current) event.preventDefault() }
    function guardNavigation(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return
      const next = new URL(anchor.href, window.location.href)
      if (!['http:', 'https:'].includes(next.protocol)) return
      if (next.href === window.location.href || (next.origin === window.location.origin && next.pathname === window.location.pathname && next.search === window.location.search && next.hash)) return
      event.preventDefault()
      event.stopPropagation()
      const external = next.origin !== window.location.origin
      setPendingLeave({ kind: 'navigate', href: external ? next.href : `${next.pathname}${next.search}${next.hash}`, external })
    }
    window.addEventListener('beforeunload', warnBeforeUnload)
    document.addEventListener('click', guardNavigation, true)
    return () => {
      window.removeEventListener('beforeunload', warnBeforeUnload)
      document.removeEventListener('click', guardNavigation, true)
    }
  }, [dirty])

  function closePanel() {
    if (dirty) { setPendingLeave({ kind: 'close' }); return }
    setInventoryEdit(null)
    setCustomerEdit(null)
  }

  function discardChanges() {
    const pending = pendingLeave
    if (!pending) return
    discardAccepted.current = true
    setDirty(false)
    setPendingLeave(null)
    if (pending.kind === 'close') {
      setInventoryEdit(null)
      setCustomerEdit(null)
    } else if (pending.external) {
      window.location.assign(pending.href)
    } else {
      navigate(pending.href)
    }
  }

  return <div className="staff-workspace">
    <aside className="staff-sidebar"><div className="staff-space-title"><p>CUTY</p><h2>여행 운영</h2><span>직원 업무 화면 초안</span></div><nav aria-label="직원 업무">{nav.map(item => <AppLink key={item.href} href={item.href} aria-current={section === item.section ? 'page' : undefined}><strong>{item.label}</strong><span>{item.description}</span></AppLink>)}</nav><div className="staff-sidebar-note"><p>미리보기 공간</p><span>직원 인증과 서버 저장을 연결하기 전, 화면과 입력 흐름을 확인합니다.</span><AppLink href="/">고객 홈으로</AppLink></div></aside>
    <div className="staff-content">
      {editingProduct ? <ProductEditor key={path} product={editedProduct} onDirtyChange={setDirty} onApply={value => {
        setProducts(current => current.some(product => product.id === value.id) ? current.map(product => product.id === value.id ? value : product) : [...current, value])
        setFeedback({ kind: 'success', message: `${value.title}의 변경 내용을 현재 초안 목록에 반영했습니다. 실제 상품·신청·서버는 변경되지 않았습니다.` })
        navigate('/staff/tours')
      }} /> : editId ? <section className="staff-sheet staff-empty"><h1>상품을 찾을 수 없습니다</h1><p>초안 상품은 직원 영역을 벗어나거나 새로고침하면 초기화됩니다.</p><AppLink className="staff-button primary" href="/staff/tours">상품 목록으로</AppLink></section> : <>
        <div className="staff-page-heading"><div><p className="staff-kicker">CUTY 직원 업무</p><h1>{currentNav.label}</h1><p>{section === 'tours' ? '여행의 기본 구성부터 선택 조건까지 한곳에서.' : section === 'inventory' ? '여행에 필요한 물품과 변경 전후 수량을 확인하세요.' : '고객 정보, 여행 이력, 단골 정보를 연결해 확인하세요.'}</p></div>{section === 'tours' ? <AppLink className="staff-button primary" href="/staff/tours/new">상품 등록</AppLink> : <button className="staff-button primary" onClick={() => { setDirty(false); if (section === 'inventory') setInventoryEdit('new'); else setCustomerEdit('new') }}>{section === 'inventory' ? '물품 등록' : '고객 등록'}</button>}</div>
        <div className="staff-preview-note"><strong>샘플 데이터로 확인하는 초안</strong><p>변경은 현재 미리보기의 메모리에만 유지합니다. 새로고침하거나 직원 영역을 벗어나면 초기화되며 서버·브라우저 저장소에는 저장하지 않습니다.</p></div>
        {feedback && <p className={`staff-message ${feedback.kind}`} role={feedback.kind === 'error' ? 'alert' : 'status'}>{feedback.message}</p>}
        <section className="staff-sheet staff-list-sheet"><div className="staff-toolbar"><label className="staff-search"><span className="sr-only">{currentNav.label} 검색</span><input type="search" value={search} onChange={event => setSearchBySection(current => ({ ...current, [section]: event.target.value }))} placeholder={section === 'tours' ? '상품명, 여행지 또는 테마 검색' : section === 'inventory' ? '물품명, 종류 또는 테마 검색' : '고객명 또는 연락처 검색'} /></label><span>{matchingCount}개 {section === 'customers' ? '화면 예시 고객' : '초안 항목'}</span></div>
          <div className="staff-table-scroll" tabIndex={0} aria-label={`${currentNav.label} 표 영역`}><table className="staff-table"><caption className="sr-only">{currentNav.label} 목록 · 화면 예시</caption>
            {section === 'tours' ? <><thead><tr><th>여행 상품</th><th>테마</th><th>기간</th><th>1인 기본 가격</th><th>운영 상태</th><th>관리</th></tr></thead><tbody>{matchedProducts.map(product => <tr key={product.id}><td><div className="staff-product"><img src={product.image} alt="" loading="lazy" /><div><strong>{product.title}</strong><small>{product.location}</small></div></div></td><td>{themeLabels[product.theme]}</td><td>{product.duration}</td><td className="staff-number">{formatPrice(product.price)}원</td><td><span className={`staff-state ${product.state}`}>{staffStateLabels[product.state]}</span></td><td><AppLink className="staff-text-action" href={`/staff/tours/${product.id}/edit`}>수정</AppLink></td></tr>)}</tbody></> : section === 'inventory' ? <><thead><tr><th>물품명</th><th>종류</th><th>테마</th><th>현재 수량 · 예시</th><th>관리</th></tr></thead><tbody>{matchedItems.map(item => <tr key={item.id}><td><strong>{item.name}</strong></td><td>{item.kind}</td><td>{themeLabels[item.theme]}</td><td className="staff-number">{formatPrice(item.quantity)}개</td><td><button className="staff-text-action" onClick={() => { setDirty(false); setInventoryEdit(item.id) }}>입고·수량 수정</button></td></tr>)}</tbody></> : <><thead><tr><th>고객명</th><th>연락처</th><th>이용 이력</th><th>단골 등급·할인율</th><th>관리</th></tr></thead><tbody>{matchedCustomers.map(customer => <tr key={customer.id}><td><strong>{customer.name}</strong><small className="staff-subtext">화면 예시</small></td><td>{customer.contact || '미입력'}</td><td>{customer.history.length ? `${customer.history.length}건 · 화면 예시` : '표시할 예시 없음'}</td><td><span className="staff-state">정책 확인 전</span></td><td><button className="staff-text-action" onClick={() => { setDirty(false); setCustomerEdit(customer.id) }}>상세·수정</button></td></tr>)}</tbody></>}
          </table></div>
          {matchingCount === 0 && <div className="staff-empty"><h2>검색 결과가 없습니다</h2><p>다른 검색어를 입력하거나 조건을 지워 주세요.</p><button className="staff-button soft" onClick={() => setSearchBySection(current => ({ ...current, [section]: '' }))}>검색 초기화</button></div>}
        </section>
        <p className="staff-bottom-note">{section === 'tours' ? '이미 신청한 여행은 신청 당시 구성과 가격을 유지하고, 상품 수정은 새 신청부터 적용하는 흐름으로 설계합니다.' : section === 'inventory' ? '물품 신규 등록과 기존 물품 입고는 별도 입력 흐름입니다. 재고 차감과 실시간 창고 연동은 연결 전입니다.' : '단골 기준·할인율·직원 직접 수정 권한은 정책 확정 후 연결합니다. 표시된 이력은 화면 예시입니다.'}</p>
      </>}
      {inventoryEdit !== null && <PreviewDialog title={selectedInventory ? '입고·수량 수정' : '신규 물품 등록'} onClose={closePanel}><InventoryForm item={selectedInventory} onDirtyChange={setDirty} onApply={(value, previous) => {
        setItems(current => current.some(item => item.id === value.id) ? current.map(item => item.id === value.id ? value : item) : [...current, value])
        setFeedback({ kind: 'success', message: `${value.name}: ${formatPrice(previous)}개 → ${formatPrice(value.quantity)}개로 초안에 반영했습니다. 실제 창고·서버 재고는 변경되지 않았습니다.` })
        setInventoryEdit(null)
      }} /></PreviewDialog>}
      {customerEdit !== null && <PreviewDialog title={selectedCustomer ? '고객 상세·수정' : '고객 등록'} onClose={closePanel}><CustomerForm customer={selectedCustomer} onDirtyChange={setDirty} onApply={value => {
        setCustomers(current => current.some(customer => customer.id === value.id) ? current.map(customer => customer.id === value.id ? value : customer) : [...current, value])
        setFeedback({ kind: 'success', message: `${value.name}의 초안 정보를 반영했습니다. 입력 내용은 현재 화면의 메모리에만 있으며 서버·브라우저 저장소에는 저장하지 않습니다.` })
        setCustomerEdit(null)
      }} /></PreviewDialog>}
      {pendingLeave && <PreviewDialog title="변경 내용을 버릴까요?" onClose={() => setPendingLeave(null)}>
        <div className="staff-leave-confirmation">
          <p>아직 초안에 적용하지 않은 변경 내용이 있습니다. {pendingLeave.kind === 'close' ? '지금 닫으면' : '다른 화면으로 이동하면'} 입력한 변경 내용이 사라집니다.</p>
          <p className="staff-small-note">계속 수정하거나, 변경 내용을 버리고 {pendingLeave.kind === 'close' ? '닫을 수 있습니다.' : '이동할 수 있습니다.'}</p>
          <div className="staff-form-actions">
            <button className="staff-button soft" type="button" onClick={() => setPendingLeave(null)}>계속 수정하기</button>
            <button className="staff-button primary" type="button" onClick={discardChanges}>변경 버리고 {pendingLeave.kind === 'close' ? '닫기' : '이동'}</button>
          </div>
        </div>
      </PreviewDialog>}
    </div>
  </div>
}
