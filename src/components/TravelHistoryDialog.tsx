import { AppLink } from './AppLink'
import { Icon } from './Icon'
import { PreviewDialog } from './PreviewDialog'
import { gradeLabels } from '../data/configuration'
import { formatPrice } from '../data/travel'
import { useDemoSession } from '../hooks/useDemoSession'

export function TravelHistoryDialog() {
  const { historyOpen, bookings, closeHistory } = useDemoSession()
  if (!historyOpen) return null
  function dismiss() {
    closeHistory()
    // 시연 진입 버튼은 이동한 화면에서 사라지므로 현재 화면의 제목으로 돌아갑니다.
    requestAnimationFrame(() => {
      const heading = document.querySelector<HTMLElement>('main h1')
      heading?.setAttribute('tabindex', '-1')
      heading?.focus({ preventScroll: true })
    })
  }
  return <PreviewDialog title="나의 여행 내역" onClose={dismiss}>
    <p className="history-intro"><span className="demo-badge">DEMO</span> 이번 시연에서 신청한 여행을 최근순으로 보여드려요.</p>
    {bookings.length ? <div className="history-list">{bookings.slice(0, 3).map(booking => <article key={booking.id}>
      <img src={booking.image} alt="" />
      <div><h3>{booking.title}</h3><p>{booking.draft.date} · {booking.duration}</p><p>{gradeLabels[booking.draft.grade]} · {booking.draft.travelers}명 · {formatPrice(booking.amount)}원</p><span className="status-pill">{booking.status === 'paid' ? '결제 완료 · 시연' : '신청 취소 · 시연'}</span></div>
    </article>)}</div> : <div className="history-empty"><Icon name="compass" size={38} /><h3>아직 여행 내역이 없어요.</h3><p>첫 여행을 신청하면 상품·기간·등급·금액을 여기서 다시 확인할 수 있어요.</p></div>}
    <p className="summary-note">실제 이전 여행은 회원 API 연결 후 표시됩니다. 여행 완료 건과 신청·결제 건을 함께 확인할 수 있는 구성을 준비했습니다.</p>
    <div className="action-row"><button className="button secondary" type="button" onClick={dismiss}>계속 둘러보기</button><AppLink className="button primary" href="/my-trips?tab=history" onClick={dismiss}>전체 내역 보기 <Icon name="arrow" size={17} /></AppLink></div>
  </PreviewDialog>
}
