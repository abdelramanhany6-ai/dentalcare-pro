import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Patients({ clinicId }) {
  const [patients, setPatients] = useState([])
  const [form, setForm] = useState({ full_name: '', phone: '', date_of_birth: '' })
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    const { data, error } = await supabase.from('patients').select('id,full_name,phone,date_of_birth,created_at').eq('clinic_id', clinicId).order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setPatients(data || [])
  }

  useEffect(() => { load() }, [clinicId])

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase()
    if (!term) return patients
    return patients.filter((patient) => [patient.full_name, patient.phone].some((value) => (value || '').toLocaleLowerCase().includes(term)))
  }, [patients, search])

  async function handleAdd(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabase.from('patients').insert({ clinic_id: clinicId, full_name: form.full_name.trim(), phone: form.phone.trim() || null, date_of_birth: form.date_of_birth || null })
    if (error) setError(error.message)
    else {
      setForm({ full_name: '', phone: '', date_of_birth: '' })
      await load()
    }
    setBusy(false)
  }

  return (
    <div className="page-stack">
      <div className="page-heading"><div><p className="eyebrow">قاعدة بيانات العيادة</p><h1>المرضى</h1><p className="muted">إدارة ملفات المرضى والوصول إلى تاريخهم العلاجي.</p></div><span className="count-chip">{patients.length} مريض</span></div>
      <section className="panel">
        <div className="section-heading"><div><h2>إضافة مريض جديد</h2><p className="muted">أدخل البيانات الأساسية لفتح ملف جديد.</p></div></div>
        <form className="patient-form" onSubmit={handleAdd}>
          <label>الاسم بالكامل<input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></label>
          <label>رقم الهاتف<input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          <label>تاريخ الميلاد<input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} /></label>
          <button type="submit" disabled={busy}>{busy ? 'جاري الحفظ...' : 'إضافة إلى المرضى'}</button>
        </form>
        {error && <p className="message">{error}</p>}
      </section>
      <section className="panel">
        <div className="section-heading"><div><h2>قائمة المرضى</h2><p className="muted">اضغط على اسم المريض لفتح ملفه.</p></div><input className="search-input" placeholder="بحث بالاسم أو الهاتف..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <div className="table-wrap"><table><thead><tr><th>الاسم</th><th>الهاتف</th><th>تاريخ الميلاد</th><th>تاريخ التسجيل</th><th>الملف</th></tr></thead><tbody>
          {filtered.map((patient) => <tr key={patient.id}><td><strong>{patient.full_name}</strong></td><td>{patient.phone || '—'}</td><td>{patient.date_of_birth || '—'}</td><td>{new Date(patient.created_at).toLocaleDateString('ar-EG')}</td><td><Link className="text-link" to={`/patients/${patient.id}`}>فتح الملف ←</Link></td></tr>)}
          {filtered.length === 0 && <tr><td colSpan={5} className="empty-cell">{search ? 'لا توجد نتائج مطابقة.' : 'لا يوجد مرضى مسجلون بعد.'}</td></tr>}
        </tbody></table></div>
      </section>
    </div>
  )
}
