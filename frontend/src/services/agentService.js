import api from './api';

export const agentService = {
  getAssignedOrders: () => api.get('/agent/orders'),
  updateStatus: (orderId, statusData) => api.put(`/agent/orders/${orderId}/status`, statusData),
  toggleAvailability: (availabilityStatus) => api.put('/agent/availability', { availabilityStatus }),
  updateLocation: (lat, lng) => api.put('/agent/location', { lat, lng }),
};

export default agentService;
