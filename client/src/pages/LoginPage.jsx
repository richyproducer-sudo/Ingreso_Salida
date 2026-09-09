import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@empresa.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#05070d] px-4 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.06)_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 h-80 w-[600px] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[120px]" />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-[0_0_60px_rgba(34,211,238,0.1)]"
      >
        <p className="font-mono-tech text-xs uppercase tracking-[0.3em] text-cyan-400/80">Panel Administrador</p>
        <h1 className="mt-2 text-2xl font-semibold">Iniciar sesión</h1>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-xs text-slate-400">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 outline-none focus:border-cyan-400/60"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 outline-none focus:border-cyan-400/60"
            />
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-400 py-2.5 font-medium text-black transition hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Ingresando…' : 'Ingresar'}
        </button>

        <p className="mt-4 text-center text-xs text-slate-500">
          Usuario inicial: admin@empresa.com / admin123
        </p>
        <Link to="/" className="mt-3 block text-center text-xs text-slate-500 hover:text-cyan-300">
          ← Volver al kiosco de marcaje
        </Link>
      </form>
    </div>
  );
}
