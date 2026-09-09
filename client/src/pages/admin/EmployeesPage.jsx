import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import FaceCaptureModal from '../../components/FaceCaptureModal.jsx';

const EMPTY_FORM = { name: '', email: '', password: '', role: 'employee' };

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState(null);
  const [faceTarget, setFaceTarget] = useState(null); // 'new' pending data, or existing employee id
  const [pendingNew, setPendingNew] = useState(null);

  async function load() {
    setLoading(true);
    try {
      setEmployees(await api.getEmployees());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openNewForm() {
    setForm(EMPTY_FORM);
    setError(null);
    setShowForm(true);
  }

  function submitForm(e) {
    e.preventDefault();
    if (!form.name || !form.email) {
      setError('Nombre y email son obligatorios');
      return;
    }
    setPendingNew(form);
    setShowForm(false);
    setFaceTarget('new');
  }

  async function onCapture(descriptor, photo) {
    try {
      if (faceTarget === 'new') {
        await api.createEmployee({ ...pendingNew, descriptor, photo });
      } else {
        await api.updateEmployeeFace(faceTarget, { descriptor, photo });
      }
      setFaceTarget(null);
      setPendingNew(null);
      await load();
    } catch (err) {
      setError(err.message);
      setFaceTarget(null);
    }
  }

  async function toggleActive(emp) {
    await api.updateEmployee(emp.id, { active: emp.active ? 0 : 1 });
    load();
  }

  async function remove(emp) {
    if (!confirm(`¿Eliminar a ${emp.name}? Esta acción no se puede deshacer.`)) return;
    await api.deleteEmployee(emp.id);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Empleados</h1>
          <p className="mt-1 text-sm text-slate-400">Gestiona el personal y su registro de FaceID.</p>
        </div>
        <button
          onClick={openNewForm}
          className="rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 py-2 text-sm font-medium text-black hover:opacity-90"
        >
          + Nuevo empleado
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">FaceID</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && employees.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  No hay empleados registrados todavía.
                </td>
              </tr>
            )}
            {employees.map((emp) => (
              <tr key={emp.id} className="hover:bg-white/[0.02]">
                <td className="px-4 py-3 font-medium">{emp.name}</td>
                <td className="px-4 py-3 text-slate-400">{emp.email}</td>
                <td className="px-4 py-3 capitalize text-slate-400">{emp.role}</td>
                <td className="px-4 py-3">
                  {emp.has_face ? (
                    <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-xs text-emerald-300">
                      ✅ Enrolado
                    </span>
                  ) : (
                    <span className="rounded-full bg-rose-400/10 px-2 py-1 text-xs text-rose-300">Pendiente</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(emp)}
                    className={`rounded-full px-2 py-1 text-xs ${
                      emp.active ? 'bg-cyan-400/10 text-cyan-300' : 'bg-slate-600/20 text-slate-400'
                    }`}
                  >
                    {emp.active ? 'Activo' : 'Inactivo'}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setFaceTarget(emp.id)}
                    className="mr-2 rounded-md border border-white/10 px-2 py-1 text-xs text-slate-300 hover:border-cyan-400/40 hover:text-cyan-300"
                  >
                    {emp.has_face ? 'Re-enrolar rostro' : 'Enrolar rostro'}
                  </button>
                  <button
                    onClick={() => remove(emp)}
                    className="rounded-md border border-white/10 px-2 py-1 text-xs text-rose-300 hover:border-rose-400/40"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <form
            onSubmit={submitForm}
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0a0d16] p-6 text-white"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Nuevo empleado</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Nombre completo</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 outline-none focus:border-cyan-400/60"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 outline-none focus:border-cyan-400/60"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">
                  Contraseña <span className="text-slate-600">(opcional, solo si necesita acceso al panel)</span>
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 outline-none focus:border-cyan-400/60"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Rol</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 outline-none focus:border-cyan-400/60"
                >
                  <option value="employee">Empleado</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
            </div>

            {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

            <button
              type="submit"
              className="mt-5 w-full rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-400 py-2.5 font-medium text-black hover:opacity-90"
            >
              Continuar a captura facial →
            </button>
          </form>
        </div>
      )}

      {faceTarget && (
        <FaceCaptureModal
          title={faceTarget === 'new' ? `Enrolar rostro de ${pendingNew?.name}` : 'Actualizar rostro'}
          onCapture={onCapture}
          onClose={() => {
            setFaceTarget(null);
            setPendingNew(null);
          }}
        />
      )}
    </div>
  );
}
