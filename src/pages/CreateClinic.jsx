import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'
import LanguageToggle from '../components/LanguageToggle'
export default function CreateClinic({onCreated}) {
  const {t}=useLanguage();const [name,setName]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false)
  async function handleSubmit(e){e.preventDefault();setBusy(true);setError('');const {data,error}=await supabase.rpc('create_clinic',{p_name:name});if(error)setError(error.message);else onCreated(data);setBusy(false)}
  return <div className="auth-box"><div className="auth-top"><h1>{t('إنشاء عيادة جديدة','Create your clinic')}</h1><LanguageToggle/></div><form onSubmit={handleSubmit}><label>{t('اسم العيادة','Clinic name')}<input value={name} onChange={e=>setName(e.target.value)} required/></label><button type="submit" disabled={busy}>{busy?t('جاري الإنشاء...','Creating...'):t('إنشاء','Create')}</button></form>{error&&<p className="message">{error}</p>}<button className="link" onClick={()=>supabase.auth.signOut()}>{t('تسجيل الخروج','Sign out')}</button></div>
}
