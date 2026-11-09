import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function CreateClinic({ onCreated }) {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { data, error } = await supabase.rpc('create_clinic', { p_name: name })
    if (error) setError(error.message)
    else onCreated(data)
    setBusy(false)
  }

  return (
    <div className="auth-box">
      <h1>إنشاء عيادة جديدة</h1>
      <form onSubmit={handleSubmit}>
        <label>
          اسم العيادة
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <button type="submit" disabled={busy}>إنشاء</button>
      </form>
      {error && <p className="message">{error}</p>}
      <button className="link" onClick={() => supabase.auth.signOut()}>تسجيل الخروج</button>
    </div>
  )
}
