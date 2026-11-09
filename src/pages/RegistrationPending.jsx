import { supabase } from '../lib/supabase'

export default function RegistrationPending({ status }) {
  const content = status === 'rejected'
    ? { title: 'لم تتم الموافقة على طلبك', detail: 'تم رفض طلب التسجيل. إذا كنت تعتقد أن هذا خطأ، تواصل مع إدارة النظام.' }
    : status === 'missing'
      ? { title: 'لا يوجد طلب تسجيل معلق', detail: 'لم نتمكن من العثور على طلب تسجيل لهذا الحساب. سجّل الخروج واطلب إنشاء حساب مرة أخرى.' }
      : { title: 'طلبك قيد المراجعة', detail: 'استلمنا طلبك. لن تتمكن من الوصول إلى بيانات العيادة قبل موافقة الإدارة.' }

  return (
    <div className="auth-box">
      <h1>{content.title}</h1>
      <p className="muted">{content.detail}</p>
      <button onClick={() => supabase.auth.signOut()}>تسجيل الخروج</button>
    </div>
  )
}
