import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useLanguage } from './context/LanguageContext'
import Login from './pages/Login'
import CreateClinic from './pages/CreateClinic'
import RegistrationPending from './pages/RegistrationPending'
import AdminRegistrations from './pages/AdminRegistrations'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Patients from './pages/Patients'
import PatientDetails from './pages/PatientDetails'
import Appointments from './pages/Appointments'
import Billing from './pages/Billing'
import DownloadApp from './pages/DownloadApp'

const ADMIN_EMAIL = 'abdelramanhany6@gmail.com'
export default function App() {
  const { t } = useLanguage()
  const location = useLocation()
  const [session, setSession] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [membership, setMembership] = useState({ loaded: false, clinicId: null, registrationStatus: null })
  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data, error }) => { if (!mounted) return; if (error) console.error(error); setSession(data.session); setAuthChecked(true) })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => { setMembership({ loaded:false, clinicId:null, registrationStatus:null }); setSession(nextSession) })
    return () => { mounted = false; sub.subscription.unsubscribe() }
  }, [])
  useEffect(() => {
    let active = true
    if (!session) { setMembership({ loaded:false, clinicId:null, registrationStatus:null }); return () => { active = false } }
    Promise.all([
      supabase.from('clinic_members').select('clinic_id').eq('user_id', session.user.id).limit(1).maybeSingle(),
      supabase.from('registration_requests').select('status').eq('user_id', session.user.id).maybeSingle(),
    ]).then(([memberResult, requestResult]) => {
      if (!active) return
      if (memberResult.error) console.error(memberResult.error)
      if (requestResult.error) console.error(requestResult.error)
      setMembership({ loaded:true, clinicId:memberResult.data?.clinic_id ?? null, registrationStatus:requestResult.data?.status ?? null })
    })
    return () => { active = false }
  }, [session])
  if (location.pathname === '/download') return <DownloadApp />
  if (!authChecked) return <p className="center">{t('جاري التحميل...','Loading...')}</p>
  if (!session) return <Login />
  if (!membership.loaded) return <p className="center">{t('جاري تحميل بيانات الحساب...','Loading account...')}</p>
  const isAdmin = session.user.email?.toLowerCase() === ADMIN_EMAIL
  if (!isAdmin && !membership.clinicId && membership.registrationStatus === 'pending') return <RegistrationPending status="pending" />
  if (!isAdmin && !membership.clinicId && membership.registrationStatus === 'rejected') return <RegistrationPending status="rejected" />
  if (!isAdmin && !membership.clinicId && membership.registrationStatus !== 'approved') return <RegistrationPending status="missing" />
  if (!membership.clinicId && !isAdmin) return <CreateClinic onCreated={(clinicId) => setMembership(current => ({...current,clinicId}))} />
  return <Routes><Route element={<Layout isAdmin={isAdmin} />}>
    <Route index element={<Navigate to="/dashboard" replace />} />
    <Route path="/dashboard" element={<Dashboard clinicId={membership.clinicId} />} />
    <Route path="/patients" element={<Patients clinicId={membership.clinicId} />} />
    <Route path="/patients/:patientId" element={<PatientDetails clinicId={membership.clinicId} />} />
    <Route path="/appointments" element={<Appointments clinicId={membership.clinicId} />} />
    <Route path="/billing" element={<Billing clinicId={membership.clinicId} />} />
    {isAdmin && <Route path="/admin/registrations" element={<AdminRegistrations />} />}
    <Route path="*" element={<Navigate to={isAdmin ? "/admin/registrations" : "/dashboard"} replace />} />
  </Route></Routes>
}
