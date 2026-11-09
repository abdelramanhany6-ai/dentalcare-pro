import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'

const money = (value, language) => new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 2 }).format(Number(value || 0))

export default function PatientFinance({ patientId, clinicId }) {
  const { language, t } = useLanguage()
  const [invoices, setInvoices] = useState([])
  const [payments, setPayments] = useState([])
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [method, setMethod] = useState('cash')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.from('invoices')
      .select('id,invoice_number,description,total_amount,status,issued_at,due_date,payments(id,amount,method,paid_at)')
      .eq('clinic_id', clinicId).eq('patient_id', patientId).order('issued_at', { ascending: false })
    if (error) setError(error.message)
    else {
      const list = data || []
      setInvoices(list)
      setPayments(list.flatMap((invoice) => (invoice.payments || []).map((payment) => ({ ...payment, invoice_number: invoice.invoice_number }))).sort((a,b) => new Date(b.paid_at)-new Date(a.paid_at)))
      setSelectedInvoice((current) => list.some((item) => item.id === current) ? current : (list.find((item) => item.status !== 'paid' && item.status !== 'void')?.id || ''))
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [patientId, clinicId])

  const totals = useMemo(() => invoices.reduce((acc, invoice) => {
    const paid = (invoice.payments || []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    acc.total += Number(invoice.total_amount || 0)
    acc.paid += paid
    acc.balance += Math.max(0, Number(invoice.total_amount || 0) - paid)
    return acc
  }, { total: 0, paid: 0, balance: 0 }), [invoices])

  async function createInvoice(event) {
    event.preventDefault()
    setBusy(true); setError(''); setSuccess('')
    const { data: userData } = await supabase.auth.getUser()
    const invoiceNumber = `INV-${Date.now().toString().slice(-10)}`
    const { error } = await supabase.from('invoices').insert({
      clinic_id: clinicId, patient_id: patientId, invoice_number: invoiceNumber,
      description: description.trim() || null, total_amount: Number(amount), due_date: dueDate || null,
      created_by: userData.user?.id || null,
    })
    if (error) setError(error.message)
    else {
      setDescription(''); setAmount(''); setDueDate('')
      setSuccess(t('تم إنشاء الفاتورة بنجاح.','Invoice created successfully.'))
      await load()
    }
    setBusy(false)
  }

  async function addPayment(event) {
    event.preventDefault()
    setBusy(true); setError(''); setSuccess('')
    const invoice = invoices.find((item) => item.id === selectedInvoice)
    if (!invoice) { setError(t('اختر فاتورة أولاً.','Choose an invoice first.')); setBusy(false); return }
    const paid = (invoice.payments || []).reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    const balance = Number(invoice.total_amount) - paid
    if (Number(paymentAmount) <= 0 || Number(paymentAmount) > balance) {
      setError(t('قيمة الدفعة يجب أن تكون أكبر من صفر ولا تتجاوز المتبقي.','Payment must be greater than zero and cannot exceed the remaining balance.'))
      setBusy(false); return
    }
    const { data: userData } = await supabase.auth.getUser()
    const { error } = await supabase.from('payments').insert({
      clinic_id: clinicId, invoice_id: selectedInvoice, amount: Number(paymentAmount), method,
      recorded_by: userData.user?.id || null,
    })
    if (error) setError(error.message)
    else {
      setPaymentAmount('')
      setSuccess(t('تم تسجيل الدفعة وتحديث رصيد الفاتورة.','Payment recorded and invoice balance updated.'))
      await load()
    }
    setBusy(false)
  }

  const methodName = (value) => ({
    cash: t('نقدي','Cash'), card: t('بطاقة','Card'), transfer: t('تحويل بنكي','Bank transfer'),
    wallet: t('محفظة إلكترونية','E-wallet'), instapay: 'Instapay', other: t('أخرى','Other'),
  }[value] || value)

  return <section className="panel finance-panel">
    <div className="section-heading"><div><h2>{t('الحساب المالي للمريض','Patient account')}</h2><p className="muted">{t('الفواتير والمدفوعات والرصيد المتبقي','Invoices, payments and outstanding balance')}</p></div></div>
    <div className="finance-stats">
      <article><span>{t('إجمالي العلاج','Treatment total')}</span><strong>{money(totals.total, language)}</strong></article>
      <article><span>{t('إجمالي المدفوع','Total paid')}</span><strong>{money(totals.paid, language)}</strong></article>
      <article><span>{t('المتبقي على المريض','Outstanding')}</span><strong className={totals.balance > 0 ? 'balance-due' : 'balance-clear'}>{money(totals.balance, language)}</strong></article>
    </div>
    {error && <p className="message">{error}</p>}{success && <p className="success-message">{success}</p>}
    <div className="finance-forms">
      <form className="finance-form" onSubmit={createInvoice}>
        <h3>{t('إضافة فاتورة علاج','Create treatment invoice')}</h3>
        <label>{t('وصف العلاج','Treatment description')}<input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('مثال: حشو عصب','e.g. Root canal')} /></label>
        <label>{t('إجمالي الفاتورة (جنيه)','Invoice total (EGP)')}<input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /></label>
        <label>{t('تاريخ الاستحقاق (اختياري)','Due date (optional)')}<input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></label>
        <button type="submit" disabled={busy}>{t('إنشاء الفاتورة','Create invoice')}</button>
      </form>
      <form className="finance-form" onSubmit={addPayment}>
        <h3>{t('تسجيل دفعة','Record a payment')}</h3>
        <label>{t('الفاتورة','Invoice')}<select value={selectedInvoice} onChange={(e) => setSelectedInvoice(e.target.value)} required>
          <option value="">{t('اختر فاتورة مستحقة','Select an open invoice')}</option>
          {invoices.filter((invoice) => invoice.status !== 'paid' && invoice.status !== 'void').map((invoice) => {
            const paid = (invoice.payments || []).reduce((sum,p) => sum + Number(p.amount || 0),0)
            return <option key={invoice.id} value={invoice.id}>{invoice.invoice_number} — {money(Number(invoice.total_amount)-paid, language)}</option>
          })}
        </select></label>
        <label>{t('مبلغ الدفعة (جنيه)','Payment amount (EGP)')}<input type="number" min="0.01" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} required /></label>
        <label>{t('طريقة الدفع','Payment method')}<select value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="cash">{t('نقدي','Cash')}</option><option value="card">{t('بطاقة','Card')}</option><option value="transfer">{t('تحويل بنكي','Bank transfer')}</option><option value="wallet">{t('محفظة إلكترونية','E-wallet')}</option><option value="instapay">Instapay</option><option value="other">{t('أخرى','Other')}</option>
        </select></label>
        <button type="submit" disabled={busy || !selectedInvoice}>{t('تسجيل الدفعة','Save payment')}</button>
      </form>
    </div>
    <h3 className="finance-subtitle">{t('الفواتير','Invoices')}</h3>
    {loading ? <p className="muted">{t('جاري تحميل الحساب...','Loading account...')}</p> : invoices.length === 0 ? <div className="empty-state">{t('لا توجد فواتير لهذا المريض حتى الآن.','No invoices for this patient yet.')}</div> :
      <div className="table-wrap"><table><thead><tr><th>{t('رقم الفاتورة','Invoice')}</th><th>{t('التفاصيل','Description')}</th><th>{t('الإجمالي','Total')}</th><th>{t('المدفوع','Paid')}</th><th>{t('المتبقي','Balance')}</th><th>{t('الحالة','Status')}</th></tr></thead><tbody>
        {invoices.map((invoice) => {
          const paid = (invoice.payments || []).reduce((sum,p) => sum + Number(p.amount || 0),0)
          return <tr key={invoice.id}><td><strong>{invoice.invoice_number}</strong></td><td>{invoice.description || '—'}</td><td>{money(invoice.total_amount, language)}</td><td>{money(paid, language)}</td><td>{money(Math.max(0,Number(invoice.total_amount)-paid), language)}</td><td><span className={`status status-${invoice.status}`}>{t(invoice.status === 'paid' ? 'مدفوعة' : invoice.status === 'partially_paid' ? 'مدفوعة جزئياً' : invoice.status === 'void' ? 'ملغاة' : 'غير مدفوعة', invoice.status === 'paid' ? 'Paid' : invoice.status === 'partially_paid' ? 'Partially paid' : invoice.status === 'void' ? 'Void' : 'Unpaid')}</span></td></tr>
        })}
      </tbody></table></div>}
    <h3 className="finance-subtitle">{t('سجل الدفعات','Payment history')}</h3>
    {payments.length === 0 ? <p className="muted">{t('لم يتم تسجيل دفعات بعد.','No payments recorded yet.')}</p> : <div className="table-wrap"><table><thead><tr><th>{t('التاريخ','Date')}</th><th>{t('الفاتورة','Invoice')}</th><th>{t('المبلغ','Amount')}</th><th>{t('طريقة الدفع','Method')}</th></tr></thead><tbody>
      {payments.map((payment) => <tr key={payment.id}><td>{new Date(payment.paid_at).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-GB')}</td><td>{payment.invoice_number}</td><td>{money(payment.amount, language)}</td><td>{methodName(payment.method)}</td></tr>)}
    </tbody></table></div>}
  </section>
}
