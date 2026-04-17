#!/bin/bash
# ╔══════════════════════════════════════════════════════════════╗
# ║              EDG 项目公网启动脚本                             ║
# ║  运行此脚本会自动：                                           ║
# ║  1. 启动后端 (NestJS :3001)                                  ║
# ║  2. 启动 Cloudflare Tunnel 暴露后端                          ║
# ║  3. 自动写入 .env，切换为公网 API 地址                        ║
# ║  4. 启动前端 (Vite :3000)                                    ║
# ║  5. 启动 Cloudflare Tunnel 暴露前端                          ║
# ║  6. 打印最终可分享的公网地址                                  ║
# ║                                                              ║
# ║  使用方法：                                                   ║
# ║    cd /Users/macmini/Desktop/Edg1/edg                        ║
# ║    bash start-public.sh                                      ║
# ║                                                              ║
# ║  结束：按 Ctrl+C，脚本会自动清理所有后台进程                  ║
# ╚══════════════════════════════════════════════════════════════╝

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
LOG_DIR="/tmp/edg-logs"
mkdir -p "$LOG_DIR"

# ── 颜色输出 ──────────────────────────────────────────────────
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
RESET='\033[0m'

log()  { echo -e "${CYAN}[EDG]${RESET} $1"; }
ok()   { echo -e "${GREEN}[✓]${RESET} $1"; }
warn() { echo -e "${YELLOW}[!]${RESET} $1"; }
err()  { echo -e "${RED}[✗]${RESET} $1"; }

# ── 清理函数（Ctrl+C 时调用）──────────────────────────────────
PIDS=()
cleanup() {
    echo ""
    warn "正在停止所有服务..."
    for pid in "${PIDS[@]}"; do
        kill "$pid" 2>/dev/null || true
    done
    # 恢复 .env 为本地开发模式
    echo "VITE_API_BASE=http://localhost:3001" > "$PROJECT_DIR/.env"
    ok "已恢复 .env 为本地开发模式"
    ok "所有服务已停止。再见！"
    exit 0
}
trap cleanup SIGINT SIGTERM

echo ""
echo -e "${BOLD}╔════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║     EDG 公网模式启动中，请稍候...      ║${RESET}"
echo -e "${BOLD}╚════════════════════════════════════════╝${RESET}"
echo ""

# ══════════════════════════════════════════
# 第 1 步：启动后端
# ══════════════════════════════════════════
log "第 1 步：启动后端服务 (port 3001)..."

# 先停掉旧进程
pkill -f "nest start" 2>/dev/null || true
pkill -f "ts-node" 2>/dev/null    || true

cd "$BACKEND_DIR"
npm run start:dev > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
PIDS+=($BACKEND_PID)

# 等待后端就绪
log "等待后端启动..."
for i in $(seq 1 30); do
    if grep -q "Nest application successfully started" "$LOG_DIR/backend.log" 2>/dev/null; then
        ok "后端已启动 (PID: $BACKEND_PID)"
        break
    fi
    if [ $i -eq 30 ]; then
        err "后端启动超时，请检查 $LOG_DIR/backend.log"
        exit 1
    fi
    sleep 1
done

# ══════════════════════════════════════════
# 第 2 步：启动后端 Cloudflare Tunnel
# ══════════════════════════════════════════
log "第 2 步：启动后端 Cloudflare Tunnel..."
cloudflared tunnel --url http://localhost:3001 > "$LOG_DIR/cf-backend.log" 2>&1 &
CF_BACKEND_PID=$!
PIDS+=($CF_BACKEND_PID)

# 等待 Tunnel 地址出现
log "等待后端 Tunnel 分配地址（约 10 秒）..."
BACKEND_URL=""
for i in $(seq 1 30); do
    BACKEND_URL=$(grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG_DIR/cf-backend.log" 2>/dev/null | head -1)
    if [ -n "$BACKEND_URL" ]; then
        ok "后端公网地址：$BACKEND_URL"
        break
    fi
    if [ $i -eq 30 ]; then
        err "获取后端 Tunnel 地址超时，请检查 $LOG_DIR/cf-backend.log"
        exit 1
    fi
    sleep 1
done

# ══════════════════════════════════════════
# 第 3 步：写入 .env
# ══════════════════════════════════════════
log "第 3 步：更新 .env → $BACKEND_URL"
echo "VITE_API_BASE=$BACKEND_URL" > "$PROJECT_DIR/.env"
ok ".env 已更新"

# ══════════════════════════════════════════
# 第 4 步：启动前端
# ══════════════════════════════════════════
log "第 4 步：启动前端 (port 3000)..."
pkill -f "vite" 2>/dev/null || true
sleep 1

cd "$PROJECT_DIR"
node node_modules/.bin/vite > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
PIDS+=($FRONTEND_PID)

# 等待前端就绪
for i in $(seq 1 20); do
    if grep -q "Local:" "$LOG_DIR/frontend.log" 2>/dev/null; then
        ok "前端已启动 (PID: $FRONTEND_PID)"
        break
    fi
    if [ $i -eq 20 ]; then
        err "前端启动超时，请检查 $LOG_DIR/frontend.log"
        exit 1
    fi
    sleep 1
done

# ══════════════════════════════════════════
# 第 5 步：启动前端 Cloudflare Tunnel
# ══════════════════════════════════════════
log "第 5 步：启动前端 Cloudflare Tunnel..."
cloudflared tunnel --url http://localhost:3000 > "$LOG_DIR/cf-frontend.log" 2>&1 &
CF_FRONTEND_PID=$!
PIDS+=($CF_FRONTEND_PID)

# 等待前端 Tunnel 地址
log "等待前端 Tunnel 分配地址（约 10 秒）..."
FRONTEND_URL=""
for i in $(seq 1 30); do
    FRONTEND_URL=$(grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOG_DIR/cf-frontend.log" 2>/dev/null | head -1)
    if [ -n "$FRONTEND_URL" ]; then
        ok "前端公网地址：$FRONTEND_URL"
        break
    fi
    if [ $i -eq 30 ]; then
        err "获取前端 Tunnel 地址超时，请检查 $LOG_DIR/cf-frontend.log"
        exit 1
    fi
    sleep 1
done

# ══════════════════════════════════════════
# 启动完成！
# ══════════════════════════════════════════
echo ""
echo -e "${BOLD}${GREEN}╔════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${GREEN}║                   🎉 所有服务已就绪！                      ║${RESET}"
echo -e "${BOLD}${GREEN}╠════════════════════════════════════════════════════════════╣${RESET}"
echo -e "${BOLD}${GREEN}║${RESET}  📡 本机访问：  ${CYAN}http://localhost:3000${RESET}"
echo -e "${BOLD}${GREEN}║${RESET}  🌐 公网地址：  ${CYAN}${FRONTEND_URL}${RESET}  ${YELLOW}← 发给对方${RESET}"
echo -e "${BOLD}${GREEN}║${RESET}  🔧 后端 API：  ${CYAN}${BACKEND_URL}${RESET}"
echo -e "${BOLD}${GREEN}╠════════════════════════════════════════════════════════════╣${RESET}"
echo -e "${BOLD}${GREEN}║${RESET}  日志目录：$LOG_DIR"
echo -e "${BOLD}${GREEN}║${RESET}  按 ${RED}Ctrl+C${RESET} 停止所有服务并恢复本地开发模式"
echo -e "${BOLD}${GREEN}╚════════════════════════════════════════════════════════════╝${RESET}"
echo ""

# 保持脚本运行，持续输出前端 Tunnel 日志以监控状态
wait
