import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// API helpers
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const newsAPI = {
  getAll: (params?: any) => api.get('/news', { params }),
  getOne: (id: number) => api.get(`/news/${id}`),
  create: (data: any) => api.post('/news', data),
  update: (id: number, data: any) => api.patch(`/news/${id}`, data),
  delete: (id: number) => api.delete(`/news/${id}`),
};

export const postsAPI = {
  getAll: (params?: any) => api.get('/posts', { params }),
  getOne: (id: number) => api.get(`/posts/${id}`),
  create: (data: any) => api.post('/posts', data),
  like: (id: number) => api.post(`/posts/${id}/like`),
  addComment: (id: number, data: any) => api.post(`/posts/${id}/comments`, data),
  delete: (id: number) => api.delete(`/posts/${id}`),
};

export const itemsAPI = {
  getAll: (params?: any) => api.get('/items', { params }),
  getOne: (slug: string) => api.get(`/items/${slug}`),
};

export const wikiAPI = {
  getAll: (params?: any) => api.get('/wiki', { params }),
  getOne: (slug: string) => api.get(`/wiki/${slug}`),
};

export const leaderboardAPI = {
  get: (params?: any) => api.get('/leaderboard', { params }),
};

export const achievementsAPI = {
  getAll: () => api.get('/achievements'),
};

export const galleryAPI = {
  getAll: (params?: any) => api.get('/gallery', { params }),
  upload: (data: any) => api.post('/gallery', data),
  vote: (id: number) => api.post(`/gallery/${id}/vote`),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  updateUser: (id: number, data: any) => api.patch(`/admin/users/${id}`, data),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),
  getReports: (params?: any) => api.get('/admin/reports', { params }),
  resolveReport: (id: number, data: any) => api.patch(`/admin/reports/${id}`, data),
  getPendingGallery: () => api.get('/admin/gallery/pending'),
  approveMedia: (id: number) => api.patch(`/gallery/${id}/approve`),
  getLogs: () => api.get('/admin/logs'),
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data: any) => api.patch('/admin/settings', data),
};

export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id: number) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};
