import axios from 'axios';

const serverApi = axios.create({
  // baseURL trỏ thẳng đến địa chỉ của NestJS backend
  baseURL: process.env.NEST_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default serverApi;
