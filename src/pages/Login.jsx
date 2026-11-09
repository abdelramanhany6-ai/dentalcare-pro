import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'
import LanguageToggle from '../components/LanguageToggle'

export default function Login() {
  const { t } = useLanguage()
  const [mode,setMode]=useState('signin'),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false)
  async function handleSubmit(e) {
    e.preventDefault();setBusy(true);setMessage('')
    try {
      if(mode==='signin'){const {error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error}
      else {
        const {data,error}=await supabase.auth.signUp({email,password});if(error)throw error
        if(data.user?.id){const {error:notifyError}=await supabase.functions.invoke('notify-registration',{body:{user_id:data.user.id}})
          setMessage(notifyError?t('تم استلام الطلب لكن تعذر إرسال إشعار البريد. سيظل الطلب في انتظار الموافقة.','Your request was received, but the email notification could not be sent. Approval is still pending.'):t('تم إرسال طلب التسجيل بنجاح. انتظر موافقة الإدارة.','Registration request sent. Please wait for admin approval.'))
        } else setMessage(t('راجع بريدك لتأكيد الحساب ثم انتظر الموافقة.','Check your email to confirm your account, then wait for approval.'))
      }
    } catch(error){setMessage(error.message||t('حدث خطأ غير متوقع.','An unexpected error occurred.'))} finally{setBusy(false)}
  }
  return <div className="auth-box"><div className="auth-top"><h1>DentalCare Pro</h1><LanguageToggle /></div>
    <form onSubmit={handleSubmit}>
      <label>{t('البريد الإلكتروني','Email address')}<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"/></label>
      <label>{t('كلمة المرور','Password')}<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8} autoComplete={mode==='signin'?'current-password':'new-password'}/></label>
      <button type="submit" disabled={busy}>{busy?t('جاري التنفيذ...','Please wait...'):mode==='signin'?t('تسجيل الدخول','Sign in'):t('إرسال طلب التسجيل','Request an account')}</button>
    </form>
    <button className="link" onClick={()=>{setMode(mode==='signin'?'signup':'signin');setMessage('')}}>{mode==='signin'?t('ليس لديك حساب؟ اطلب إنشاء حساب','No account? Request one'):t('لديك حساب بالفعل؟ سجّل الدخول','Already registered? Sign in')}</button>
    {message&&<p className="message">{message}</p>}
  </div>
}
