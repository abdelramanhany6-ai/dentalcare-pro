import { NavLink, Outlet } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLanguage } from '../context/LanguageContext'
import LanguageToggle from './LanguageToggle'

export default function Layout({ isAdmin = false }) {
  const { t } = useLanguage()
  return <div className="app-shell"><aside className="sidebar">
    <div className="brand"><span className="brand-mark">D</span><div><strong>DentalCare</strong><small>PRO CLINIC SYSTEM</small></div></div>
    <div className="nav-caption">{t('القائمة الرئيسية','MAIN MENU')}</div>
    <nav className="side-nav">
      <NavLink to="/dashboard"><span>▦</span> {t('لوحة التحكم','Dashboard')}</NavLink>
      <NavLink to="/patients"><span>♙</span> {t('المرضى','Patients')}</NavLink>
      <NavLink to="/appointments"><span>▣</span> {t('المواعيد','Appointments')}</NavLink>
      <NavLink to="/billing"><span>ج</span> {t('الحسابات والمدفوعات','Billing')}</NavLink>
      {isAdmin && <NavLink to="/admin/registrations"><span>✓</span> {t('طلبات التسجيل','Registrations')}</NavLink>}
    </nav>
    <div className="sidebar-footer"><span className="online-dot" /> {t('متصل بقاعدة البيانات','Connected to database')}</div>
  </aside><div className="workspace">
    <header className="topbar"><div><span className="topbar-title">{t('نظام إدارة عيادة الأسنان','Dental Clinic Management')}</span><span className="topbar-subtitle">{t('إدارة يومك في مكان واحد','Your clinic, all in one place')}</span></div><div className="topbar-actions"><LanguageToggle /><button className="logout-button" onClick={() => supabase.auth.signOut()}>{t('تسجيل الخروج','Sign out')}</button></div></header>
    <main className="main-content"><Outlet /></main>
  </div></div>
}
