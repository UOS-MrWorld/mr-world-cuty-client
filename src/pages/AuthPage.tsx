import { useState, type FormEvent } from 'react'
import { AppLink } from '../components/AppLink'
import { BrandMark } from '../components/BrandMark'
import { Icon } from '../components/Icon'
import { demoContactPattern } from '../data/demoBookings'
import { useDemoSession } from '../hooks/useDemoSession'
import { useAuth } from '../hooks/useAuth'
import { navigate } from '../hooks/useRoute'

export function safeNextPath(value?: string) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/my-trips'
  const url = new URL(value, window.location.origin)
  return url.origin === window.location.origin && !['/login', '/signup'].includes(url.pathname)
    ? `${url.pathname}${url.search}` : '/my-trips'
}

export function AuthPage({ mode, next }: { mode: 'login' | 'signup'; next?: string }) {
  const signup = mode === 'signup'
  const { enterDemo } = useDemoSession()
  const auth = useAuth()
  const [accountType, setAccountType] = useState<'customer' | 'staff'>('customer')
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const destination = safeNextPath(next)
  const linkSuffix = `?next=${encodeURIComponent(destination)}`

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    if (!form.reportValidity()) return
    const values = new FormData(form)
    if (signup) {
      if (values.get('password') !== values.get('passwordConfirm')) {
        const confirmation = form.elements.namedItem('passwordConfirm') as HTMLInputElement
        confirmation.setCustomValidity('비밀번호가 일치하지 않습니다.')
        confirmation.reportValidity()
        return
      }
    }
    setSubmitting(true)
    setMessage('')
    setErrorMessage('')
    try {
      if (signup) {
        await auth.signup({
          loginId: String(values.get('account') ?? ''),
          password: String(values.get('password') ?? ''),
          confirmPassword: String(values.get('passwordConfirm') ?? ''),
          name: String(values.get('name') ?? ''),
          phoneNum: String(values.get('contact') ?? ''),
          address: String(values.get('address') ?? ''),
          role: 'CUSTOMER',
        })
        form.reset()
        setMessage('회원가입이 완료되었습니다. 로그인 화면에서 새 계정으로 로그인해 주세요.')
      } else {
        const session = await auth.login({
          loginId: String(values.get('account') ?? ''),
          password: String(values.get('password') ?? ''),
        })
        const target = destination.startsWith('/staff') && session.role !== 'STAFF'
          ? '/my-trips'
          : session.role === 'STAFF' && !destination.startsWith('/staff') ? '/staff/tours' : destination
        navigate(target)
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '요청을 처리하지 못했습니다. 다시 시도해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return <div className="auth-layout">
    <section className="auth-intro">
      <BrandMark large />
      <p className="eyebrow">CURATE YOUR TRAVEL</p>
      <h1>{signup ? <>여행의 시작,<br />CUTY와 함께.</> : <>다시 만나서<br />반가워요.</>}</h1>
      <p>고른 여행을 이어서 구성하고,<br />신청한 여행과 출발 상태를 한곳에서 확인하세요.</p>
      <AppLink className="text-link" href="/tours">여행 먼저 둘러보기 <Icon name="arrow" size={17} /></AppLink>
    </section>
    <section className="auth-card surface-card" aria-labelledby="auth-form-heading">
      <h2 id="auth-form-heading">{signup ? '회원가입' : '로그인'}</h2>
      <p className="muted">CUTY 계정으로 여행과 신청 내역을 이어서 관리하세요.</p>
      {signup && <div className="auth-account-types" role="group" aria-label="가입 유형">
        <button type="button" aria-pressed={accountType === 'customer'} onClick={() => { setAccountType('customer'); setMessage('') }}>고객</button>
        <button type="button" aria-pressed={accountType === 'staff'} onClick={() => { setAccountType('staff'); setMessage('') }}>직원</button>
      </div>}
      {signup && accountType === 'staff'
        ? <div className="notice"><strong>직원 권한은 별도 확인이 필요해요.</strong><p>초대·승인 등 직원 가입 방식은 아직 확정되지 않았습니다. 고객 가입으로 직원 권한이 부여되지 않습니다.</p></div>
        : <form className="auth-form" onSubmit={submit}>
          <label className="field" htmlFor="auth-account">계정<input id="auth-account" name="account" autoComplete={signup ? 'off' : 'username'} required minLength={4} maxLength={20} pattern="([a-zA-Z0-9_]|-){4,20}" placeholder="영문·숫자 4~20자" /></label>
          <label className="field" htmlFor="auth-password">비밀번호<input id="auth-password" name="password" type="password" autoComplete={signup ? 'new-password' : 'current-password'} required minLength={8} maxLength={64} placeholder="8자 이상" /></label>
          {signup && <>
            <label className="field" htmlFor="auth-confirm">비밀번호 확인<input id="auth-confirm" name="passwordConfirm" type="password" autoComplete="new-password" required minLength={8} onInput={event => event.currentTarget.setCustomValidity('')} /></label>
            <label className="field" htmlFor="auth-name">성명<input id="auth-name" name="name" autoComplete="off" required maxLength={40} placeholder="화면 검토에는 예시 이름을 사용해 주세요" /></label>
            <label className="field" htmlFor="auth-address">주소<input id="auth-address" name="address" autoComplete="off" required maxLength={160} /></label>
            <label className="field" htmlFor="auth-contact">연락처<input id="auth-contact" name="contact" type="tel" autoComplete="off" required pattern={demoContactPattern} placeholder="010-0000-0000" /></label>
          </>}
          <button className="button primary" type="submit" disabled={submitting}>{submitting ? '처리 중…' : signup ? '회원가입' : '로그인'} {!submitting && <Icon name="arrow" size={18} />}</button>
        </form>}
      {message && <p className="notice" role="status">{message}</p>}
      {errorMessage && <p className="notice notice-error" role="alert">{errorMessage}</p>}
      <p className="auth-switch">{signup ? '이미 계정이 있으신가요?' : 'CUTY가 처음이신가요?'} <AppLink href={`${signup ? '/login' : '/signup'}${linkSuffix}`}>{signup ? '로그인' : '회원가입'}</AppLink></p>
      <div className="demo-entry">
        <span className="demo-badge">DEMO</span><h3>화면을 먼저 체험해 보세요.</h3>
        <p>계정 인증 없이 화면 흐름을 확인하는 시연입니다. 개인정보·결제 입력은 메모리에만 남고 새로고침하면 사라집니다.</p>
        <button className="button primary" type="button" onClick={() => { enterDemo('customer'); navigate(destination.startsWith('/staff') ? '/my-trips' : destination) }}>고객 시연 모드 <Icon name="arrow" size={18} /></button>
        <button className="button secondary" type="button" onClick={() => { enterDemo('staff'); navigate(destination.startsWith('/staff/') ? destination : '/staff/tours') }}>직원 화면 시연 <Icon name="arrow" size={18} /></button>
      </div>
    </section>
  </div>
}
