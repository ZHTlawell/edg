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
            config.headers = config.headers || {};
            if (typeof (config.headers as any).set === 'function') {
                (config.headers as any).set('Authorization', `Bearer ${token}`);
            } else {
                (config.headers as any)['Authorization'] = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 响应拦截器：统一处理错误提示
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const message = error.response?.data?.message || '网络请求故障，请稍后重试';

        // 如果是 401 身份过期，自动清理并跳转
        // 只有当本地确实有 token 但失效了才清理并跳转，避免循环或误伤
        if (error.response?.status === 401) {
            if (localStorage.getItem('token')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        }

        return Promise.reject(new Error(message));
    }
);

export default api;
