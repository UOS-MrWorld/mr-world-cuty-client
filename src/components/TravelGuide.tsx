import { useEffect, useState } from 'react'
import { PreviewDialog } from './PreviewDialog'
import { AppLink } from './AppLink'
import { useReducedMotion } from '../hooks/useReducedMotion'
const steps = [
  {title:'어떤 여행을 떠날까요?',text:'허니문, 효도, 골프, 트레킹. 함께할 사람과 좋아하는 여행을 골라보세요'},
  {title:'내 취향에 맞게 구성하세요',text:'호텔, 이동 방법, 식사를 선택하고 기본 구성과 달라진 금액을 확인하세요'},
  {title:'함께 떠날 사람을 알려주세요',text:'대표자와 동행자의 정보를 확인한 뒤 시연용 결제로 신청 흐름을 경험할 수 있어요'},
  {title:'여행이 모이면 출발을 준비해요.',text:'같은 상품과 출발일의 결제 인원을 모아요. 최종 출발 여부는 여행 7일 전에 정해집니다'},
]
export function TravelGuide({onClose}:{onClose:()=>void}) {
  const [step,setStep]=useState(0)
  const [paused,setPaused]=useState(false)
  const reduced=useReducedMotion()
  useEffect(()=>{if(paused||reduced||step===steps.length-1)return;const timer=window.setTimeout(()=>setStep(s=>s+1),5500);return()=>clearTimeout(timer)},[step,paused,reduced])
  return <PreviewDialog title="CUTY 이용 안내" onClose={onClose}><div className="travel-guide" onFocusCapture={()=>setPaused(true)}><p className="guide-slogan">Curate Your Travel</p><div className="guide-step" key={step}><span>{String(step+1).padStart(2,'0')} / 04</span><h3>{steps[step].title}</h3><p>{steps[step].text}</p></div><div className="guide-progress" aria-label="안내 순서">{steps.map((item,i)=><button type="button" key={item.title} aria-label={`${i+1}단계 ${item.title}`} aria-pressed={step===i} onClick={()=>setStep(i)}>{i+1}</button>)}</div><div className="guide-actions">{step>0&&<button className="button secondary" onClick={()=>setStep(s=>s-1)}>이전</button>}{step<steps.length-1?<button className="button primary" onClick={()=>setStep(s=>s+1)}>다음</button>:<AppLink className="button primary" href="/tours" onClick={onClose}>여행 둘러보기</AppLink>}</div><small>현재는 디자인 초안·시연 모드이며 실제 결제는 이루어지지 않습니다.</small></div></PreviewDialog>
}
