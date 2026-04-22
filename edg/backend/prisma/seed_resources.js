/**
 * seed_resources.js — 为现有课时注入视频资源（公共免费 MP4 演示源）
 * 运行: node prisma/seed_resources.js
 *
 * 资源来源：MDN / W3Schools / video.js 等公开 CC0 / 公共域演示 MP4
 * 用途：毕设演示"在线学习页能播视频"的功能点，不承诺视频主题与课程一一对应。
 * 播放方式：<video> 原生标签直接播，不走 iframe embed，无版权/跨域/referer 限制。
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 公共域 / CC0 演示视频池（全部公开免费可商用）
const DEMO_VIDEOS = [
    { title: 'Flower 时光延迟（CC0）',       url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' },
    { title: 'Friday 街景（CC0）',            url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4' },
    { title: 'Big Buck Bunny 预览（Blender）', url: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { title: '动画短片 Movie（W3 Schools）',  url: 'https://www.w3schools.com/html/movie.mp4' },
    { title: 'Oceans 海洋画面（video.js）',   url: 'https://vjs.zencdn.net/v/oceans.mp4' },
];

// 按课程分组挑一个视频，同一课程下的课时都用同一个，便于演示时"同一门课看起来主题一致"
const COURSE_VIDEO_INDEX = {
    '高级UI/UX设计实战':   0,
    '全栈开发：React+Node': 1,
    '零基础Python自动化':   2,
    '数据分析与可视化':     3,
    '人工智能基础与应用':   4,
    '产品经理实战训练营':   0,
};

// 课时标题集合（与原映射一致，存在才注入）
const LESSON_BY_COURSE = {
    '高级UI/UX设计实战': ['设计思维导论','用户研究方法','信息架构设计','用户旅程地图','色彩与排版','组件系统设计','Figma进阶技巧','响应式设计','交互设计原则','原型制作','动效设计基础','可用性测试','电商App设计'],
    '全栈开发：React+Node': ['HTML语义化','CSS布局技巧','JavaScript基础','ES6+新特性','TypeScript入门','前端工程化','组件与Props','State与生命周期','Hooks深度讲解','路由与状态管理','Node.js核心模块','Express框架','RESTful API设计','数据库操作','JWT认证','云服务器部署'],
    '零基础Python自动化': ['Python环境搭建','变量与数据类型','控制流程','函数与模块','面向对象编程','文件操作','Excel自动化(openpyxl)','网络请求(requests)','HTML解析(BeautifulSoup)','数据处理(pandas)'],
    '数据分析与可视化': ['数据分析思维','Excel高级函数','SQL查询基础','Pandas数据处理','NumPy科学计算','数据清洗技巧','Matplotlib基础','Seaborn统计图表','ECharts交互图表','Tableau入门'],
    '人工智能基础与应用': ['AI发展史与应用场景','线性代数基础','概率论与统计','监督学习算法','Scikit-learn实战','神经网络原理','CNN卷积网络','Transformer架构','PyTorch实战'],
    '产品经理实战训练营': ['产品经理职责解析','用户需求挖掘','竞品分析方法','原型设计(Axure)','A/B测试','数据指标体系'],
};

// 根据课时标题反查它所属的课程，并返回该课程分配到的演示视频配置
// 课时标题不在白名单时返回 null（表示不注入）
function resolveVideoFor(lessonTitle) {
    for (const [courseName, lessons] of Object.entries(LESSON_BY_COURSE)) {
        if (lessons.includes(lessonTitle)) {
            const idx = COURSE_VIDEO_INDEX[courseName] ?? 0;
            return DEMO_VIDEOS[idx];
        }
    }
    return null;
}

// 主流程：遍历 StdCourseLesson，按课时标题匹配视频；
//   - 若课时已有 YouTube/bilibili iframe 资源，会删除并替换为本地 MP4
//   - 若课时已有其他非 iframe 资源，则跳过（防止误删）
// 前置依赖：ADMIN 用户 + 已有课时目录
async function main() {
    console.log('🎬 开始注入课时视频资源（公共 MP4 演示源）...\n');

    const creator = await prisma.sysUser.findFirst({ where: { role: 'ADMIN' } });
    if (!creator) { console.error('❌ 未找到 ADMIN 用户'); return; }

    const allLessons = await prisma.stdCourseLesson.findMany({
        include: {
            resources: { include: { resource: true } },
            chapter: { include: { standard: { include: { courses: { select: { name: true } } } } } }
        }
    });

    let added = 0, replaced = 0, skipped = 0;

    for (const lesson of allLessons) {
        const video = resolveVideoFor(lesson.title);
        if (!video) continue;

        // 清理历史 YouTube / bilibili iframe 残留，统一改用 MP4
        const stale = lesson.resources.filter(lr => {
            const u = (lr.resource?.url || '');
            return u.includes('youtube') || u.includes('bilibili') || lr.resource?.type === 'VIDEO_EMBED';
        });
        if (stale.length > 0) {
            await prisma.stdLessonResource.deleteMany({
                where: { id: { in: stale.map(lr => lr.id) } }
            });
            await prisma.stdResource.deleteMany({
                where: { id: { in: stale.map(lr => lr.resource_id) } }
            });
            replaced++;
        } else if (lesson.resources.length > 0) {
            skipped++; continue;
        }

        const standardId = lesson.chapter?.standard?.id;
        const resource = await prisma.stdResource.create({
            data: {
                title: video.title,
                type: 'VIDEO',
                url: video.url,
                status: 'PUBLISHED',
                standard_id: standardId || null,
                creator_id: creator.id,
                sort_order: 0,
            }
        });
        await prisma.stdLessonResource.create({
            data: { lesson_id: lesson.id, resource_id: resource.id, sort_order: 0 }
        });

        const courseName = lesson.chapter?.standard?.courses?.[0]?.name || '';
        console.log(`  ✅ [${courseName}] ${lesson.title} → MP4 演示视频`);
        added++;
    }

    console.log(`\n🎉 完成！新增 ${added} 个课时视频，替换历史 iframe 资源 ${replaced} 个，跳过已有非 iframe 资源 ${skipped} 个`);
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
