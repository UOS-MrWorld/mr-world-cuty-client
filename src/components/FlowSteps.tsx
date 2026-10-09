import { AppLink } from './AppLink'

export function FlowSteps({ tourId, step, search = '' }: { tourId: string; step: number; search?: string }) {
  const steps = [
    { label: '여행 구성', href: `/tours/${tourId}/configure` },
    { label: '신청·결제', href: `/tours/${tourId}/checkout` },
    { label: '신청 상세', href: `/tours/${tourId}/preview` },
  ]
  const current = step - 2
  return <nav className="flow-steps" aria-label="여행 신청 단계"><ol>{steps.map((item, index) => <li key={item.label} className={index === current ? 'current' : index < current ? 'visited' : ''} aria-current={index === current ? 'step' : undefined}>{index < current ? <AppLink href={`${item.href}${search}`}><span>0{index + 1}</span>{item.label}</AppLink> : <span className="step-label"><span>0{index + 1}</span>{item.label}</span>}</li>)}</ol></nav>
}
