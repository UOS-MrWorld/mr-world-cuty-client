import { useState } from 'react'
import { AppLink } from '../components/AppLink'
import { Icon } from '../components/Icon'
import { TourCard } from '../components/TourCard'
import { tours, themes } from '../data/travel'
import { getVisibleTours, regions, themeLabels } from '../data/catalogue'
import { navigate } from '../hooks/useRoute'
import type { ThemeId } from '../types/travel'

export default function ExplorePage({ cartIds, onCartToggle }: {
  cartIds: string[]
  onCartToggle: (id: string) => void
}) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const params = new URLSearchParams(window.location.search)
  const requestedTheme = params.get('theme')
  const theme: ThemeId = themes.some(item => item.id === requestedTheme) ? requestedTheme as ThemeId : 'all'
  const search = params.get('q')?.trim() ?? ''
  const region = regions.some(item => item.id === params.get('region')) ? params.get('region') ?? 'all' : 'all'
  const budget = Number(params.get('budget')) > 0 && Number.isFinite(Number(params.get('budget'))) ? params.get('budget') ?? '' : ''
  const duration = ['short', 'medium', 'long'].includes(params.get('duration') ?? '') ? params.get('duration') ?? '' : ''
  const sort = ['price-asc', 'price-desc', 'duration'].includes(params.get('sort') ?? '') ? params.get('sort') ?? '' : ''
  const cartOnly = params.get('view') === 'cart' || params.get('view') === 'saved'
  const filtered = getVisibleTours(params, cartIds)

  function updateFilters(values: Record<string, string | null>) {
    const next = new URLSearchParams(window.location.search)
    for (const [key, value] of Object.entries(values)) {
      if (value && value !== 'all') next.set(key, value)
      else next.delete(key)
    }
    navigate(next.size ? `/tours?${next.toString()}` : '/tours')
  }
  const activeFilters = [
    theme !== 'all' ? { key: 'theme', label: themeLabels[theme] } : null,
    region !== 'all' ? { key: 'region', label: regions.find(item => item.id === region)!.label } : null,
    budget ? { key: 'budget', label: `${Number(budget) / 10000}만원 이하` } : null,
    duration ? { key: 'duration', label: duration === 'short' ? '4일 이하' : duration === 'medium' ? '5~7일' : '8일 이상' } : null,
    search ? { key: 'q', label: search } : null,
    cartOnly ? { key: 'view', label: '장바구니' } : null,
  ].filter(item => item !== null)

  return (
    <>
      <div className="catalog-heading"><div><p className="eyebrow">여행상품 검색</p><h1>{theme === 'all' ? '테마여행' : themeLabels[theme]}</h1></div></div>
      <form className="catalog-search" role="search" key={`${theme}:${search}:${region}`} onSubmit={event => {
        event.preventDefault()
        const form = new FormData(event.currentTarget)
        updateFilters({ q: String(form.get('q') ?? '').trim(), region: String(form.get('region') ?? 'all') })
      }}>
        <label><span>여행지</span><select name="region" defaultValue={region}>{regions.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label className="catalog-keyword"><span>상품명·키워드</span><input name="q" type="search" aria-label="상품명·키워드" defaultValue={search} placeholder="여행지 또는 상품명을 입력하세요" /></label>
        <button className="button primary" type="submit"><Icon name="search" size={18} />검색</button>
      </form>
      {(params.get('date') || params.get('travelers')) && <p className="catalog-intent"><strong>선택한 조건</strong> {params.get('date') && `출발 희망일 ${params.get('date')}`} {params.get('travelers') && ` · ${params.get('travelers')}명`}</p>}
      <div className="catalog-layout">
        <aside className="catalog-sidebar" aria-label="상품 검색 조건">
          <div className="sidebar-title"><h2>상세 조건</h2><button className="mobile-filter-toggle" aria-expanded={filtersOpen} aria-controls="catalog-filter-fields" onClick={() => setFiltersOpen(open => !open)}>{filtersOpen ? '필터 닫기' : '필터 열기'}</button><AppLink href="/tours">초기화</AppLink></div>
          <div id="catalog-filter-fields" className={`filter-fields${filtersOpen ? ' is-open' : ''}`}>
          <fieldset><legend>여행 테마</legend>{themes.map(item => <label key={item.id}><input type="radio" name="theme" checked={theme === item.id} onChange={() => updateFilters({theme:item.id})} /><span>{themeLabels[item.id]}</span><small>{tours.filter(tour => item.id === 'all' || tour.theme === item.id).length}</small></label>)}</fieldset>
          <fieldset><legend>여행 기간</legend>{[{value:'',label:'전체'},{value:'short',label:'4일 이하'},{value:'medium',label:'5~7일'},{value:'long',label:'8일 이상'}].map(item => <label key={item.value}><input type="radio" name="duration" checked={duration === item.value} onChange={() => updateFilters({duration:item.value})} /><span>{item.label}</span></label>)}</fieldset>
          <fieldset><legend>예산 <small>1인 기본 금액</small></legend>{[{value:'',label:'전체'},{value:'1000000',label:'100만원 이하'},{value:'2000000',label:'200만원 이하'},{value:'4000000',label:'400만원 이하'}].map(item => <label key={item.value}><input type="radio" name="budget" checked={budget === item.value} onChange={() => updateFilters({budget:item.value})} /><span>{item.label}</span></label>)}</fieldset>
          <label className="saved-filter"><input type="checkbox" checked={cartOnly} onChange={() => updateFilters({view:cartOnly ? null : 'cart'})} />장바구니 담은 상품만 보기</label>
          </div>
        </aside>
        <section className="catalog-results" aria-labelledby="results-title">
          <div className="results-toolbar"><h2 id="results-title">검색 결과 <strong role="status">{filtered.length}</strong>건</h2><label><span className="sr-only">상품 정렬</span><select value={sort} onChange={event => updateFilters({sort:event.target.value})}><option value="">기본순</option><option value="price-asc">낮은 가격순</option><option value="price-desc">높은 가격순</option><option value="duration">짧은 일정순</option></select></label></div>
          {activeFilters.length > 0 && <div className="applied-filters" aria-label="적용한 검색 조건">{activeFilters.map(item => <button key={item.key} onClick={() => updateFilters({[item.key]:null})} aria-label={`${item.label} 조건 해제`}>{item.label}<Icon name="close" size={13} /></button>)}</div>}
          {filtered.length ? <div className="product-list">{filtered.map(tour => <TourCard key={tour.id} tour={tour} inCart={cartIds.includes(tour.id)} onCartToggle={() => onCartToggle(tour.id)} href={`/tours/${tour.id}${window.location.search}`} />)}</div> : <div className="empty-state"><Icon name="search" size={32} /><h2>검색된 상품이 없습니다</h2><p>여행지나 상세 조건을 변경해 주세요.</p><AppLink className="button secondary" href="/tours">검색 조건 초기화</AppLink></div>}
        </section>
      </div>
    </>
  )
}
