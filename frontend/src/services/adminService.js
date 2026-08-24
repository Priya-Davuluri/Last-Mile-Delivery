import api from './api';

export const adminService = {
  getOverview: () => api.get('/admin/overview'),
  getZones: () => api.get('/admin/zones'),
  createZone: (zoneData) => api.post('/admin/zones', zoneData),
  updateZone: (id, zoneData) => api.put(`/admin/zones/${id}`, zoneData),
  deleteZone: (id) => api.delete(`/admin/zones/${id}`),
  getRateCards: () => api.get('/admin/rate-cards'),
  saveRateCard: (rateCardData) => api.post('/admin/rate-cards', rateCardData),
  updateRateCard: (id, rateCardData) => api.put(`/admin/rate-cards/${id}`, rateCardData),
  getAgents: () => api.get('/admin/agents'),
  updateAgent: (id, agentData) => api.put(`/admin/agents/${id}`, agentData),
  getCustomers: () => api.get('/admin/customers'),
};

export default adminService;
