const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const api = {
  // Auth
  register: (data) => fetch(`${API_URL}/auth/register`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  login: (data) => fetch(`${API_URL}/auth/login`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  googleLogin: (token) => fetch(`${API_URL}/auth/google`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ token }) }).then(r => r.json()),
  getMe: () => fetch(`${API_URL}/auth/me`, { headers: getHeaders() }).then(r => r.json()),

  // Public
  getMonuments: () => fetch(`${API_URL}/monuments`, { headers: getHeaders() }).then(r => r.json()),
  getMonument: (id) => fetch(`${API_URL}/monuments/${id}`, { headers: getHeaders() }).then(r => r.json()),

  // Tickets
  bookTicket: (data) => fetch(`${API_URL}/tickets`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  getMyTickets: () => fetch(`${API_URL}/tickets/my`, { headers: getHeaders() }).then(r => r.json()),
  getTicket: (id) => fetch(`${API_URL}/tickets/${id}`, { headers: getHeaders() }).then(r => r.json()),
  cancelTicket: (id) => fetch(`${API_URL}/tickets/${id}/cancel`, { method: 'PATCH', headers: getHeaders() }).then(r => r.json()),

  // Queue
  getMyQueue: (ticketId) => fetch(`${API_URL}/queues/my/${ticketId}`, { headers: getHeaders() }).then(r => r.json()),

  // Staff
  getStaffQueue: (monumentId) => fetch(`${API_URL}/staff/queues/${monumentId}`, { headers: getHeaders() }).then(r => r.json()),
  callNext: (monumentId) => fetch(`${API_URL}/staff/queues/${monumentId}/call-next`, { method: 'POST', headers: getHeaders() }).then(r => r.json()),
  skipVisitor: (monumentId, entryId) => fetch(`${API_URL}/staff/queues/${monumentId}/${entryId}/skip`, { method: 'POST', headers: getHeaders() }).then(r => r.json()),
  completeVisit: (monumentId, entryId) => fetch(`${API_URL}/staff/queues/${monumentId}/${entryId}/complete`, { method: 'POST', headers: getHeaders() }).then(r => r.json()),
  validateTicket: (data) => fetch(`${API_URL}/staff/tickets/validate`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(r => r.json()),

  // Admin
  getAdminSummary: () => fetch(`${API_URL}/admin/dashboard/summary`, { headers: getHeaders() }).then(r => r.json()),
};