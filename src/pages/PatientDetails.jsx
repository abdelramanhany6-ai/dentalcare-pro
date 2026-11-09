import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function PatientDetails({ clinicId }) {
  const { patientId } = useParams()
  const [patient, setPatient] = useState(null)
  const [records, setRecords] = useState([])
  const [form, setForm] = useState({ tooth_number: '', diagnosis: '', treatment: '', notes: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function load() {
    setLoading(true)
    const [patientResult, recordsResult] = await Promise.all([
      supabase.from('patients').select('id,full_name,phone,date_of_birth,notes,created_at').eq('id', patientId).eq('clinic_id', clinicId).maybeSingle(),
      supabase.from('dental_records').select('id,tooth_number,diagnosis,treatment,notes,recorded_at').eq('patient_id', patientId).eq('clinic_id', clinicId).order('recorded_at', { ascending: false }),
    ])
    if (patientResult.error) setError(patientResult.error.message)
    else setPatient(patientResult.data)
    if (recordsResult.error) setError(recordsResult.error.message)
    else setRecords(recordsResult.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [patientId, clinicId])

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    const { error } = await supabase.from('dental_records').insert({
      clinic_id: clinicId,
      patient_id: patientId,
      tooth_number: form.tooth_number || null,
      diagnosis: form.diagnosis || null,
      treatment: form.treatment || null,
      notes: form.notes || null,
    })
    if (error) setError(error.message)
    else {
      setForm({ tooth_number: '', diagnosis: '', treatment: '', notes: '' })
      setSuccess('تم حفظ الزيارة في الملف الطبي.')
      await load()
    }
    setSaving(false)
  }

  if (loading) return <p className="center">جاري تحميل الملف الطبي...</p>
  if (!patient) return <section><p className="message">{error || 'لم يتم العثور على المريض أو لا تملك صلاحية الوصول إليه.'}</p><Link to="/patients" className="text-link">العودة إلى المرضى</Link></section>

  return (
    <div className="page-stack">
      <Link to="/patients" className="text-link">← العودة إلى قائمة المرضى</Link>
      <section className="panel patient-summary">
        <div><p className="eyebrow">ملف المريض</p><h1>{patient.full_name}</h1><p className="muted">{patient.phone || 'لا يوجد رقم هاتف مسجل'}</p></div>
        <div className="patient-meta"><span>تاريخ الميلاد</span><strong>{patient.date_of_birth || 'غير مسجل'}</strong><span>تاريخ التسجيل</span><strong>{new Date(patient.created_at).toLocaleDateString('ar-EG')}</strong></div>
      </section>
      <section className="panel">
        <div className="section-heading"><div><h2>إضافة سجل علاجي</h2><p className="muted">سجّل التشخيص والإجراء بعد مراجعتهما واعتمادهما من الطبيب.</p></div></div>
        <form className="record-form" onSubmit={handleSubmit}>
          <label>رقم السن<input value={form.tooth_number} onChange={(e) => setForm({ ...form, tooth_number: e.target.value })} placeholder="مثال: 16" /></label>
          <label>التشخيص<input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} /></label>
          <label>العلاج / الإجراء<input value={form.treatment} onChange={(e) => setForm({ ...form, treatment: e.target.value })} /></label>
          <label className="wide-field">ملاحظات<textarea rows="3" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
          <div className="wide-field"><button disabled={saving} type="submit">{saving ? 'جاري الحفظ...' : 'حفظ السجل العلاجي'}</button></div>
        </form>
        {error && <p className="message">{error}</p>}{success && <p className="success-message">{success}</p>}
      </section>
      <section className="panel">
        <div className="section-heading"><div><h2>التاريخ الطبي للأسنان</h2><p className="muted">{records.length} سجل علاجي</p></div></div>
        {records.length === 0 ? <div className="empty-state">لا توجد سجلات علاجية لهذا المريض حتى الآن.</div> : <div className="record-list">{records.map((record) => <article className="record-card" key={record.id}><div className="record-date">{new Date(record.recorded_at).toLocaleString('ar-EG')}</div><div className="record-fields">{record.tooth_number && <p><b>السن:</b> {record.tooth_number}</p>}{record.diagnosis && <p><b>التشخيص:</b> {record.diagnosis}</p>}{record.treatment && <p><b>العلاج:</b> {record.treatment}</p>}{record.notes && <p><b>ملاحظات:</b> {record.notes}</p>}</div></article>)}</div>}
      </section>
    </div>
  )
}
