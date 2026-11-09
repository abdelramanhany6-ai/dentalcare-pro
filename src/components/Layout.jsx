import { NavLink, Outlet } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Layout() {
  return (
    <div className="app">
      <header className="topbar">
        <strong>DentalCare Pro</strong>
        <nav>
          <NavLink to="/patients">المرضى</NavLink>
          <NavLink to="/appointments">المواعيد</NavLink>
        </nav>
        <button className="link" onClick={() => supabase.auth.signOut()}>خروج</button>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
