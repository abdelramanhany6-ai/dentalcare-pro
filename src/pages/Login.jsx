import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setMessage('')
    const action =
      mode === 'signin'
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password })
    const { error } = await action
    if (error) setMessage(error.message)
    else if (mode === 'signup') setMessage('تم إنشاء الحساب. لو فعّلت تأكيد الإيميل، راجع بريدك.')
    setBusy(false)
  }

  return (
    <div className="auth-box">
      <h1>DentalCare Pro</h1>
      <form onSubmit={handleSubmit}>
        <label>
          البريد الإلكتروني
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          كلمة المرور
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </label>
        <button type="submit" disabled={busy}>
          {mode === 'signin' ? 'تسجيل الدخول' : 'إنشاء حساب'}
        </button>
      </form>
      <button className="link" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
        {mode === 'signin' ? 'ليس لديك حساب؟ أنشئ حساباً' : 'لديك حساب؟ سجّل الدخول'}
      </button>
      {message && <p className="message">{message}</p>}
    </div>
  )
}
