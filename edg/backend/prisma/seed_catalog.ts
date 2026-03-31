/**
 * seed_catalog.ts — 课程目录 + 章节 + 课时 + 学习资源 演示数据
 * 运行: npx ts-node prisma/seed_catalog.ts
 *
 * 仅追加，不删除现有数据。会跳过已有 standard 的课程。
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ── 课程资源映射表 (YouTube embed URL) ───────────────────────────────────────
// type: VIDEO_EMBED = YouTube/外链视频(iframe 嵌入), PDF = 文档资料
const COURSE_DATA: Record<string, {
    category: string;
    chapters: {
        title: string;
        lessons: {
            title: string;
            duration: number; // 分钟
            resources: { title: string; type: string; url: string }[];
        }[];
    }[];
}> = {
    '高级UI/UX设计实战': {
        category: '设计',
        chapters: [
            {
                title: '设计基础与思维',
                lessons: [
                    {
                        title: '设计思维导论',
                        duration: 90,
                        resources: [
                            { title: 'UI/UX Design Full Course', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/c9Wg6Cb_YlU' },
                            { title: 'Design Thinking Handbook (PDF)', type: 'PDF', url: 'https://public.tableau.com/static/assets/DesignThinking.pdf' },
                        ],
                    },
                    {
                        title: '用户研究方法',
                        duration: 90,
                        resources: [
                            { title: 'User Research Methods', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/tHJoELJa6c0' },
                        ],
                    },
                    {
                        title: '信息架构设计',
                        duration: 90,
                        resources: [
                            { title: 'Information Architecture Basics', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/rO98eTwdPkA' },
                        ],
                    },
                    {
                        title: '用户旅程地图',
                        duration: 90,
                        resources: [
                            { title: 'User Journey Mapping Tutorial', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/mSxpVRo3BLg' },
                        ],
                    },
                ],
            },
            {
                title: 'UI设计核心技能',
                lessons: [
                    {
                        title: '色彩与排版',
                        duration: 90,
                        resources: [
                            { title: 'Color Theory for Designers', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/o0Y1h4yLaAo' },
                        ],
                    },
                    {
                        title: 'Figma工具入门',
                        duration: 90,
                        resources: [
                            { title: 'Figma Tutorial for Beginners (2024)', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/HZuk6Wkx_Eg' },
                        ],
                    },
                    {
                        title: '组件系统设计',
                        duration: 90,
                        resources: [
                            { title: 'Design System in Figma', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/8J6HuvosP0s' },
                        ],
                    },
                    {
                        title: '响应式设计原则',
                        duration: 90,
                        resources: [
                            { title: 'Responsive UI Design', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/ZYV6dYtz4HA' },
                        ],
                    },
                ],
            },
            {
                title: '交互设计进阶',
                lessons: [
                    { title: '交互原型制作', duration: 90, resources: [{ title: 'Prototyping in Figma', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/lTIeZ2ahEkQ' }] },
                    { title: '动效设计基础', duration: 90, resources: [{ title: 'UI Animation Principles', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/pXoWZi9WR3M' }] },
                    { title: '可用性测试方法', duration: 90, resources: [{ title: 'Usability Testing', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/0YL0xoSmyZI' }] },
                    { title: '设计评审与迭代', duration: 90, resources: [] },
                ],
            },
            {
                title: '实战项目',
                lessons: [
                    { title: 'App设计全流程', duration: 90, resources: [{ title: 'Mobile App Design Case Study', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/pcc9nPo_1ys' }] },
                    { title: '设计稿交付规范', duration: 90, resources: [] },
                    { title: '作品集整理', duration: 90, resources: [] },
                    { title: '结课答辩', duration: 90, resources: [] },
                ],
            },
        ],
    },

    '全栈开发：React+Node': {
        category: '编程',
        chapters: [
            {
                title: 'React 核心基础',
                lessons: [
                    {
                        title: 'JSX 与组件基础',
                        duration: 90,
                        resources: [
                            { title: 'React Crash Course 2024', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/w7ejDZ8SWv8' },
                        ],
                    },
                    {
                        title: 'State 与 Props',
                        duration: 90,
                        resources: [
                            { title: 'React State & Props Explained', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/35lXWvCuM8o' },
                        ],
                    },
                    {
                        title: 'React Hooks 深入',
                        duration: 90,
                        resources: [
                            { title: 'React Hooks Tutorial', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/O6P86uwfdR0' },
                        ],
                    },
                    { title: '路由与导航', duration: 90, resources: [{ title: 'React Router Tutorial', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/59IXY5IDrBA' }] },
                ],
            },
            {
                title: 'Node.js 服务端开发',
                lessons: [
                    { title: 'Node.js 入门', duration: 90, resources: [{ title: 'Node.js Crash Course', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/fBNz5xF-Kx4' }] },
                    { title: 'Express 框架基础', duration: 90, resources: [{ title: 'Express.js Tutorial', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/L72fhGm1tfE' }] },
                    { title: 'RESTful API 设计', duration: 90, resources: [{ title: 'REST API Design', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/lsMQRaeKNDk' }] },
                    { title: '中间件与认证', duration: 90, resources: [] },
                ],
            },
            {
                title: '数据库与全栈整合',
                lessons: [
                    { title: 'MySQL 基础操作', duration: 90, resources: [{ title: 'MySQL Crash Course', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/9ylj9NR0Lcg' }] },
                    { title: 'Prisma ORM 入门', duration: 90, resources: [{ title: 'Prisma Tutorial', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/RebA5J-rlwg' }] },
                    { title: '前后端联调', duration: 90, resources: [] },
                    { title: '部署与上线', duration: 90, resources: [{ title: 'Deploy Full Stack App', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/l134cBAJCuc' }] },
                ],
            },
            {
                title: '进阶专题',
                lessons: [
                    { title: 'TypeScript 实战', duration: 90, resources: [{ title: 'TypeScript Full Course', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/BwCrGgit6Yc' }] },
                    { title: 'React 状态管理 (Zustand)', duration: 90, resources: [] },
                    { title: '性能优化', duration: 90, resources: [] },
                    { title: '实战项目答辩', duration: 90, resources: [] },
                ],
            },
        ],
    },

    '零基础Python自动化': {
        category: '编程',
        chapters: [
            {
                title: 'Python 基础语法',
                lessons: [
                    { title: 'Python 环境与基础语法', duration: 90, resources: [{ title: 'Python for Beginners (Full Course)', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/rfscVS0vtbw' }] },
                    { title: '数据类型与变量', duration: 90, resources: [] },
                    { title: '流程控制', duration: 90, resources: [{ title: 'Python Control Flow', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/DZwmZ8Usvnk' }] },
                    { title: '函数与模块', duration: 90, resources: [] },
                ],
            },
            {
                title: '自动化实战',
                lessons: [
                    { title: '文件与目录操作', duration: 90, resources: [{ title: 'Python File Automation', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/s8XjEuplx_U' }] },
                    { title: '网络爬虫基础', duration: 90, resources: [{ title: 'Python Web Scraping', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/XVv6mJpFOb0' }] },
                    { title: '定时任务与批处理', duration: 90, resources: [] },
                    { title: 'Excel 自动化处理', duration: 90, resources: [{ title: 'Automate Excel with Python', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/nsKNPHJ9iPc' }] },
                ],
            },
            {
                title: '综合项目',
                lessons: [
                    { title: '项目规划与设计', duration: 90, resources: [] },
                    { title: '代码实现', duration: 90, resources: [] },
                    { title: '测试与调试', duration: 90, resources: [] },
                    { title: '项目展示', duration: 90, resources: [] },
                ],
            },
        ],
    },

    '数据分析与可视化': {
        category: '数据',
        chapters: [
            {
                title: '数据分析基础',
                lessons: [
                    { title: 'NumPy 核心操作', duration: 90, resources: [{ title: 'NumPy Tutorial', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/QUT1VHiLmmI' }] },
                    { title: 'Pandas 数据处理', duration: 90, resources: [{ title: 'Pandas Tutorial (Corey Schafer)', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/vmEHCJofslg' }] },
                    { title: '数据清洗技巧', duration: 90, resources: [] },
                    { title: '数据聚合与分组', duration: 90, resources: [] },
                ],
            },
            {
                title: '数据可视化',
                lessons: [
                    { title: 'Matplotlib 基础绘图', duration: 90, resources: [{ title: 'Matplotlib Tutorial', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/UO98lJQ3QGI' }] },
                    { title: 'Seaborn 统计图表', duration: 90, resources: [] },
                    { title: '交互式图表 (Plotly)', duration: 90, resources: [{ title: 'Plotly Dash Tutorial', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/hSPmj7mK6ng' }] },
                    { title: '商业报表制作', duration: 90, resources: [] },
                ],
            },
            {
                title: '实战与项目',
                lessons: [
                    { title: '电商数据分析', duration: 90, resources: [] },
                    { title: '用户行为分析', duration: 90, resources: [] },
                    { title: '数据报告撰写', duration: 90, resources: [] },
                    { title: '结课报告展示', duration: 90, resources: [] },
                ],
            },
        ],
    },

    '人工智能基础与应用': {
        category: 'AI',
        chapters: [
            {
                title: '机器学习基础',
                lessons: [
                    { title: '什么是人工智能', duration: 90, resources: [{ title: 'Neural Networks Explained (3Blue1Brown)', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/aircAruvnKk' }] },
                    { title: '监督学习原理', duration: 90, resources: [{ title: 'Supervised Learning Tutorial', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/KNAWp2S3w94' }] },
                    { title: 'Scikit-learn 实践', duration: 90, resources: [] },
                    { title: '模型评估与调优', duration: 90, resources: [] },
                ],
            },
            {
                title: '深度学习入门',
                lessons: [
                    { title: '神经网络原理', duration: 90, resources: [{ title: 'Gradient Descent, How NNs Learn', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/IHZwWFHWa-w' }] },
                    { title: 'TensorFlow/Keras 基础', duration: 90, resources: [{ title: 'TensorFlow 2.0 Tutorial', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/tPYj3fFJGjk' }] },
                    { title: '卷积神经网络 (CNN)', duration: 90, resources: [] },
                    { title: '图像分类实战', duration: 90, resources: [] },
                ],
            },
            {
                title: 'AI 应用开发',
                lessons: [
                    { title: 'NLP 文本处理入门', duration: 90, resources: [] },
                    { title: '大语言模型 API 调用', duration: 90, resources: [] },
                    { title: '智能应用构建', duration: 90, resources: [] },
                    { title: '综合项目实战', duration: 90, resources: [] },
                ],
            },
        ],
    },

    '产品经理实战训练营': {
        category: '产品',
        chapters: [
            {
                title: '产品思维与方法论',
                lessons: [
                    { title: '什么是产品经理', duration: 90, resources: [{ title: 'Product Management 101', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/yIITnS_sn5c' }] },
                    { title: '用户需求挖掘', duration: 90, resources: [] },
                    { title: '需求文档 (PRD) 撰写', duration: 90, resources: [] },
                    { title: '产品路线图规划', duration: 90, resources: [] },
                ],
            },
            {
                title: '产品设计与执行',
                lessons: [
                    { title: '原型设计工具', duration: 90, resources: [{ title: 'Product Roadmap & Prototyping', type: 'VIDEO_EMBED', url: 'https://www.youtube.com/embed/apOvF9NVguA' }] },
                    { title: '数据驱动决策', duration: 90, resources: [] },
                    { title: 'A/B 测试方法', duration: 90, resources: [] },
                    { title: '跨团队协作沟通', duration: 90, resources: [] },
                ],
            },
            {
                title: '案例与求职',
                lessons: [
                    { title: '产品案例拆解', duration: 90, resources: [] },
                    { title: '面试技巧与模拟', duration: 90, resources: [] },
                    { title: '作品集制作', duration: 90, resources: [] },
                    { title: '结营总结', duration: 90, resources: [] },
                ],
            },
        ],
    },
};

async function main() {
    console.log('📚 开始创建课程目录结构...\n');

    // 获取或创建 admin 用户作为 creator
    let creatorUser = await prisma.sysUser.findFirst({ where: { role: 'ADMIN' } });
    if (!creatorUser) {
        console.error('❌ 未找到 ADMIN 用户，请先运行 seed_full.ts');
        return;
    }

    // 创建/获取课程分类
    const categoryNames = ['设计', '编程', '数据', 'AI', '产品'];
    const categoryMap: Record<string, string> = {};
    for (const [i, name] of categoryNames.entries()) {
        const cat = await prisma.stdCourseCategory.upsert({
            where: { name },
            create: { name, sort_order: i, status: 'ENABLED' },
            update: {},
        });
        categoryMap[name] = cat.id;
        console.log(`  ✅ 课程分类: ${name}`);
    }

    // 遍历所有课程
    for (const [courseName, data] of Object.entries(COURSE_DATA)) {
        // 查找对应的 EdCourse
        const edCourse = await prisma.edCourse.findFirst({ where: { name: courseName } });
        if (!edCourse) {
            console.log(`  ⚠️  跳过 "${courseName}" —— 未找到对应课程`);
            continue;
        }

        // 如果已有 standard，跳过
        if (edCourse.standard_id) {
            console.log(`  ⏭️  跳过 "${courseName}" —— 已有课程标准`);
            continue;
        }

        const catId = categoryMap[data.category];
        const totalLessons = data.chapters.reduce((s, c) => s + c.lessons.length, 0);

        // 创建 StdCourseStandard
        const standard = await prisma.stdCourseStandard.create({
            data: {
                code: `STD-${courseName.slice(0, 4).replace(/\s/g, '')}-${Date.now()}`,
                name: courseName,
                category_id: catId,
                total_lessons: totalLessons,
                lesson_duration: 90,
                status: 'PUBLISHED',
                version: 1,
                creator_id: creatorUser.id,
            },
        });

        // 更新 EdCourse.standard_id
        await prisma.edCourse.update({
            where: { id: edCourse.id },
            data: { standard_id: standard.id },
        });

        // 创建章节 + 课时 + 资源
        for (const [ci, chapter] of data.chapters.entries()) {
            const chapterRecord = await prisma.stdCourseChapter.create({
                data: {
                    standard_id: standard.id,
                    title: chapter.title,
                    sort_order: ci + 1,
                },
            });

            for (const [li, lesson] of chapter.lessons.entries()) {
                const lessonRecord = await prisma.stdCourseLesson.create({
                    data: {
                        chapter_id: chapterRecord.id,
                        title: lesson.title,
                        sort_order: li + 1,
                        duration: lesson.duration,
                    },
                });

                // 创建并链接资源
                for (const [ri, res] of lesson.resources.entries()) {
                    const resource = await prisma.stdResource.create({
                        data: {
                            title: res.title,
                            type: res.type,
                            url: res.url,
                            status: 'PUBLISHED',
                            standard_id: standard.id,
                            creator_id: creatorUser.id,
                            sort_order: ri,
                        },
                    });
                    await prisma.stdLessonResource.create({
                        data: {
                            lesson_id: lessonRecord.id,
                            resource_id: resource.id,
                            sort_order: ri,
                        },
                    });
                }
            }

            console.log(`    📖 ${courseName} › ${chapter.title} (${chapter.lessons.length} 课时)`);
        }

        console.log(`  ✅ ${courseName} 课程目录创建完成 (${totalLessons} 课时)\n`);
    }

    console.log('\n🎉 课程目录 Seed 完成！');
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
