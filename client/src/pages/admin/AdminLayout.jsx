import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext.jsx';

const NAV_ITEMS = [
  { to: '/admin', label: 'Resumen', icon: '📊', end: true },
  { to: '/admin/employees', label: 'Empleados', icon: '🧑‍💼' },
  { to: '/admin/records', label: 'Registros', icon: '🕒' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-[#05070d] text-white">
      <aside className="flex w-60 flex-col border-r border-white/10 bg-white/[0.02] p-4">
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
            onClick={() => {
              logout();
              navigate('/admin/login');
            }}
            className="mt-2 w-full rounded-md bg-rose-500/10 py-1.5 text-xs text-rose-300 hover:bg-rose-500/20"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
