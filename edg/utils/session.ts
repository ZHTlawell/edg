/**
 * 多端会话隔离管理
 *
 * 核心思路：
 *   - active_role 存 sessionStorage → 每个浏览器标签页独立，互不干扰
 *   - token 按角色存 localStorage   → 跨标签页共享（同一角色不用重复登录）
 *   - Zustand store 按角色存 localStorage → 刷新后能恢复该标签页对应角色的数据
 *
 * Tab A 登教师、Tab B 登学员 → 各自刷新都能恢复自己的角色。
 */

const ROLE_TOKEN_PREFIX = 'edg_token_';
const ACTIVE_ROLE_KEY = 'edg_active_role';

// ── active role：用 sessionStorage，标签页级隔离 ──

// 获取当前标签页的活跃角色（从 sessionStorage 读取）
export function getActiveRole(): string | null {
    return sessionStorage.getItem(ACTIVE_ROLE_KEY);
}

// 设置当前标签页的活跃角色
export function setActiveRole(role: string) {
    sessionStorage.setItem(ACTIVE_ROLE_KEY, role);
}

// 清除当前标签页的活跃角色（内部使用）
function clearActiveRole() {
    sessionStorage.removeItem(ACTIVE_ROLE_KEY);
}

// ── token：用 localStorage，按角色隔离 ──

// 获取指定角色（或当前活跃角色）的 JWT token
export function getTokenForRole(role?: string): string | null {
    const r = role || getActiveRole();
    if (!r) return null;
    return localStorage.getItem(ROLE_TOKEN_PREFIX + r);
}

// 保存指定角色的 JWT token（跨标签页共享同一角色的登录态）
export function setTokenForRole(role: string, token: string) {
    localStorage.setItem(ROLE_TOKEN_PREFIX + role, token);
}

// 移除指定角色的 token（该角色退出登录时）
export function removeTokenForRole(role: string) {
    localStorage.removeItem(ROLE_TOKEN_PREFIX + role);
}

/** 当前标签页活跃角色的 token（供 api 拦截器使用） */
export function getActiveToken(): string | null {
    return getTokenForRole(getActiveRole() || undefined);
}

/** 退出当前标签页的会话 */
export function clearActiveSession() {
    const role = getActiveRole();
    if (role) {
        removeTokenForRole(role);
    }
    clearActiveRole();
}

// ── Zustand store key：localStorage，按角色隔离 ──

// 返回当前角色的 zustand 持久化 key，实现按角色隔离 store
export function getStoreKey(): string {
    const role = getActiveRole();
    return role ? `edg_store_${role}` : 'edg_store_default';
}

// ── 兼容迁移：旧格式 → 新格式（只跑一次） ──

// 兼容旧版本：把 localStorage['token'] 迁移到新的按角色隔离 key
export function migrateOldToken() {
    const oldToken = localStorage.getItem('token');
    if (!oldToken) return;
    try {
        const oldStore = localStorage.getItem('eduadmin-storage-v2');
        if (oldStore) {
            const parsed = JSON.parse(oldStore);
            const role = parsed?.state?.currentUser?.role;
            if (role) {
                setTokenForRole(role, oldToken);
                setActiveRole(role);
            }
        }
    } catch { /* ignore */ }
    localStorage.removeItem('token');
}
