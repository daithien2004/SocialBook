import axios from 'axios';

const serverApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_NEST_API_URL || 'http://localhost:5000/api',
});

serverApi.interceptors.request.use(
  (config) => {
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default serverApi;