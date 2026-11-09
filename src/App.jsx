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
function DeviceLimitScreen({ t, details }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  async function requestAccess() {
    setBusy(true); setMessage('')
    const { data, error } = await supabase.functions.invoke('device-access', { body: { action: 'request_limit', requested_limit: (details?.device_limit || 2) + 1, reason: 'Request to add another clinic device' } })
    setMessage(error || data?.error ? (data?.error || error.message) : t('تم إرسال طلب زيادة عدد الأجهزة للإدارة.','Your request for additional devices was sent to the administrator.'))
    setBusy(false)
  }
  return <div className="page-stack"><section className="panel"><h1>{t('عدد الأجهزة المسموح به اكتمل','Clinic device limit reached')}</h1><p>{t('هذه العيادة تستخدم بالفعل ','This clinic is already using ')}{details?.active_devices || details?.device_limit}{t(' من الأجهزة المسموح بها. الحد الحالي: ',' of its allowed devices. Current limit: ')}{details?.device_limit}.</p><p className="muted">{t('يمكنك طلب السماح بجهاز إضافي، وسيصل الطلب إلى مسؤول النظام.','You can request one additional device; the request will be sent to the system administrator.')}</p><button onClick={requestAccess} disabled={busy || !!details?.pending_request}>{busy ? t('جارٍ الإرسال...','Sending...') : details?.pending_request ? t('يوجد طلب قيد المراجعة','A request is already pending') : t('طلب جهاز إضافي','Request another device')}</button>{message && <p className="message">{message}</p>}<button className="link" onClick={() => supabase.auth.signOut()}>{t('تسجيل الخروج','Sign out')}</button></section></div>
}

export default function App() {
  const { t } = useLanguage()
  const location = useLocation()
  const [session, setSession] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [membership, setMembership] = useState({ loaded: false, clinicId: null, registrationStatus: null, suspended: false })
  const [deviceAccess, setDeviceAccess] = useState({ loaded: false, status: null, details: null, error: '' })
  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data, error }) => { if (!mounted) return; if (error) console.error(error); setSession(data.session); setAuthChecked(true) })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => { setMembership({ loaded:false, clinicId:null, registrationStatus:null, suspended:false }); setSession(nextSession) })
    return () => { mounted = false; sub.subscription.unsubscribe() }
  }, [])
  useEffect(() => {
    let active = true
    if (!session) { setMembership({ loaded:false, clinicId:null, registrationStatus:null, suspended:false }); return () => { active = false } }
    Promise.all([
      supabase.from('clinic_members').select('clinic_id').eq('user_id', session.user.id).limit(1).maybeSingle(),
      supabase.from('registration_requests').select('status').eq('user_id', session.user.id).maybeSingle(),
      supabase.functions.invoke('registration-admin', { body: { action: 'my_access_status' } }),
    ]).then(([memberResult, requestResult, accessResult]) => {
      if (!active) return
      if (memberResult.error) console.error(memberResult.error)
      if (requestResult.error) console.error(requestResult.error)
      if (accessResult.error) console.error('Could not verify account access status:', accessResult.error)
      setMembership({ loaded:true, clinicId:memberResult.data?.clinic_id ?? null, registrationStatus:requestResult.data?.status ?? null, suspended:!!accessResult.data?.suspended })
    })
    return () => { active = false }
  }, [session])
  useEffect(() => {
    let active = true
    if (!session || !membership.loaded || !membership.clinicId || membership.suspended) {
      setDeviceAccess({ loaded: true, status: 'not_required', details: null, error: '' })
      return () => { active = false }
    }
    setDeviceAccess({ loaded: false, status: null, details: null, error: '' })
    const deviceId = localStorage.getItem('dentalcare_device_id')
    const ua = navigator.userAgent
    const browser = ua.includes('Edg/') ? 'Edge' : ua.includes('Chrome/') ? 'Chrome' : ua.includes('Firefox/') ? 'Firefox' : ua.includes('Safari/') ? 'Safari' : 'Browser'
    const deviceName = (navigator.platform || 'Device') + ' · ' + browser
    supabase.functions.invoke('device-access', { body: { action: 'register_device', device_id: deviceId, device_name: deviceName } }).then(({ data, error }) => {
      if (!active) return
      if (error || data?.error) setDeviceAccess({ loaded: true, status: 'error', details: null, error: data?.error || error.message })
      else setDeviceAccess({ loaded: true, status: data?.status || 'error', details: data, error: '' })
    })
    return () => { active = false }
  }, [session, membership.loaded, membership.clinicId, membership.suspended])
  const isDownloadPage = location.pathname.replace(/\/$/, '') === '/download' || window.location.hash.split('?')[0].replace(/^#/, '').replace(/\/$/, '') === '/download'
  if (isDownloadPage) return <DownloadApp />
  if (!authChecked) return <p className="center">{t('جاري التحميل...','Loading...')}</p>
  if (!session) return <Login />
  if (!membership.loaded) return <p className="center">{t('جاري تحميل بيانات الحساب...','Loading account...')}</p>
  if (!deviceAccess.loaded) return <p className="center">{t('جاري التحقق من الجهاز...','Verifying this device...')}</p>
  const isAdmin = session.user.email?.toLowerCase() === ADMIN_EMAIL
  if (deviceAccess.status === 'limit_reached' && !isAdmin) return <DeviceLimitScreen t={t} details={deviceAccess.details} />
  if (deviceAccess.status === 'error' && !isAdmin) return <div className="page-stack"><section className="panel"><h1>{t('تعذر التحقق من الجهاز','Could not verify this device')}</h1><p>{deviceAccess.error}</p><button onClick={() => window.location.reload()}>{t('إعادة المحاولة','Retry')}</button></section></div>
  if (membership.suspended && !isAdmin) return <div className="page-stack"><section className="panel"><h1>{t('الحساب موقوف مؤقتًا','Account temporarily suspended')}</h1><p className="muted">{t('تم إيقاف صلاحية دخول هذا الحساب مؤقتًا. بيانات العيادة والمرضى محفوظة، ويمكن لمسؤول النظام إعادة تفعيل الحساب.','Access to this account has been temporarily suspended. Clinic and patient data are retained; the system administrator can reactivate the account.')}</p><button onClick={() => supabase.auth.signOut()}>{t('تسجيل الخروج','Sign out')}</button></section></div>
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
