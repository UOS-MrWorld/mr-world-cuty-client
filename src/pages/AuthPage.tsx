import { useState, type FormEvent, type KeyboardEvent } from 'react'
import { AppLink } from '../components/AppLink'
import { BrandMark } from '../components/BrandMark'
import { contactPattern } from '../data/bookingPolicy'
import { useAuth } from '../hooks/useAuth'
import { navigate } from '../hooks/useRoute'

export function safeNextPath(value?: string) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/my-trips'
  const url = new URL(value, window.location.origin)
  return url.origin === window.location.origin && !['/login', '/signup'].includes(url.pathname)
    ? `${url.pathname}${url.search}` : '/my-trips'
}

function formatContact(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

function contactCaret(value: string, digitCount: number) {
  if (digitCount <= 0) return 0
  let seen = 0
  for (let index = 0; index < value.length; index += 1) {
    if (/\d/.test(value[index])) seen += 1
    if (seen === digitCount) return index + 1
  }
  return value.length
}

export function AuthPage({ mode, next }: { mode: 'login' | 'signup'; next?: string }) {
  const signup = mode === 'signup'
  const auth = useAuth()
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [contact, setContact] = useState('')
  const destination = safeNextPath(next)
  const linkSuffix = `?next=${encodeURIComponent(destination)}`

  function contactKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const caret = input.selectionStart ?? 0
    if (event.key !== 'Backspace' || caret !== input.selectionEnd || input.value[caret - 1] !== '-') return
    event.preventDefault()
    const digitIndex = input.value.slice(0, caret).replace(/\D/g, '').length - 1
    const digits = input.value.replace(/\D/g, '')
    const next = formatContact(`${digits.slice(0, digitIndex)}${digits.slice(digitIndex + 1)}`)
    setContact(next)
    requestAnimationFrame(() => input.setSelectionRange(contactCaret(next, digitIndex), contactCaret(next, digitIndex)))
  }

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
          phoneNum: String(values.get('contact') ?? '').replace(/\D/g, ''),
          address: String(values.get('address') ?? ''),
          role: values.get('role') === 'STAFF' ? 'STAFF' : 'CUSTOMER',
        })
        form.reset()
        setContact('')
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
      <h1>{signup ? '여행의 시작, CUTY와 함께.' : '여행을 시작해 보세요.'}</h1>
      <p>고른 여행을 이어서 구성하고<br />신청한 여행과 출발 상태를 한곳에서 확인하세요</p>
    </section>
    <section className="auth-card surface-card" aria-labelledby="auth-form-heading">
      <h2 id="auth-form-heading">{signup ? '회원가입' : '로그인'}</h2>
      <p className="muted">CUTY 계정으로 여행과 신청 내역을 이어서 관리하세요.</p>
      <form className="auth-form" onSubmit={submit}>
          {signup && <fieldset className="auth-role-options">
            <legend>가입 유형</legend>
            <div>
              <label><input type="radio" name="role" value="CUSTOMER" defaultChecked required /><span><strong>고객</strong><small>여행 검색·구성·예약</small></span></label>
              <label><input type="radio" name="role" value="STAFF" required /><span><strong>직원</strong><small>상품·예약 운영 관리</small></span></label>
            </div>
          </fieldset>}
          <label className="field" htmlFor="auth-account">아이디<input id="auth-account" name="account" autoComplete={signup ? 'off' : 'username'} required minLength={4} maxLength={20} pattern="([a-zA-Z0-9_]|-){4,20}" placeholder="영문·숫자 4~20자" /></label>
          <label className="field" htmlFor="auth-password">비밀번호<input id="auth-password" name="password" type="password" autoComplete={signup ? 'new-password' : 'current-password'} required minLength={8} maxLength={64} placeholder="8자 이상" /></label>
          {signup && <>
            <label className="field" htmlFor="auth-confirm">비밀번호 확인<input id="auth-confirm" name="passwordConfirm" type="password" autoComplete="new-password" required minLength={8} onInput={event => event.currentTarget.setCustomValidity('')} /></label>
            <label className="field" htmlFor="auth-name">성명<input id="auth-name" name="name" autoComplete="off" required maxLength={40}/></label>
            <label className="field" htmlFor="auth-address">주소<input id="auth-address" name="address" autoComplete="off" required maxLength={160} /></label>
            <label className="field" htmlFor="auth-contact">연락처<input id="auth-contact" name="contact" type="tel" inputMode="numeric" autoComplete="tel" required pattern={contactPattern} placeholder="010-0000-0000" value={contact} onKeyDown={contactKeyDown} onChange={event => { const input = event.currentTarget; const digitCount = input.value.slice(0, input.selectionStart ?? input.value.length).replace(/\D/g, '').length; const next = formatContact(input.value); setContact(next); requestAnimationFrame(() => { const caret = contactCaret(next, digitCount); input.setSelectionRange(caret, caret) }) }} /></label>
          </>}
          <button className="button primary" type="submit" disabled={submitting}>{submitting ? '처리 중…' : signup ? '회원가입' : '로그인'}</button>
        </form>
      {(message || errorMessage) && <div className="notification-stack">
        {message && <div className="notice app-notification" role="status" onAnimationEnd={() => setMessage('')}><span>{message}</span><button className="notification-close" type="button" aria-label="알림 닫기" onClick={() => setMessage('')}>×</button></div>}
        {errorMessage && <div className="notice notice-error app-notification" role="alert" onAnimationEnd={() => setErrorMessage('')}><span>{errorMessage}</span><button className="notification-close" type="button" aria-label="알림 닫기" onClick={() => setErrorMessage('')}>×</button></div>}
      </div>}
      <p className="auth-switch">{signup ? '이미 계정이 있으신가요?' : 'CUTY가 처음이신가요?'} <AppLink href={`${signup ? '/login' : '/signup'}${linkSuffix}`}>{signup ? '로그인' : '회원가입'}</AppLink></p>
    </section>
  </div>
}
