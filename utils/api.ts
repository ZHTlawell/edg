import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3001', // NestJS 默认端口升级
    timeout: 10000,
});

// 请求拦截器：注入 JWT Token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 响应拦截器：统一处理错误提示
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        const message = error.response?.data?.message || '网络请求故障，请稍后重试';

        // 如果是 401 身份过期，自动清理并跳转
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }

        return Promise.reject(new Error(message));
    }
);

export default api;
