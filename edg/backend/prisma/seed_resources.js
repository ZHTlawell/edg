/**
 * seed_resources.js — 为现有课时注入视频/PDF学习资源
 * 运行: node prisma/seed_resources.js
 *
 * 资源来源：YouTube 公开教育视频 (CC/freeCodeCamp/官方频道)
 * 每门课部分核心课时配置 VIDEO_EMBED 资源，其余可由老师手动上传
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── 资源映射表 (lesson标题 → 资源数组) ───────────────────────────────────────
// YouTube embed 格式: https://www.youtube.com/embed/{VIDEO_ID}
const RESOURCES_BY_TITLE = {
    // ── 高级UI/UX设计实战 ──────────────────────────────────────────────────────
    '设计思维导论':       [{ title: 'UI/UX Design Full Course for Beginners', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/c9Wg6Cb_YlU' }],
    '用户研究方法':       [{ title: 'UX Research Methods Explained', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/tHJoELJa6c0' }],
    '信息架构设计':       [{ title: 'Information Architecture in UX', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/rO98eTwdPkA' }],
    '用户旅程地图':       [{ title: 'User Journey Mapping Tutorial', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/mSxpVRo3BLg' }],
    '色彩与排版':         [{ title: 'Color Theory for Designers', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/o0Y1h4yLaAo' }],
    '组件系统设计':       [{ title: 'Design Systems in Figma', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/8J6HuvosP0s' }],
    'Figma进阶技巧':      [{ title: 'Figma Advanced Tutorial', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/HZuk6Wkx_Eg' }],
    '响应式设计':         [{ title: 'Responsive Web Design Tutorial', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/ZYV6dYtz4HA' }],
    '交互设计原则':       [{ title: 'Interaction Design Principles', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/hMXf0glxFls' }],
    '原型制作':           [{ title: 'Figma Prototyping Tutorial', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/lTIeZ2ahEkQ' }],
    '动效设计基础':       [{ title: 'UI Animation & Motion Design', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/pXoWZi9WR3M' }],
    '可用性测试':         [{ title: 'Usability Testing Guide', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/0YL0xoSmyZI' }],
    '电商App设计':        [{ title: 'App UI Design Case Study', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/pcc9nPo_1ys' }],

    // ── 全栈开发：React+Node ───────────────────────────────────────────────────
    'HTML语义化':         [{ title: 'HTML Full Course (freeCodeCamp)', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/kUMe1FH4CHE' }],
    'CSS布局技巧':        [{ title: 'CSS Flexbox & Grid Crash Course', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/phWxA89Dy94' }],
    'JavaScript基础':     [{ title: 'JavaScript Crash Course (Traversy)', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/hdI2bqOjy3c' }],
    'ES6+新特性':         [{ title: 'ES6 JavaScript Tutorial', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/WZQc7RUAg18' }],
    'TypeScript入门':     [{ title: 'TypeScript Crash Course 2024', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/BwCrGgit6Yc' }],
    '前端工程化':         [{ title: 'Vite & Modern Frontend Tooling', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/89NJdbYTgJ8' }],
    '组件与Props':        [{ title: 'React Crash Course 2024', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/w7ejDZ8SWv8' }],
    'State与生命周期':    [{ title: 'React State Explained', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/35lXWvCuM8o' }],
    'Hooks深度讲解':      [{ title: 'React Hooks Crash Course', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/O6P86uwfdR0' }],
    '路由与状态管理':     [{ title: 'React Router & State Management', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/59IXY5IDrBA' }],
    'Node.js核心模块':    [{ title: 'Node.js Crash Course (Traversy)', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/fBNz5xF-Kx4' }],
    'Express框架':        [{ title: 'Express.js Crash Course', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/L72fhGm1tfE' }],
    'RESTful API设计':    [{ title: 'REST API Design Best Practices', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/lsMQRaeKNDk' }],
    '数据库操作':         [{ title: 'MySQL Crash Course', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/9ylj9NR0Lcg' }],
    'JWT认证':            [{ title: 'JWT Authentication Tutorial', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/mbsmsi7l3r4' }],
    '云服务器部署':       [{ title: 'Deploy Node App to Production', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/l134cBAJCuc' }],

    // ── 零基础Python自动化 ─────────────────────────────────────────────────────
    'Python环境搭建':     [{ title: 'Python for Beginners – Full Course', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/rfscVS0vtbw' }],
    '变量与数据类型':     [{ title: 'Python Variables & Data Types', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/khKv-8q7YmY' }],
    '控制流程':           [{ title: 'Python Control Flow', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/DZwmZ8Usvnk' }],
    '函数与模块':         [{ title: 'Python Functions Tutorial', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/9Os0o3wzS_I' }],
    '面向对象编程':       [{ title: 'Python OOP Tutorial (Corey Schafer)', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/ZDa-Z5JzLYM' }],
    '文件操作':           [{ title: 'Python File Automation', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/s8XjEuplx_U' }],
    'Excel自动化(openpyxl)': [{ title: 'Automate Excel with Python & openpyxl', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/nsKNPHJ9iPc' }],
    '网络请求(requests)': [{ title: 'Python Requests Library Tutorial', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/Xi1F2ZMAZ7Q' }],
    'HTML解析(BeautifulSoup)': [{ title: 'Python Web Scraping with BeautifulSoup', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/XVv6mJpFOb0' }],
    '数据处理(pandas)':   [{ title: 'Pandas Tutorial (Corey Schafer)', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/vmEHCJofslg' }],

    // ── 数据分析与可视化 ───────────────────────────────────────────────────────
    '数据分析思维':       [{ title: 'Data Analysis Thinking & Process', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/r-uWLJ29asv0' }],
    'Excel高级函数':      [{ title: 'Excel Advanced Functions Tutorial', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/0nbkaYsR94c' }],
    'SQL查询基础':        [{ title: 'SQL Tutorial for Beginners', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/HXV3zeQKqGY' }],
    'Pandas数据处理':     [{ title: 'Pandas Full Course (Corey Schafer)', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/vmEHCJofslg' }],
    'NumPy科学计算':      [{ title: 'NumPy Tutorial for Beginners', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/QUT1VHiLmmI' }],
    '数据清洗技巧':       [{ title: 'Data Cleaning with Python & Pandas', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/bDhvCp3_lYw' }],
    'Matplotlib基础':     [{ title: 'Matplotlib Tutorial (Corey Schafer)', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/UO98lJQ3QGI' }],
    'Seaborn统计图表':    [{ title: 'Seaborn Tutorial', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/6GUZXDef2U0' }],
    'ECharts交互图表':    [{ title: 'ECharts Data Visualization Tutorial', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/hMXf0glxFls' }],
    'Tableau入门':        [{ title: 'Tableau Full Course for Beginners', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/TPMlZxRRaBQ' }],

    // ── 人工智能基础与应用 ─────────────────────────────────────────────────────
    'AI发展史与应用场景': [{ title: 'AI & Machine Learning Explained', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/GvYYFloV0aA' }],
    '线性代数基础':       [{ title: 'Essence of Linear Algebra (3Blue1Brown)', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/fNk_zzaMoSs' }],
    '概率论与统计':       [{ title: 'Statistics and Probability Full Course', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/xxpc-HPKN28' }],
    '监督学习算法':       [{ title: 'Machine Learning Course (Andrew Ng clips)', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/KNAWp2S3w94' }],
    'Scikit-learn实战':   [{ title: 'Scikit-learn Tutorial (Python ML)', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/0Lt9w-BxKFQ' }],
    '神经网络原理':       [{ title: 'But what IS a Neural Network? (3Blue1Brown)', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/aircAruvnKk' }],
    'CNN卷积网络':        [{ title: 'Convolutional Neural Networks Explained', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/KuXjwB4LzSA' }],
    'Transformer架构':    [{ title: 'Transformer Neural Network Explained', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/4Bdc55j80l8' }],
    'PyTorch实战':        [{ title: 'PyTorch Full Course for Beginners', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/c36lUUr864M' }],

    // ── 产品经理实战训练营 ─────────────────────────────────────────────────────
    '产品经理职责解析':   [{ title: 'What Does a Product Manager Do?', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/yIITnS_sn5c' }],
    '用户需求挖掘':       [{ title: 'How to Discover User Needs', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/b1NRjFPe-TQ' }],
    '竞品分析方法':       [{ title: 'Competitive Analysis Framework', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/kAtRN4A2QUY' }],
    '原型设计(Axure)':    [{ title: 'Axure RP Prototyping Tutorial', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/apOvF9NVguA' }],
    'A/B测试':            [{ title: 'A/B Testing Explained', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/zFMgpxG-chM' }],
    '数据指标体系':       [{ title: 'Product Metrics & KPIs', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/bGioBBGUMaU' }],
};

async function main() {
    console.log('🎬 开始注入课时视频资源...\n');

    // 获取 admin 用户
    const creator = await prisma.sysUser.findFirst({ where: { role: 'ADMIN' } });
    if (!creator) { console.error('❌ 未找到 ADMIN 用户'); return; }

    // 获取所有课时
    const allLessons = await prisma.stdCourseLesson.findMany({
        include: {
            resources: true,
            chapter: { include: { standard: { include: { courses: { select: { name: true } } } } } }
        }
    });

    let added = 0, skipped = 0;

    for (const lesson of allLessons) {
        // 已有资源则跳过
        if (lesson.resources.length > 0) { skipped++; continue; }

        const resourceDefs = RESOURCES_BY_TITLE[lesson.title];
        if (!resourceDefs || resourceDefs.length === 0) { continue; }

        // 获取课程标准 ID
        const standardId = lesson.chapter?.standard?.id;

        for (let i = 0; i < resourceDefs.length; i++) {
            const def = resourceDefs[i];
            const resource = await prisma.stdResource.create({
                data: {
                    title: def.title,
                    type: def.type,
                    url: def.url,
                    status: 'PUBLISHED',
                    standard_id: standardId || null,
                    creator_id: creator.id,
                    sort_order: i,
                }
            });
            await prisma.stdLessonResource.create({
                data: { lesson_id: lesson.id, resource_id: resource.id, sort_order: i }
            });
        }

        const courseName = lesson.chapter?.standard?.courses?.[0]?.name || '';
        console.log(`  ✅ [${courseName}] ${lesson.title} → ${resourceDefs.length} 个资源`);
        added++;
    }

    console.log(`\n🎉 完成！新增 ${added} 个课时的资源，跳过 ${skipped} 个已有资源的课时`);
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
