import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Appointments({ clinicId }) {
  const [appointments, setAppointments] = useState([])
  const [patients, setPatients] = useState([])
  const [form, setForm] = useState({ patient_id: '', starts_at: '', ends_at: '' })
  const [error, setError] = useState('')

  async function load() {
    const [a, p] = await Promise.all([
      supabase
        .from('appointments')
        .select('id, starts_at, ends_at, status, patients(full_name)')
        .order('starts_at', { ascending: true }),
      supabase.from('patients').select('id, full_name').eq('clinic_id', clinicId).order('full_name'),
    ])
    if (a.error) setError(a.error.message)
    else setAppointments(a.data)
    if (!p.error) setPatients(p.data)
  }

  useEffect(() => { load() }, [clinicId])

  async function handleAdd(e) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.from('appointments').insert({
      clinic_id: clinicId,
      patient_id: form.patient_id,
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: new Date(form.ends_at).toISOString(),
    })
    if (error) setError(error.message)
    else {
      setForm({ patient_id: '', starts_at: '', ends_at: '' })
      load()
    }
  }

  return (
    <section>
      <h2>المواعيد</h2>
      <form className="inline-form" onSubmit={handleAdd}>
        <select value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} required>
          <option value="">اختر المريض</option>
          {patients.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
        </select>
        <input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} required />
        <input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} required />
        <button type="submit" disabled={patients.length === 0}>حجز موعد</button>
      </form>
      {error && <p className="message">{error}</p>}
      <table>
        <thead>
          <tr><th>المريض</th><th>البداية</th><th>النهاية</th><th>الحالة</th></tr>
        </thead>
        <tbody>
          {appointments.map((a) => (
            <tr key={a.id}>
              <td>{a.patients?.full_name}</td>
              <td>{new Date(a.starts_at).toLocaleString('ar-EG')}</td>
              <td>{new Date(a.ends_at).toLocaleString('ar-EG')}</td>
              <td>{a.status}</td>
            </tr>
          ))}
          {appointments.length === 0 && <tr><td colSpan={4}>لا توجد مواعيد بعد</td></tr>}
        </tbody>
      </table>
    </section>
  )
}
