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
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.user?.id) {
          const { error: notifyError } = await supabase.functions.invoke('notify-registration', {
            body: { user_id: data.user.id },
          })
          if (notifyError) {
            setMessage('تم استلام طلب التسجيل، لكنه لم يُرسل إشعار البريد بعد. سيظل الطلب في انتظار موافقتك.')
          } else {
            setMessage('تم إرسال طلب التسجيل بنجاح. حسابك سيظل موقوفاً حتى تتم الموافقة عليه.')
          }
        } else {
          setMessage('تم إنشاء طلب التسجيل. راجع بريدك لتأكيد الحساب، وبعدها انتظر الموافقة.')
        }
      }
    } catch (error) {
      setMessage(error.message || 'حدث خطأ غير متوقع.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-box">
      <h1>DentalCare Pro</h1>
      <form onSubmit={handleSubmit}>
        <label>
          البريد الإلكتروني
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label>
          كلمة المرور
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} />
        </label>
        <button type="submit" disabled={busy}>
          {busy ? 'جاري التنفيذ...' : mode === 'signin' ? 'تسجيل الدخول' : 'إرسال طلب التسجيل'}
        </button>
      </form>
      <button className="link" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage('') }}>
        {mode === 'signin' ? 'ليس لديك حساب؟ اطلب إنشاء حساب' : 'لديك حساب بالفعل؟ سجّل الدخول'}
      </button>
      {message && <p className="message">{message}</p>}
    </div>
  )
}
