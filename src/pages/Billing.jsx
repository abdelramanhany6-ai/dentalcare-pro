import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'

const methods = ['cash', 'card', 'transfer', 'wallet', 'instapay', 'other']
export default function Billing({ clinicId }) {
  const { t, language } = useLanguage()
  const locale = language === 'ar' ? 'ar-EG' : 'en-GB'
  const money = n => new Intl.NumberFormat(locale, { style: 'currency', currency: 'EGP', maximumFractionDigits: 2 }).format(Number(n || 0))
  const [patients, setPatients] = useState([])
  const [invoices, setInvoices] = useState([])
  const [form, setForm] = useState({ patient_id: '', total_amount: '', description: '', due_date: '' })
  const [payment, setPayment] = useState({})
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const methodLabel = m => ({ cash:t('كاش','Cash'),card:t('بطاقة','Card'),transfer:t('تحويل','Transfer'),wallet:t('محفظة','Wallet'),instapay:'InstaPay',other:t('أخرى','Other') }[m] || m)
  async function load() {
    const [p, i] = await Promise.all([
      supabase.from('patients').select('id,full_name,phone').eq('clinic_id', clinicId).order('full_name'),
      supabase.from('invoices').select('id,patient_id,invoice_number,total_amount,status,issued_at,due_date,description,payments(id,amount,method,paid_at)').eq('clinic_id', clinicId).neq('status','void').order('issued_at',{ascending:false})
    ])
    if(p.error) setError(p.error.message); else setPatients(p.data || [])
    if(i.error) setError(i.error.message); else setInvoices(i.data || [])
  }
  useEffect(() => { load() }, [clinicId])
  const rows = useMemo(() => invoices.map(inv => {
    const paid = (inv.payments || []).reduce((s,p) => s + Number(p.amount || 0), 0)
    return {...inv, patient:patients.find(p => p.id === inv.patient_id), paid, remaining:Math.max(0,Number(inv.total_amount || 0)-paid)}
  }).filter(r => !search || [r.patient?.full_name,r.patient?.phone,r.invoice_number].some(v => (v || '').toLowerCase().includes(search.toLowerCase()))), [invoices,patients,search])
  const totals = rows.reduce((a,r) => ({total:a.total+Number(r.total_amount||0),paid:a.paid+r.paid,balance:a.balance+r.remaining}),{total:0,paid:0,balance:0})
  async function createInvoice(e) {
    e.preventDefault(); setBusy(true); setError(''); setNotice('')
    const amount = Number(form.total_amount)
    if(!form.patient_id || !Number.isFinite(amount) || amount <= 0){setError(t('اختار المريض واكتب مبلغ صحيح.','Select a patient and enter a valid amount.'));setBusy(false);return}
    const {data:{user}} = await supabase.auth.getUser()
    const {error:err} = await supabase.from('invoices').insert({clinic_id:clinicId,patient_id:form.patient_id,invoice_number:'DC-'+Date.now(),total_amount:amount,description:form.description.trim()||null,due_date:form.due_date||null,created_by:user?.id||null})
    if(err) setError(err.message); else {setForm({patient_id:'',total_amount:'',description:'',due_date:''});setNotice(t('تم إنشاء الفاتورة.','Invoice created.'));await load()}
    setBusy(false)
  }
  async function addPayment(row) {
    const p = payment[row.id] || {}, amount = Number(p.amount)
    if(!Number.isFinite(amount)||amount<=0||amount>row.remaining){setError(t('مبلغ الدفعة غير صحيح أو أكبر من المتبقي.','Invalid payment amount or it exceeds the balance.'));return}
    setBusy(true);setError('');setNotice('')
    const {data:{user}} = await supabase.auth.getUser()
    const {error:err} = await supabase.from('payments').insert({clinic_id:clinicId,invoice_id:row.id,amount,method:p.method||'cash',recorded_by:user?.id||null})
    if(err) setError(err.message); else {setPayment(old=>({...old,[row.id]:{amount:'',method:'cash'}}));setNotice(t('تم تسجيل الدفعة.','Payment recorded.'));await load()}
    setBusy(false)
  }
  return <div className="page-stack">
    <div className="page-heading"><div><p className="eyebrow">{t('الحسابات والتحصيل','FINANCE')}</p><h1>{t('الحسابات والمدفوعات','Billing & Payments')}</h1><p className="muted">{t('فواتير المرضى والمدفوع والمتبقي وسجل الدفعات.','Patient invoices, paid amounts, balances and payment history.')}</p></div></div>
    <div className="stats-grid"><article className="stat-card"><span className="stat-label">{t('إجمالي الفواتير','Invoiced')}</span><strong>{money(totals.total)}</strong></article><article className="stat-card"><span className="stat-label">{t('المحصّل','Collected')}</span><strong>{money(totals.paid)}</strong></article><article className="stat-card"><span className="stat-label">{t('المتبقي','Outstanding')}</span><strong>{money(totals.balance)}</strong></article></div>
    <section className="panel"><div className="section-heading"><div><h2>{t('إنشاء فاتورة','Create invoice')}</h2><p className="muted">{t('سجّل تكلفة علاج على حساب المريض.','Add a treatment charge to a patient account.')}</p></div></div>
      <form className="patient-form" onSubmit={createInvoice}>
        <label>{t('المريض','Patient')}<select required value={form.patient_id} onChange={e=>setForm({...form,patient_id:e.target.value})}><option value="">{t('اختر المريض','Select patient')}</option>{patients.map(p=><option key={p.id} value={p.id}>{p.full_name}</option>)}</select></label>
        <label>{t('المبلغ بالجنيه','Amount (EGP)')}<input required type="number" min="0.01" step="0.01" value={form.total_amount} onChange={e=>setForm({...form,total_amount:e.target.value})}/></label>
        <label>{t('تاريخ الاستحقاق','Due date')}<input type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})}/></label>
        <label className="wide-field">{t('وصف العلاج','Treatment description')}<input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder={t('مثال: حشو ضرس','e.g. Tooth filling')}/></label>
        <button disabled={busy||!patients.length}>{t('حفظ الفاتورة','Save invoice')}</button>
      </form>
    </section>
    {error&&<p className="message">{error}</p>}{notice&&<p className="success-message">{notice}</p>}
    <section className="panel"><div className="section-heading"><div><h2>{t('فواتير المرضى','Patient invoices')}</h2><p className="muted">{rows.length} {t('فاتورة','invoices')}</p></div><input className="search-input" value={search} onChange={e=>setSearch(e.target.value)} placeholder={t('بحث باسم المريض أو رقم الفاتورة','Search patient or invoice')}/></div>
      <div className="table-wrap"><table><thead><tr><th>{t('المريض','Patient')}</th><th>{t('الفاتورة','Invoice')}</th><th>{t('الإجمالي','Total')}</th><th>{t('المدفوع','Paid')}</th><th>{t('المتبقي','Balance')}</th><th>{t('الحالة','Status')}</th><th>{t('تسجيل دفعة','Add payment')}</th></tr></thead><tbody>
      {rows.map(r=><tr key={r.id}><td><Link className="text-link" to={'/patients/'+r.patient_id}>{r.patient?.full_name||'—'}</Link></td><td>{r.invoice_number}</td><td>{money(r.total_amount)}</td><td>{money(r.paid)}</td><td><strong>{money(r.remaining)}</strong></td><td>{r.status==='paid'?t('مدفوعة','Paid'):r.status==='partially_paid'?t('مدفوعة جزئيًا','Part-paid'):t('غير مدفوعة','Unpaid')}</td><td>{r.remaining>0?<div className="payment-inline"><input type="number" min="0.01" max={r.remaining} step="0.01" placeholder="EGP" value={payment[r.id]?.amount??''} onChange={e=>setPayment(o=>({...o,[r.id]:{amount:e.target.value,method:o[r.id]?.method||'cash'}}))}/><select value={payment[r.id]?.method||'cash'} onChange={e=>setPayment(o=>({...o,[r.id]:{amount:o[r.id]?.amount||'',method:e.target.value}}))}>{methods.map(m=><option key={m} value={m}>{methodLabel(m)}</option>)}</select><button disabled={busy} onClick={()=>addPayment(r)}>{t('حفظ','Save')}</button></div>:<span className="success-message">{t('تم السداد','Settled')}</span>}</td></tr>)}
      {!rows.length&&<tr><td colSpan="7" className="empty-cell">{t('لا توجد فواتير بعد.','No invoices yet.')}</td></tr>}
      </tbody></table></div>
    </section>
    <section className="panel"><h2>{t('سجل الدفعات','Payment history')}</h2><div className="table-wrap"><table><thead><tr><th>{t('التاريخ','Date')}</th><th>{t('المريض','Patient')}</th><th>{t('الفاتورة','Invoice')}</th><th>{t('المبلغ','Amount')}</th><th>{t('طريقة الدفع','Method')}</th></tr></thead><tbody>
    {rows.flatMap(r=>(r.payments||[]).map(p=>({...p,patient:r.patient?.full_name,invoice:r.invoice_number}))).sort((a,b)=>new Date(b.paid_at)-new Date(a.paid_at)).map(p=><tr key={p.id}><td>{new Date(p.paid_at).toLocaleString(locale)}</td><td>{p.patient}</td><td>{p.invoice}</td><td>{money(p.amount)}</td><td>{methodLabel(p.method)}</td></tr>)}
    {!rows.some(r=>(r.payments||[]).length)&&<tr><td colSpan="5" className="empty-cell">{t('لا توجد دفعات مسجلة.','No payments recorded yet.')}</td></tr>}
    </tbody></table></div></section>
  </div>
}
