import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'
import LanguageToggle from '../components/LanguageToggle'
export default function RegistrationPending({status}) {
 const {t}=useLanguage()
 const content=status==='rejected'?{title:t('لم تتم الموافقة على طلبك','Your request was not approved'),detail:t('تم رفض طلب التسجيل. تواصل مع إدارة النظام إذا كنت تعتقد أن هذا خطأ.','Your registration was declined. Contact the administrator if you think this is a mistake.')}:
 status==='missing'?{title:t('لا يوجد طلب تسجيل معلق','No pending registration'),detail:t('لم نعثر على طلب لهذا الحساب. سجّل الخروج واطلب إنشاء حساب مرة أخرى.','No registration request was found. Sign out and request an account again.')}:
 {title:t('طلبك قيد المراجعة','Your request is under review'),detail:t('استلمنا طلبك. ستتمكن من الدخول بعد موافقة الإدارة.','We received your request. You can access the clinic after admin approval.')}
 return <div className="auth-box"><div className="auth-top"><h1>{content.title}</h1><LanguageToggle/></div><p className="muted">{content.detail}</p><button onClick={()=>supabase.auth.signOut()}>{t('تسجيل الخروج','Sign out')}</button></div>
}
