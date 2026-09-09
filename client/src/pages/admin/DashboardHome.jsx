import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../../lib/api.js';

const TYPE_LABEL = {
  checkin: 'Ingresos',
  lunch_out: 'Salidas almuerzo',
  lunch_in: 'Regresos almuerzo',
  checkout: 'Salidas',
};

function StatCard({ label, value, hint, color }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${color}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export default function DashboardHome() {
  const [employees, setEmployees] = useState([]);
  const [today, setToday] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getEmployees(), api.getAttendanceToday()])
      .then(([emps, records]) => {
        setEmployees(emps);
        setToday(records);
      })
      .finally(() => setLoading(false));
  }, []);

  const presentNow = new Set();
  const lastByEmployee = new Map();
  for (const r of [...today].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))) {
    lastByEmployee.set(r.employee_id, r.type);
  }
  for (const [id, type] of lastByEmployee) {
    if (type === 'checkin' || type === 'lunch_in') presentNow.add(id);
  }

  const chartData = Object.entries(TYPE_LABEL).map(([type, label]) => ({
    label,
    total: today.filter((r) => r.type === type).length,
  }));

  return (
    <div>
      <h1 className="text-2xl font-semibold">Resumen de hoy</h1>
      <p className="mt-1 text-sm text-slate-400">Actividad en tiempo real del sistema de FaceID.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Empleados activos" value={employees.filter((e) => e.active).length} color="text-cyan-300" />
        <StatCard label="Presentes ahora" value={presentNow.size} color="text-emerald-300" />
        <StatCard label="Marcajes hoy" value={today.length} color="text-amber-300" />
        <StatCard
          label="Sin rostro registrado"
          value={employees.filter((e) => !e.has_face).length}
          color="text-rose-300"
          hint="Pendientes de enrolar FaceID"
        />
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-sm font-medium text-slate-300">Marcajes de hoy por tipo</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#0a0d16', border: '1px solid #1e293b', color: '#fff' }} />
              <Bar dataKey="total" fill="#22d3ee" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-sm font-medium text-slate-300">Última actividad</h2>
        <div className="mt-4 divide-y divide-white/5">
          {loading && <p className="py-4 text-sm text-slate-500">Cargando…</p>}
          {!loading && today.length === 0 && <p className="py-4 text-sm text-slate-500">Sin marcajes hoy todavía.</p>}
          {today.slice(0, 8).map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-3 text-sm">
              <span className="font-medium">{r.employee_name}</span>
              <span className="text-slate-400">{TYPE_LABEL[r.type]}</span>
              <span className="font-mono-tech text-slate-500">
                {new Date(r.timestamp).toLocaleTimeString('es-ES', { hour12: false })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
