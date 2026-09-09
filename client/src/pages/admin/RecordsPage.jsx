import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api.js';

const TYPE_LABEL = {
  checkin: 'Ingreso',
  lunch_out: 'Salida a almorzar',
  lunch_in: 'Regreso de almuerzo',
  checkout: 'Salida',
};

function toCsv(rows) {
  const header = ['Empleado', 'Tipo', 'Fecha', 'Hora'];
  const lines = rows.map((r) => {
    const d = new Date(r.timestamp);
    return [
      r.employee_name,
      TYPE_LABEL[r.type],
      d.toLocaleDateString('es-ES'),
      d.toLocaleTimeString('es-ES', { hour12: false }),
    ]
      .map((v) => `"${String(v).replaceAll('"', '""')}"`)
      .join(',');
  });
  return [header.join(','), ...lines].join('\n');
}

export default function RecordsPage() {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ employeeId: '', from: '', to: '' });

  async function load(activeFilters = filters) {
    setLoading(true);
    try {
      const params = {};
      if (activeFilters.employeeId) params.employeeId = activeFilters.employeeId;
      if (activeFilters.from) params.from = activeFilters.from;
      if (activeFilters.to) params.to = activeFilters.to;
      setRecords(await api.getAttendance(params));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api.getEmployees().then(setEmployees);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function remove(id) {
    if (!confirm('¿Eliminar este registro?')) return;
    await api.deleteAttendance(id);
    load();
  }

  function exportCsv() {
    const csv = toCsv(records);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asistencia_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = useMemo(() => records, [records]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Registros de asistencia</h1>
          <p className="mt-1 text-sm text-slate-400">Historial completo de marcajes por FaceID.</p>
        </div>
        <button
          onClick={exportCsv}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:border-cyan-400/40 hover:text-cyan-300"
        >
          Exportar CSV
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div>
          <label className="mb-1 block text-xs text-slate-400">Empleado</label>
          <select
            value={filters.employeeId}
            onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-cyan-400/60"
          >
            <option value="">Todos</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">Desde</label>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-cyan-400/60"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">Hasta</label>
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            className="rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:border-cyan-400/60"
          />
        </div>
        <button
          onClick={() => load(filters)}
          className="rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 py-2 text-sm font-medium text-black hover:opacity-90"
        >
          Filtrar
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/[0.03] text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">Empleado</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Hora</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  No hay registros para el filtro seleccionado.
                </td>
              </tr>
            )}
            {filtered.map((r) => {
              const d = new Date(r.timestamp);
              return (
                <tr key={r.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium">{r.employee_name}</td>
                  <td className="px-4 py-3 text-slate-400">{TYPE_LABEL[r.type]}</td>
                  <td className="px-4 py-3 text-slate-400">{d.toLocaleDateString('es-ES')}</td>
                  <td className="px-4 py-3 font-mono-tech text-slate-400">
                    {d.toLocaleTimeString('es-ES', { hour12: false })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => remove(r.id)}
                      className="rounded-md border border-white/10 px-2 py-1 text-xs text-rose-300 hover:border-rose-400/40"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
