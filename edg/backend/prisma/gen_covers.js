/**
 * gen_covers.js — 为每门课程生成封面图
 * 运行: node prisma/gen_covers.js
 */
const { PrismaClient } = require('@prisma/client');
const { createCanvas, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const OUT_DIR = path.join(__dirname, '..', 'uploads', 'resources');
const FONT_PATH = '/tmp/NotoSansSC-Bold.otf';

try { registerFont(FONT_PATH, { family: 'NotoSansSC', weight: 'bold' }); } catch (e) { console.warn('Font registration skipped:', e.message); }

// 课程封面设计配置
const COVERS = {
    '高级UI/UX设计实战': {
        gradient: ['#6366f1', '#a855f7', '#ec4899'],
        icon: '🎨',
        tags: ['Figma', 'Prototype', 'User Research'],
        subtitle: 'UI/UX Design Masterclass',
    },
    '全栈开发：React+Node': {
        gradient: ['#0ea5e9', '#3b82f6', '#6366f1'],
        icon: '⚛️',
        tags: ['React', 'Node.js', 'TypeScript'],
        subtitle: 'Full-Stack Development',
    },
    '零基础Python自动化': {
        gradient: ['#10b981', '#059669', '#047857'],
        icon: '🐍',
        tags: ['Python', 'Automation', 'Scripting'],
        subtitle: 'Python Automation',
    },
    '数据分析与可视化': {
        gradient: ['#f59e0b', '#d97706', '#b45309'],
        icon: '📊',
        tags: ['Pandas', 'SQL', 'Tableau'],
        subtitle: 'Data Analytics & Visualization',
    },
    '人工智能基础与应用': {
        gradient: ['#ef4444', '#dc2626', '#7c3aed'],
        icon: '🤖',
        tags: ['Neural Network', 'PyTorch', 'NLP'],
        subtitle: 'AI & Machine Learning',
    },
    '产品经理实战训练营': {
        gradient: ['#8b5cf6', '#7c3aed', '#6d28d9'],
        icon: '🚀',
        tags: ['PRD', 'User Growth', 'A/B Test'],
        subtitle: 'Product Management Bootcamp',
    },
};

// 将十六进制颜色字符串（如 "#6366f1"）解析为 {r, g, b} 数值对象
function hexToRGB(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
}

// 根据课程名和配色/图标/标签配置生成 800×400 的 PNG 封面 Buffer
// 封面布局：渐变底色 + 装饰圆 + 网格点 + 图标 + 课程名 + 英文副标题 + 标签胶囊 + 底部品牌标识
function generateCover(courseName, config) {
    const W = 800, H = 400;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, W, H);
    config.gradient.forEach((c, i) => grad.addColorStop(i / (config.gradient.length - 1), c));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Abstract decorative shapes
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(W * 0.85, H * 0.2, 180, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(W * 0.1, H * 0.9, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(W * 0.6, H * 0.85, 100, 0, Math.PI * 2);
    ctx.fill();

    // Grid dots pattern
    ctx.globalAlpha = 0.06;
    for (let x = 40; x < W; x += 30) {
        for (let y = 40; y < H; y += 30) {
            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.globalAlpha = 1;

    // Icon (large)
    ctx.font = '72px serif';
    ctx.fillText(config.icon, 56, 105);

    // Course name (Chinese)
    ctx.font = 'bold 36px "NotoSansSC", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(courseName, 56, 185);

    // Subtitle (English)
    ctx.font = '18px "NotoSansSC", sans-serif';
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(config.subtitle, 56, 220);
    ctx.globalAlpha = 1;

    // Tags
    let tagX = 56;
    const tagY = 280;
    ctx.font = 'bold 13px "NotoSansSC", sans-serif';
    for (const tag of config.tags) {
        const tw = ctx.measureText(tag).width + 24;
        // Tag background
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = '#ffffff';
        roundRect(ctx, tagX, tagY, tw, 30, 12);
        ctx.fill();
        // Tag border
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        roundRect(ctx, tagX, tagY, tw, 30, 12);
        ctx.stroke();
        // Tag text
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(tag, tagX + 12, tagY + 20);
        ctx.globalAlpha = 1;
        tagX += tw + 10;
    }

    // Bottom decorative line
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(56, 340, W - 112, 1);
    ctx.globalAlpha = 0.6;
    ctx.font = '12px "NotoSansSC", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('EduAdmin · 精品课程', 56, 370);
    ctx.globalAlpha = 1;

    return canvas.toBuffer('image/png');
}

// 在 Canvas 上绘制圆角矩形路径（不 fill/stroke，仅构造路径）
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

// 主流程：遍历 StdCourseStandard，为每个有 COVERS 配置的课程生成 PNG
// 并写入 uploads/resources 目录，同时更新 standard.cover_url 字段
// 前置依赖：标准课程表 StdCourseStandard 已有数据
async function main() {
    console.log('🖼️  生成课程封面图...\n');
    if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

    const standards = await prisma.stdCourseStandard.findMany({
        include: { courses: { select: { name: true } } },
    });

    for (const std of standards) {
        const courseName = std.courses[0]?.name || std.name;
        const config = COVERS[courseName];
        if (!config) {
            console.log(`  ⏭️  ${courseName} — 无封面配置`);
            continue;
        }

        const filename = `cover_${std.id.slice(0, 8)}.png`;
        const filePath = path.join(OUT_DIR, filename);
        const buf = generateCover(courseName, config);
        fs.writeFileSync(filePath, buf);

        await prisma.stdCourseStandard.update({
            where: { id: std.id },
            data: { cover_url: `/uploads/resources/${filename}` },
        });

        const sizeKB = (buf.length / 1024).toFixed(0);
        console.log(`  ✅ ${courseName} → ${filename} (${sizeKB}KB)`);
    }

    console.log('\n🎉 封面图生成完成！');
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
