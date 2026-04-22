/**
 * 统一 Axios 实例
 * 作用：
 *   1. 绑定后端基础地址与 5 分钟超时（兼容大文件上传）
 *   2. 请求拦截器：自动注入当前标签页活跃角色的 JWT
 *   3. 响应拦截器：统一错误消息，登录态失效时自动清会话
 */
import axios from 'axios';
import { getActiveToken, clearActiveSession } from './session';
import { API_BASE } from './config';

// 创建 Axios 实例：所有业务请求均应使用此实例，保证拦截器统一生效
const api = axios.create({
    baseURL: API_BASE,
    timeout: 300000, // 5 分钟，兼容大文件上传（Cloudflare Tunnel 下延迟较高）
});

// 请求拦截器：注入当前活跃角色的 JWT Token
api.interceptors.request.use(
    (config) => {
        const token = getActiveToken();
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

        if (error.response?.status === 401) {
            const msg = error.response?.data?.message || '';
            const isAuthFailure = !msg || msg.includes('Unauthorized') || msg.includes('expired') || msg.includes('invalid') || msg.includes('token');
            const isMereRoleBlock = msg.includes('仅') || msg.includes('无权限') || msg.includes('only');
            if (!isMereRoleBlock && isAuthFailure && getActiveToken()) {
                clearActiveSession();
            }
        }

        return Promise.reject(new Error(message));
    }
);

export default api;
