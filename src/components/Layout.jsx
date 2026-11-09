import { NavLink, Outlet } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Layout({ isAdmin = false }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">D</span><div><strong>DentalCare</strong><small>PRO CLINIC SYSTEM</small></div></div>
        <div className="nav-caption">القائمة الرئيسية</div>
        <nav className="side-nav">
          <NavLink to="/dashboard"><span>▦</span> لوحة التحكم</NavLink>
          <NavLink to="/patients"><span>♙</span> المرضى</NavLink>
          <NavLink to="/appointments"><span>▣</span> المواعيد</NavLink>
          {isAdmin && <NavLink to="/admin/registrations"><span>✓</span> طلبات التسجيل</NavLink>}
        </nav>
        <div className="sidebar-footer"><span className="online-dot" /> متصل بقاعدة البيانات</div>
      </aside>
      <div className="workspace">
        <header className="topbar"><div><span className="topbar-title">نظام إدارة عيادة الأسنان</span><span className="topbar-subtitle">إدارة يومك في مكان واحد</span></div><button className="logout-button" onClick={() => supabase.auth.signOut()}>تسجيل الخروج</button></header>
        <main className="main-content"><Outlet /></main>
      </div>
    </div>
  )
}
