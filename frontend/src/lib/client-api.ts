import axios from 'axios';
import { getAccessToken } from './token-store';

const clientApi = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

clientApi.interceptors.request.use(
  (config) => {
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }

    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export default clientApi;