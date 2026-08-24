import api from './api';

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  googleLogin: (credential, clientId) => api.post('/auth/google', { credential, clientId }),
  getMe: () => api.get('/auth/me'),
  createAgent: (agentData) => api.post('/auth/create-agent', agentData),
};

export default authService;
