const BASE = '/api';

function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(auth ? authHeaders() : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Error en la solicitud');
  return data;
}

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),

  getFaceData: () => request('/employees/face-data'),
  getEmployees: () => request('/employees', { auth: true }),
  createEmployee: (payload) => request('/employees', { method: 'POST', body: payload, auth: true }),
  updateEmployeeFace: (id, payload) =>
    request(`/employees/${id}/face`, { method: 'PUT', body: payload, auth: true }),
  updateEmployee: (id, payload) => request(`/employees/${id}`, { method: 'PUT', body: payload, auth: true }),
  deleteEmployee: (id) => request(`/employees/${id}`, { method: 'DELETE', auth: true }),

  punch: (employeeId, method = 'face') => request('/attendance/punch', { method: 'POST', body: { employeeId, method } }),
  getAttendance: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/attendance${qs ? `?${qs}` : ''}`, { auth: true });
  },
  getAttendanceToday: () => request('/attendance/today', { auth: true }),
  deleteAttendance: (id) => request(`/attendance/${id}`, { method: 'DELETE', auth: true }),
};
