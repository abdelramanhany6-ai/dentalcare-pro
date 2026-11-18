import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'
import LanguageToggle from '../components/LanguageToggle'

export default function Login() {
  const { t } = useLanguage()
  const recovery = new URLSearchParams(window.location.search).get('auth') === 'recovery'
  const [mode,setMode]=useState('signin'),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false)
  async function handleSubmit(e) {
    e.preventDefault();setBusy(true);setMessage('')
    try {
      if(recovery) {
        if(password.length<8) throw new Error(t('كلمة المرور يجب أن تكون 8 أحرف على الأقل.','Password must be at least 8 characters.'))
        if(password!==confirm) throw new Error(t('كلمتا المرور غير متطابقتين.','Passwords do not match.'))
        const {error}=await supabase.auth.updateUser({password}); if(error) throw error
        setMessage(t('تم تحديث كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.','Password updated. You can now sign in.'))
        await supabase.auth.signOut(); window.history.replaceState({},document.title,window.location.pathname); window.location.hash=''
      } else if(mode==='signin') { const {error}=await supabase.auth.signInWithPassword({email,password}); if(error) throw error }
      else if(mode==='forgot') {
        const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+'/?auth=recovery'}); if(error) throw error
        setMessage(t('إذا كان البريد مرتبطًا بحساب، فسيصلك رابط إعادة تعيين كلمة المرور.','If this email belongs to an account, a password reset link will be sent.'))
      } else {
        const {data,error}=await supabase.auth.signUp({email,password}); if(error) throw error
        if(data.user?.id){const {error:notifyError}=await supabase.functions.invoke('notify-registration',{body:{user_id:data.user.id}});setMessage(notifyError?t('تم استلام الطلب لكن تعذر إرسال إشعار البريد. سيظل الطلب في انتظار الموافقة.','Your request was received, but the email notification could not be sent. Approval is still pending.'):t('تم إرسال طلب التسجيل بنجاح. انتظر موافقة الإدارة.','Registration request sent. Please wait for admin approval.'))}
        else setMessage(t('راجع بريدك لتأكيد الحساب ثم انتظر الموافقة.','Check your email to confirm your account, then wait for approval.'))
      }
    } catch(error){setMessage(error.message||t('حدث خطأ غير متوقع.','An unexpected error occurred.'))} finally{setBusy(false)}
  }
  return <div className="auth-box"><div className="auth-top"><h1>DentalCare Pro</h1><LanguageToggle /></div>
    {recovery ? <><h2>{t('اختار كلمة مرور جديدة','Choose a new password')}</h2><form onSubmit={handleSubmit}><label>{t('كلمة المرور الجديدة','New password')}<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8} autoComplete="new-password"/></label><label>{t('تأكيد كلمة المرور','Confirm password')}<input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} required minLength={8} autoComplete="new-password"/></label><button type="submit" disabled={busy}>{busy?t('جارٍ الحفظ...','Saving...'):t('حفظ كلمة المرور','Save password')}</button></form></> : <><form onSubmit={handleSubmit}><label>{t('البريد الإلكتروني','Email address')}<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email"/></label>{mode!=='forgot'&&<label>{t('كلمة المرور','Password')}<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8} autoComplete={mode==='signin'?'current-password':'new-password'}/></label>}<button type="submit" disabled={busy}>{busy?t('جاري التنفيذ...','Please wait...'):mode==='signin'?t('تسجيل الدخول','Sign in'):mode==='forgot'?t('إرسال رابط إعادة التعيين','Send reset link'):t('إرسال طلب التسجيل','Request an account')}</button></form>{mode==='signin'&&<button className="link" onClick={()=>{setMode('forgot');setMessage('')}}>{t('نسيت كلمة المرور؟','Forgot password?')}</button>}<button className="link" onClick={()=>{setMode(mode==='signin'||mode==='forgot'?'signup':'signin');setMessage('')}}>{mode==='signup'?t('لديك حساب بالفعل؟ سجّل الدخول','Already registered? Sign in'):t('ليس لديك حساب؟ اطلب إنشاء حساب','No account? Request one')}</button></>}
    {message&&<p className="message">{message}</p>}
  </div>
}