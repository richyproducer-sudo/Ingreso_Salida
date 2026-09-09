import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext.jsx';

const NAV_ITEMS = [
  { to: '/admin', label: 'Resumen', icon: '📊', end: true },
  { to: '/admin/employees', label: 'Empleados', icon: '🧑‍💼' },
  { to: '/admin/records', label: 'Registros', icon: '🕒' },
];

function SidebarContent({ user, onLogout, onNavigate }) {
  return (
    <>
      <div className="mb-8 px-2">
        <p className="font-mono-tech text-[10px] uppercase tracking-[0.3em] text-cyan-400/80">Control</p>
        <h1 className="text-lg font-semibold">Ingreso · Salida</h1>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                isActive ? 'bg-cyan-400/10 text-cyan-300' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <a
        href="/"
        target="_blank"
        rel="noreferrer"
        className="mb-2 rounded-lg border border-white/10 px-3 py-2 text-center text-xs text-slate-400 hover:text-cyan-300"
      >
        Abrir kiosco ↗
      </a>

      <div className="rounded-lg bg-white/5 p-3">
        <p className="text-xs text-slate-400">Sesión activa</p>
        <p className="truncate text-sm font-medium">{user?.name}</p>
        <button
          onClick={onLogout}
          className="mt-2 w-full rounded-md bg-rose-500/10 py-1.5 text-xs text-rose-300 hover:bg-rose-500/20"
        >
          Cerrar sesión
        </button>
      </div>
    </>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const currentLabel = NAV_ITEMS.find((item) => (item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)))?.label;

  function handleLogout() {
    logout();
    navigate('/admin/login');
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#05070d] text-white lg:flex-row">
      <header className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-4 py-3 lg:hidden">
        <div>
          <p className="font-mono-tech text-[9px] uppercase tracking-[0.3em] text-cyan-400/80">Control</p>
          <h1 className="text-base font-semibold">{currentLabel || 'Ingreso · Salida'}</h1>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Abrir menú"
          className="rounded-lg border border-white/10 p-2 text-slate-300"
        >
          ☰
        </button>
      </header>

      <aside className="hidden w-60 flex-col border-r border-white/10 bg-white/[0.02] p-4 lg:flex">
        <SidebarContent user={user} onLogout={handleLogout} />
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <aside className="relative flex w-72 max-w-[85vw] flex-col border-r border-white/10 bg-[#05070d] p-4">
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Cerrar menú"
              className="absolute right-3 top-3 rounded-lg border border-white/10 p-1.5 text-slate-400"
            >
              ✕
            </button>
            <SidebarContent user={user} onLogout={handleLogout} onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
