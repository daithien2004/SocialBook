import axios from 'axios';

const serverApi = axios.create({
  // baseURL trỏ thẳng đến địa chỉ của NestJS backend
  baseURL: process.env.NEST_API_URL || 'http://localhost:5000/api',
});

serverApi.interceptors.request.use(
  (config) => {
    // Nếu không phải FormData, mặc định là JSON
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    // Nếu là FormData, axios sẽ tự động set Content-Type với boundary
    return config;
  },
  (error) => Promise.reject(error)
);

export default serverApi;