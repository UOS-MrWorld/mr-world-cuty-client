import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { Icon } from '../components/Icon'
import { AppLink } from '../components/AppLink'
import { BrandMark } from '../components/BrandMark'
import { landingMoods } from '../data/landing'
import { themes } from '../data/travel'
import { themeLabels } from '../data/catalogue'
import { getEarliestDepartureDate } from '../data/configuration'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { navigate } from '../hooks/useRoute'
import { PlaneLoader } from '../components/PlaneLoader'
import { HeroDatePicker } from '../components/HeroDatePicker'
import { HeroSelect } from '../components/HeroSelect'
import type { GlobeMood } from '../types/landing'

export default function LandingPage({ onMoodChange, showSearch = true }: { onMoodChange?: (mood: GlobeMood) => void; showSearch?: boolean }) {
  const [active,setActive]=useState(0)
  const [focused,setFocused]=useState(false)
  const [searching,setSearching]=useState(false)
  const [searchTheme,setSearchTheme]=useState('all')
  const [searchDate,setSearchDate]=useState('')
  const [travelers,setTravelers]=useState('2')
  const reduced=useReducedMotion()
  const tabsRef=useRef<HTMLDivElement>(null)
  const previousActive=useRef(active)
  const mood=landingMoods[active]
  useEffect(()=>onMoodChange?.(mood.id),[mood.id,onMoodChange])
  useLayoutEffect(()=>{const tabs=tabsRef.current;if(tabs)tabs.dataset.direction=active>=previousActive.current?'next':'prev';previousActive.current=active},[active])
  useEffect(()=>{if(searchTheme==='romance'&&travelers!=='2')setTravelers('2')},[searchTheme,travelers])
  useEffect(()=>{if(reduced||focused||searching)return;const timer=window.setInterval(()=>{if(!document.hidden)setActive(i=>(i+1)%landingMoods.length)},14000);return()=>clearInterval(timer)},[reduced,focused,searching])
  useEffect(()=>{if(!searching)return;const timer=window.setTimeout(()=>{const form=document.querySelector<HTMLFormElement>('.landing-search');if(!form)return;const data=new FormData(form);const params=new URLSearchParams();for(const key of ['theme','date','travelers','q']){const value=String(data.get(key)??'').trim();if(value&&value!=='all')params.set(key,value)}navigate(`/tours?${params}`)},650);return()=>clearTimeout(timer)},[searching])
  return <div className={`landing-experience mood-${mood.id}`}>
    <section className="landing-hero" aria-label="CUTY 테마 여행">
      <div className="landing-copy v2-landing-copy"><AppLink className="landing-hero-brand" href="/" aria-label="CUTY 홈"><BrandMark large/></AppLink><p className="v2-landing-kicker">{`${mood.id.toUpperCase()} · 0${active + 1} / 0${landingMoods.length}`}</p><h1 key={mood.id}>{mood.title}</h1><p className="landing-description" key={`${mood.id}-description`}>{mood.description}</p><div ref={tabsRef} className="v2-theme-tabs" role="group" aria-label="스노우볼 테마" style={{'--tab-index':active,'--tab-count':landingMoods.length} as CSSProperties}><span className="v2-theme-drop" aria-hidden="true"/>{landingMoods.map((item,index)=><button key={item.id} type="button" aria-pressed={index===active} onClick={()=>setActive(index)}>{item.label}</button>)}</div></div>
      {showSearch && <form className="landing-search v2-search-card" role="search" aria-label="여행 조건 검색" onFocusCapture={()=>setFocused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))setFocused(false)}} onSubmit={e=>{e.preventDefault();setSearching(true)}}>
        <HeroSelect className="hero-search-theme" label="어떤 여행" name="theme" value={searchTheme} onChange={setSearchTheme} options={themes.map(t=>({value:t.id,label:themeLabels[t.id]}))}/>
        <HeroDatePicker className="hero-search-date" label="출발 희망일" name="date" min={getEarliestDepartureDate()} value={searchDate} onChange={setSearchDate}/>
        <label className="hero-search-people"><span>함께할 인원</span><input type="number" name="travelers" min="1" step="1" value={travelers} readOnly={searchTheme==='romance'} onChange={event=>setTravelers(event.currentTarget.value)} aria-describedby={searchTheme==='romance'?'landing-honeymoon-help':undefined}/>{searchTheme==='romance'&&<small id="landing-honeymoon-help" className="sr-only">허니문은 2명 신청</small>}</label>
        <label className="hero-search-keyword"><span>떠나고 싶은 곳</span><input type="search" name="q" placeholder="여행지·상품명" aria-label="여행지·상품명"/></label>
        <button type="submit" className="hero-search-submit v2-search-submit" disabled={searching} aria-label="여행 찾기" title="여행 찾기"><span className="sr-only">여행 찾기</span><Icon name="search" size={28}/></button>
      </form>}
      <p className="sr-only" aria-live="polite">{mood.label} 스노우볼. {mood.scene}</p>
      {searching&&<div className="hero-search-loading"><PlaneLoader/></div>}
    </section>
  </div>
}
