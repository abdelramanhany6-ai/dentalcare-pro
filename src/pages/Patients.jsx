import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Patients({ clinicId }) {
  const [patients, setPatients] = useState([])
  const [form, setForm] = useState({ full_name: '', phone: '', date_of_birth: '' })
  const [error, setError] = useState('')

  async function load() {
    const { data, error } = await supabase
      .from('patients')
      .select('id, full_name, phone, date_of_birth')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setPatients(data)
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.from('patients').insert({
      clinic_id: clinicId,
      full_name: form.full_name,
      phone: form.phone || null,
      date_of_birth: form.date_of_birth || null,
    })
    if (error) setError(error.message)
    else {
      setForm({ full_name: '', phone: '', date_of_birth: '' })
      load()
    }
  }

  return (
    <section>
      <h2>المرضى</h2>
      <form className="inline-form" onSubmit={handleAdd}>
        <input placeholder="الاسم الكامل" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
        <input placeholder="الهاتف" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
        <button type="submit">إضافة مريض</button>
      </form>
      {error && <p className="message">{error}</p>}
      <table>
        <thead>
          <tr><th>الاسم</th><th>الهاتف</th><th>تاريخ الميلاد</th></tr>
        </thead>
        <tbody>
          {patients.map((p) => (
            <tr key={p.id}>
              <td>{p.full_name}</td>
              <td>{p.phone || '-'}</td>
              <td>{p.date_of_birth || '-'}</td>
            </tr>
          ))}
          {patients.length === 0 && <tr><td colSpan={3}>لا يوجد مرضى بعد</td></tr>}
        </tbody>
      </table>
    </section>
  )
}
