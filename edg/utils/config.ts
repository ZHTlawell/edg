/**
 * 统一的 API 后端地址配置
 *
 * 本地开发（默认）：http://localhost:3001
 * 公网 tunnel / 生产：在项目根目录 .env 中配置 VITE_API_BASE=https://xxx.trycloudflare.com
 *
 * 注意：.env 修改后需要重启 Vite dev server 才会生效
 */
export const API_BASE: string =
    (import.meta as any).env?.VITE_API_BASE || 'http://localhost:3001';

/** 把后端返回的相对 URL（如 /uploads/xxx.pdf）拼成完整可访问地址 */
export const toAbsoluteUrl = (path?: string): string => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
};
