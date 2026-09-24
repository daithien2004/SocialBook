import axios from 'axios';

import { env } from '@/env';

const serverApi = axios.create({
  baseURL: env.NEST_API_INTERNAL_URL || env.NEXT_PUBLIC_NEST_API_URL,
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