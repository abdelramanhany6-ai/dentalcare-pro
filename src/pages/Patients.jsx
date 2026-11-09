import { useEffect,useMemo,useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'
export default function Patients({clinicId}) {
 const {t,language}=useLanguage(),locale=language==='ar'?'ar-EG':'en-GB'
 const [patients,setPatients]=useState([]),[form,setForm]=useState({full_name:'',phone:'',date_of_birth:''}),[search,setSearch]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false)
 const money=n=>new Intl.NumberFormat(locale,{style:'currency',currency:'EGP',maximumFractionDigits:0}).format(n||0)
 async function load(){
  const [p,i]=await Promise.all([
   supabase.from('patients').select('id,full_name,phone,date_of_birth,created_at').eq('clinic_id',clinicId).order('created_at',{ascending:false}),
   supabase.from('invoices').select('patient_id,total_amount,payments(amount)').eq('clinic_id',clinicId).in('status',['unpaid','partially_paid'])
  ])
  if(p.error)setError(p.error.message);else setPatients((p.data||[]).map(patient=>{const bills=(i.data||[]).filter(x=>x.patient_id===patient.id);const balance=bills.reduce((sum,x)=>sum+Math.max(0,Number(x.total_amount||0)-(x.payments||[]).reduce((s,v)=>s+Number(v.amount||0),0)),0);return {...patient,balance}}))
  if(i.error)setError(i.error.message)
 }
 useEffect(()=>{load()},[clinicId])
 const filtered=useMemo(()=>{const term=search.trim().toLowerCase();return !term?patients:patients.filter(p=>[p.full_name,p.phone].some(v=>(v||'').toLowerCase().includes(term)))},[patients,search])
 async function handleAdd(e){e.preventDefault();setBusy(true);setError('');const {error}=await supabase.from('patients').insert({clinic_id:clinicId,full_name:form.full_name.trim(),phone:form.phone.trim()||null,date_of_birth:form.date_of_birth||null});if(error)setError(error.message);else{setForm({full_name:'',phone:'',date_of_birth:''});await load()}setBusy(false)}
 return <div className="page-stack">
  <div className="page-heading"><div><p className="eyebrow">{t('قاعدة بيانات العيادة','CLINIC DATABASE')}</p><h1>{t('المرضى','Patients')}</h1><p className="muted">{t('إدارة ملفات المرضى والحسابات والتاريخ العلاجي.','Manage patient files, balances and treatment history.')}</p></div><span className="count-chip">{patients.length} {t('مريض','patients')}</span></div>
  <section className="panel"><div className="section-heading"><div><h2>{t('إضافة مريض جديد','Add a patient')}</h2><p className="muted">{t('أدخل البيانات الأساسية لفتح ملف جديد.','Enter basic details to create a patient file.')}</p></div></div>
   <form className="patient-form" onSubmit={handleAdd}>
    <label>{t('الاسم بالكامل','Full name')}<input value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} required/></label>
    <label>{t('رقم الهاتف','Phone number')}<input type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
    <label>{t('تاريخ الميلاد','Date of birth')}<input type="date" value={form.date_of_birth} onChange={e=>setForm({...form,date_of_birth:e.target.value})}/></label>
    <button type="submit" disabled={busy}>{busy?t('جاري الحفظ...','Saving...'):t('إضافة المريض','Add patient')}</button>
   </form>{error&&<p className="message">{error}</p>}
  </section>
  <section className="panel"><div className="section-heading"><div><h2>{t('قائمة المرضى','Patient list')}</h2><p className="muted">{t('افتح الملف لمراجعة تفاصيل المريض وحسابه.','Open a file to review patient details and account.')}</p></div><input className="search-input" placeholder={t('بحث بالاسم أو الهاتف...','Search name or phone...')} value={search} onChange={e=>setSearch(e.target.value)}/></div>
   <div className="table-wrap"><table><thead><tr><th>{t('الاسم','Name')}</th><th>{t('الهاتف','Phone')}</th><th>{t('تاريخ الميلاد','Birth date')}</th><th>{t('المتبقي عليه','Balance due')}</th><th>{t('تاريخ التسجيل','Registered')}</th><th>{t('الملف','File')}</th></tr></thead><tbody>
    {filtered.map(p=><tr key={p.id}><td><strong>{p.full_name}</strong></td><td>{p.phone||'—'}</td><td>{p.date_of_birth||'—'}</td><td><strong>{money(p.balance)}</strong></td><td>{new Date(p.created_at).toLocaleDateString(locale)}</td><td><Link className="text-link" to={'/patients/'+p.id}>{t('فتح الملف ←','Open file →')}</Link></td></tr>)}
    {!filtered.length&&<tr><td colSpan="6" className="empty-cell">{search?t('لا توجد نتائج مطابقة.','No matching patients.'):t('لا يوجد مرضى مسجلون بعد.','No patients registered yet.')}</td></tr>}
   </tbody></table></div>
  </section>
 </div>
}
