import api from './api';

export const orderService = {
  calculateRate: (orderParams) => api.post('/orders/calculate-rate', orderParams),
  createOrder: (orderData) => api.post('/orders', orderData),
  getOrderById: (orderId) => api.get(`/orders/${orderId}`),
  getCustomerOrders: () => api.get('/orders/customer/my-orders'),
  getAllOrders: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/orders${query ? `?${query}` : ''}`);
  },
  rescheduleOrder: (orderId, rescheduleData) => api.post(`/customer/orders/${orderId}/reschedule`, rescheduleData),
  overrideStatus: (orderId, overrideData) => api.put(`/orders/${orderId}/override-status`, overrideData),
  autoAssign: (orderId) => api.post(`/orders/${orderId}/auto-assign`),
  manualAssign: (orderId, agentProfileId) => api.post(`/orders/${orderId}/assign`, { agentProfileId }),
  getEligibleAgents: (orderId) => api.get(`/orders/${orderId}/eligible-agents`),
};

export default orderService;
