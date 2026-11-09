import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const number = (value) => new Intl.NumberFormat('ar-EG').format(value || 0)
const money = (value) => new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(value || 0)

export default function Dashboard({ clinicId }) {
  const [stats, setStats] = useState({ patients: 0, today: 0, unpaid: 0 })
  const [upcoming, setUpcoming] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError('')
      const start = new Date()
      start.setHours(0, 0, 0, 0)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      const [patients, today, invoices, next] = await Promise.all([
        supabase.from('patients').select('id', { count: 'exact', head: true }).eq('clinic_id', clinicId),
        supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('clinic_id', clinicId).gte('starts_at', start.toISOString()).lt('starts_at', end.toISOString()).neq('status', 'cancelled'),
        supabase.from('invoices').select('total_amount,status').eq('clinic_id', clinicId).in('status', ['unpaid', 'partially_paid']),
        supabase.from('appointments').select('id,starts_at,status,patients(full_name)').eq('clinic_id', clinicId).gte('starts_at', new Date().toISOString()).neq('status', 'cancelled').order('starts_at').limit(5),
      ])
      if (!active) return
      const failed = [patients, today, invoices, next].find((result) => result.error)
      if (failed) setError(failed.error.message)
      const unpaid = (invoices.data || []).reduce((sum, invoice) => sum + Number(invoice.total_amount || 0), 0)
      setStats({ patients: patients.count || 0, today: today.count || 0, unpaid })
      setUpcoming(next.data || [])
      setLoading(false)
    }
    load()
    return () => { active = false }
  }, [clinicId])

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div><p className="eyebrow">نظرة عامة</p><h1>لوحة التحكم</h1><p className="muted">ملخص سريع لحركة العيادة اليوم.</p></div>
        <span className="date-chip">{new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
      </div>
      {error && <p className="message">{error}</p>}
      <div className="stats-grid">
        <article className="stat-card"><span className="stat-label">إجمالي المرضى</span><strong>{loading ? '—' : number(stats.patients)}</strong><span className="stat-hint">ملفات المرضى المسجلة</span></article>
        <article className="stat-card"><span className="stat-label">مواعيد اليوم</span><strong>{loading ? '—' : number(stats.today)}</strong><span className="stat-hint">باستثناء المواعيد الملغاة</span></article>
        <article className="stat-card"><span className="stat-label">مبالغ مستحقة</span><strong>{loading ? '—' : money(stats.unpaid)}</strong><span className="stat-hint">فواتير غير مدفوعة أو مدفوعة جزئياً</span></article>
      </div>
      <section className="panel">
        <div className="section-heading"><div><h2>المواعيد القادمة</h2><p className="muted">أقرب المواعيد المسجلة في العيادة.</p></div><Link className="text-link" to="/appointments">عرض كل المواعيد</Link></div>
        {loading ? <p className="muted">جاري تحميل المواعيد...</p> : upcoming.length === 0 ? <div className="empty-state">لا توجد مواعيد قادمة حالياً.</div> : (
          <div className="appointment-list">{upcoming.map((item) => <div className="appointment-row" key={item.id}><div><strong>{item.patients?.full_name || 'مريض'}</strong><span className="muted">{new Date(item.starts_at).toLocaleString('ar-EG')}</span></div><span className={`status status-${item.status}`}>{item.status === 'scheduled' ? 'مجدول' : item.status === 'completed' ? 'مكتمل' : item.status}</span></div>)}</div>
        )}
      </section>
      <div className="quick-links"><Link to="/patients" className="quick-link"><strong>إدارة المرضى</strong><span>إضافة مريض أو فتح ملفه الطبي ←</span></Link><Link to="/appointments" className="quick-link"><strong>تنظيم المواعيد</strong><span>مراجعة جدول الحجوزات ←</span></Link></div>
    </div>
  )
}
