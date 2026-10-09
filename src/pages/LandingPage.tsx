import { useEffect, useState } from 'react'
import { Icon } from '../components/Icon'
import { AppLink } from '../components/AppLink'
import { BrandMark } from '../components/BrandMark'
import { landingMoods } from '../data/landing'
import { themes } from '../data/travel'
import { themeLabels } from '../data/catalogue'
import { getEarliestDepartureDate } from '../data/configuration'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { navigate } from '../hooks/useRoute'
import { LiquidGlassLayer } from '../components/LiquidGlassLayer'
import { PlaneLoader } from '../components/PlaneLoader'
import { HeroDatePicker } from '../components/HeroDatePicker'
import { HeroSelect } from '../components/HeroSelect'
import type { GlobeMood } from '../types/landing'

export default function LandingPage({ onMoodChange }: { onMoodChange?: (mood: GlobeMood) => void }) {
  const [active,setActive]=useState(0)
  const [focused,setFocused]=useState(false)
  const [searching,setSearching]=useState(false)
  const [searchTheme,setSearchTheme]=useState('all')
  const [searchDate,setSearchDate]=useState('')
  const [travelers,setTravelers]=useState('2')
  const reduced=useReducedMotion()
  const mood=landingMoods[active]
  useEffect(()=>onMoodChange?.(mood.id),[mood.id,onMoodChange])
  useEffect(()=>{if(searchTheme==='romance'&&Number(travelers)%2!==0)setTravelers('2')},[searchTheme,travelers])
  useEffect(()=>{if(reduced||focused||searching)return;const timer=window.setInterval(()=>{if(!document.hidden)setActive(i=>(i+1)%landingMoods.length)},14000);return()=>clearInterval(timer)},[reduced,focused,searching])
  useEffect(()=>{if(!searching)return;const timer=window.setTimeout(()=>{const form=document.querySelector<HTMLFormElement>('.landing-search');if(!form)return;const data=new FormData(form);const params=new URLSearchParams();for(const key of ['theme','date','travelers','q']){const value=String(data.get(key)??'').trim();if(value&&value!=='all')params.set(key,value)}navigate(`/tours?${params}`)},650);return()=>clearTimeout(timer)},[searching])
  return <div className={`landing-experience mood-${mood.id}`}>
    <section className="landing-hero" aria-label="CUTY 테마 여행">
      <div className="landing-copy"><AppLink className="landing-hero-brand" href="/" aria-label="CUTY 홈"><BrandMark large/></AppLink><h1 key={mood.id}>{mood.title}</h1><p className="landing-description" key={`${mood.id}-description`}>{mood.description}</p><AppLink className="landing-guide-link" href="/tours"><strong>Curate Your Travel</strong><span>여행 둘러보기 ↗</span></AppLink></div>
      <form className="landing-search" role="search" aria-label="여행 조건 검색" onFocusCapture={()=>setFocused(true)} onBlurCapture={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node|null))setFocused(false)}} onSubmit={e=>{e.preventDefault();setSearching(true)}}>
        <LiquidGlassLayer/>
        <HeroSelect className="hero-search-theme" label="어떤 여행" name="theme" value={searchTheme} onChange={setSearchTheme} options={themes.map(t=>({value:t.id,label:themeLabels[t.id]}))}/>
        <HeroDatePicker className="hero-search-date" label="출발 희망일" name="date" min={getEarliestDepartureDate()} value={searchDate} onChange={setSearchDate}/>
        <HeroSelect className="hero-search-people" label="함께할 인원" name="travelers" value={travelers} onChange={setTravelers} options={Array.from({length:10},(_,i)=>i+1).filter(n=>searchTheme!=='romance'||n%2===0).map(n=>({value:String(n),label:`${n}명${searchTheme==='romance'?` · ${n/2}커플`:''}`}))}/>
        <label className="hero-search-keyword"><span>떠나고 싶은 곳</span><input type="search" name="q" placeholder="여행지·상품명" aria-label="여행지·상품명"/></label>
        <button type="submit" className="hero-search-submit" disabled={searching}>여행 찾기<Icon name="search" size={20}/></button>
      </form>
      <p className="sr-only" aria-live="polite">{mood.label} 스노우볼. {mood.scene}</p>
      {searching&&<div className="hero-search-loading"><PlaneLoader/></div>}
    </section>
  </div>
}
