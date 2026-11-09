import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import CreateClinic from './pages/CreateClinic'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import PatientDetails from './pages/PatientDetails'
import Appointments from './pages/Appointments'

export default function App() {
  const [session, setSession] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [membership, setMembership] = useState({ loaded: false, clinicId: null })

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return
      if (error) console.error(error)
      setSession(data.session)
      setAuthChecked(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => { mounted = false; sub.subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    let active = true
    if (!session) {
      setMembership({ loaded: false, clinicId: null })
      return () => { active = false }
    }
    supabase.from('clinic_members').select('clinic_id').eq('user_id', session.user.id).limit(1).maybeSingle()
      .then(({ data, error }) => {
        if (!active) return
        if (error) console.error(error)
        setMembership({ loaded: true, clinicId: data?.clinic_id ?? null })
      })
    return () => { active = false }
  }, [session])

  if (!authChecked) return <p className="center">جاري التحميل...</p>
  if (!session) return <Login />
  if (!membership.loaded) return <p className="center">جاري تحميل بيانات العيادة...</p>
  if (!membership.clinicId) return <CreateClinic onCreated={(clinicId) => setMembership({ loaded: true, clinicId })} />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard clinicId={membership.clinicId} />} />
        <Route path="/patients" element={<Patients clinicId={membership.clinicId} />} />
        <Route path="/patients/:patientId" element={<PatientDetails clinicId={membership.clinicId} />} />
        <Route path="/appointments" element={<Appointments clinicId={membership.clinicId} />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
