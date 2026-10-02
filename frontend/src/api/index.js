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
  getPublicQueue: (monumentId) => fetch(`${API_URL}/queues/public/${monumentId}`).then(r => r.json()),

  // Staff
  getStaffQueue: (monumentId) => fetch(`${API_URL}/staff/queues/${monumentId}`, { headers: getHeaders() }).then(r => r.json()),
  callNext: (monumentId) => fetch(`${API_URL}/staff/queues/${monumentId}/call-next`, { method: 'POST', headers: getHeaders() }).then(r => r.json()),
  skipVisitor: (monumentId, entryId) => fetch(`${API_URL}/staff/queues/${monumentId}/${entryId}/skip`, { method: 'POST', headers: getHeaders() }).then(r => r.json()),
  completeVisit: (monumentId, entryId) => fetch(`${API_URL}/staff/queues/${monumentId}/${entryId}/complete`, { method: 'POST', headers: getHeaders() }).then(r => r.json()),
  verifyTicket: (data) => fetch(`${API_URL}/staff/tickets/verify`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  validateTicket: (data) => fetch(`${API_URL}/staff/tickets/validate`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(r => r.json()),

  // Admin
  getAdminSummary: (startDate, endDate) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return fetch(`${API_URL}/admin/dashboard/summary${qs}`, { headers: getHeaders() }).then(r => r.json());
  },
  getAdminQueues: () => fetch(`${API_URL}/admin/dashboard/queues/overview`, { headers: getHeaders() }).then(r => r.json()),
  getAdminMonuments: () => fetch(`${API_URL}/admin/monuments`, { headers: getHeaders() }).then(r => r.json()),
  createMonument: (data) => fetch(`${API_URL}/admin/monuments`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  updateMonument: (id, data) => fetch(`${API_URL}/admin/monuments/${id}`, { method: 'PATCH', headers: getHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  getPrediction: (monumentId, date) => fetch(`${API_URL}/admin/predictions/${monumentId}?date=${date}`, { headers: getHeaders() }).then(r => r.json()),

  // Virtual Wallet
  getWallet: () => fetch(`${API_URL}/wallet`, { headers: getHeaders() }).then(r => r.json()),
  topupWallet: (data) => fetch(`${API_URL}/wallet/topup`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  debitWallet: (data) => fetch(`${API_URL}/wallet/debit`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) }).then(r => r.json()),
  getWalletTransactions: (page = 1, limit = 50) => fetch(`${API_URL}/wallet/transactions?page=${page}&limit=${limit}`, { headers: getHeaders() }).then(r => r.json()),
};