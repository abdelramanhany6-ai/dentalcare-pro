import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminRegistrations() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState('')
  const [message, setMessage] = useState('')

  const loadRequests = useCallback(async () => {
    setLoading(true)
    setMessage('')
    const { data, error } = await supabase.functions.invoke('registration-admin', { body: { action: 'list' } })
    if (error) setMessage(error.message || 'تعذر تحميل الطلبات.')
    else setRequests(data.requests || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadRequests() }, [loadRequests])

  async function decide(userId, decision) {
    setBusyId(userId)
    setMessage('')
    const { error } = await supabase.functions.invoke('registration-admin', {
      body: { action: decision, user_id: userId },
    })
    if (error) setMessage(error.message || 'تعذر تحديث الطلب.')
    else {
      setRequests((items) => items.filter((item) => item.user_id !== userId))
      setMessage(decision === 'approve' ? 'تمت الموافقة على الطلب.' : 'تم رفض الطلب.')
    }
    setBusyId('')
  }

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div><p className="eyebrow">ADMINISTRATION</p><h1>طلبات التسجيل</h1><p className="muted">راجع الحسابات الجديدة ووافق عليها قبل السماح بدخول النظام.</p></div>
        <button onClick={loadRequests} disabled={loading}>تحديث القائمة</button>
      </div>
      {message && <p className="message">{message}</p>}
      <section className="panel">
        <div className="section-heading"><h2>طلبات بانتظار الموافقة</h2><span className="count-chip">{requests.length} طلب</span></div>
        {loading ? <p className="empty-state">جاري تحميل الطلبات...</p> : requests.length === 0 ? <p className="empty-state">لا توجد طلبات معلقة حالياً.</p> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>البريد الإلكتروني</th><th>تاريخ الطلب</th><th>الإجراء</th></tr></thead>
              <tbody>{requests.map((request) => (
                <tr key={request.user_id}>
                  <td><strong>{request.email}</strong></td>
                  <td>{new Date(request.created_at).toLocaleString('ar-EG')}</td>
                  <td><div className="inline-form">
                    <button disabled={busyId === request.user_id} onClick={() => decide(request.user_id, 'approve')}>موافقة</button>
                    <button className="logout-button" disabled={busyId === request.user_id} onClick={() => decide(request.user_id, 'reject')}>رفض</button>
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
