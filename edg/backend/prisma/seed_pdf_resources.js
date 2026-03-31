/**
 * seed_pdf_resources.js — 为课时补充 PDF/文档学习资源
 * 运行: node prisma/seed_pdf_resources.js
 *
 * 资源来源: 官方文档、MDN、W3Schools、开源教程 PDF 等公开可访问链接
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 课时标题 → PDF/文档资源
// 使用可 iframe 嵌入或可下载的公开文档链接
const PDF_BY_TITLE = {
    // ── UI/UX ──────────────────────────────────────────────────────────────────
    '设计思维导论':       [{ title: '设计思维五步法 (讲义)', type: 'PDF', url: 'https://dschool-old.stanford.edu/sandbox/groups/designresources/wiki/36873/attachments/74b3d/ModeGuideBOOTCAMP2010L.pdf' }],
    '用户研究方法':       [{ title: '用户研究方法概览 (NNGroup)', type: 'PDF', url: 'https://media.nngroup.com/media/reports/free/User_Research_Methods.pdf' }],
    '信息架构设计':       [{ title: '信息架构基础 (讲义)', type: 'PDF', url: 'https://www.usability.gov/sites/default/files/documents/guidelines_book.pdf' }],
    '色彩与排版':         [{ title: 'Material Design 色彩规范', type: 'PDF', url: 'https://m3.material.io/styles/color/overview' }],
    'Figma进阶技巧':      [{ title: 'Figma 官方快捷键速查表', type: 'PDF', url: 'https://help.figma.com/hc/en-us/articles/360040328653-Use-keyboard-shortcuts' }],
    '响应式设计':         [{ title: 'MDN 响应式设计指南', type: 'PDF', url: 'https://developer.mozilla.org/zh-CN/docs/Learn/CSS/CSS_layout/Responsive_Design' }],
    '交互设计原则':       [{ title: 'Nielsen 十大可用性原则 (讲义)', type: 'PDF', url: 'https://www.nngroup.com/articles/ten-usability-heuristics/' }],
    '动效设计基础':       [{ title: 'Material Motion 设计指南', type: 'PDF', url: 'https://m3.material.io/styles/motion/overview' }],

    // ── React+Node ─────────────────────────────────────────────────────────────
    'HTML语义化':         [{ title: 'MDN HTML 语义化标签指南', type: 'PDF', url: 'https://developer.mozilla.org/zh-CN/docs/Glossary/Semantics' }],
    'CSS布局技巧':        [
        { title: 'CSS Flexbox 完全指南', type: 'PDF', url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/' },
        { title: 'CSS Grid 完全指南', type: 'PDF', url: 'https://css-tricks.com/snippets/css/complete-guide-grid/' },
    ],
    'JavaScript基础':     [{ title: 'MDN JavaScript 入门教程', type: 'PDF', url: 'https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide' }],
    'ES6+新特性':         [{ title: 'ES6 特性速查表', type: 'PDF', url: 'https://devhints.io/es6' }],
    'TypeScript入门':     [{ title: 'TypeScript 官方手册 (中文)', type: 'PDF', url: 'https://www.typescriptlang.org/zh/docs/handbook/intro.html' }],
    '前端工程化':         [{ title: 'Vite 官方文档', type: 'PDF', url: 'https://cn.vitejs.dev/guide/' }],
    '组件与Props':        [{ title: 'React 官方文档 - 组件与Props', type: 'PDF', url: 'https://zh-hans.react.dev/learn/passing-props-to-a-component' }],
    'State与生命周期':    [{ title: 'React 官方文档 - State 管理', type: 'PDF', url: 'https://zh-hans.react.dev/learn/managing-state' }],
    'Hooks深度讲解':      [
        { title: 'React 官方文档 - Hooks 概览', type: 'PDF', url: 'https://zh-hans.react.dev/reference/react/hooks' },
        { title: 'useEffect 完全指南', type: 'PDF', url: 'https://overreacted.io/zh-hans/a-complete-guide-to-useeffect/' },
    ],
    '路由与状态管理':     [{ title: 'React Router v6 官方文档', type: 'PDF', url: 'https://reactrouter.com/en/main/start/overview' }],
    'React性能优化':      [{ title: 'React 性能优化策略 (文档)', type: 'PDF', url: 'https://zh-hans.react.dev/reference/react/memo' }],
    'Node.js核心模块':    [{ title: 'Node.js 官方文档 (中文)', type: 'PDF', url: 'https://nodejs.cn/api/' }],
    'Express框架':        [{ title: 'Express.js 官方指南', type: 'PDF', url: 'https://expressjs.com/zh-cn/guide/routing.html' }],
    'RESTful API设计':    [{ title: 'RESTful API 设计最佳实践', type: 'PDF', url: 'https://restfulapi.net/' }],
    '数据库操作':         [{ title: 'MySQL 官方教程', type: 'PDF', url: 'https://dev.mysql.com/doc/refman/8.0/en/tutorial.html' }],
    'JWT认证':            [{ title: 'JWT.io 规范说明', type: 'PDF', url: 'https://jwt.io/introduction' }],
    '中间件开发':         [{ title: 'Express 中间件指南', type: 'PDF', url: 'https://expressjs.com/zh-cn/guide/using-middleware.html' }],
    '云服务器部署':       [{ title: 'Nginx 部署指南', type: 'PDF', url: 'https://nginx.org/en/docs/beginners_guide.html' }],

    // ── Python ─────────────────────────────────────────────────────────────────
    'Python环境搭建':     [{ title: 'Python 官方教程 (中文)', type: 'PDF', url: 'https://docs.python.org/zh-cn/3/tutorial/index.html' }],
    '变量与数据类型':     [{ title: 'Python 数据类型文档', type: 'PDF', url: 'https://docs.python.org/zh-cn/3/library/stdtypes.html' }],
    '控制流程':           [{ title: 'Python 控制流语句', type: 'PDF', url: 'https://docs.python.org/zh-cn/3/tutorial/controlflow.html' }],
    '函数与模块':         [{ title: 'Python 函数定义指南', type: 'PDF', url: 'https://docs.python.org/zh-cn/3/tutorial/controlflow.html#defining-functions' }],
    '面向对象编程':       [{ title: 'Python OOP 教程', type: 'PDF', url: 'https://docs.python.org/zh-cn/3/tutorial/classes.html' }],
    '文件操作':           [{ title: 'Python 文件 I/O 文档', type: 'PDF', url: 'https://docs.python.org/zh-cn/3/tutorial/inputoutput.html#reading-and-writing-files' }],
    'Excel自动化(openpyxl)': [{ title: 'openpyxl 官方文档', type: 'PDF', url: 'https://openpyxl.readthedocs.io/en/stable/' }],
    '网络请求(requests)': [{ title: 'Requests 库官方文档', type: 'PDF', url: 'https://docs.python-requests.org/en/latest/user/quickstart/' }],
    'HTML解析(BeautifulSoup)': [{ title: 'BeautifulSoup 官方文档', type: 'PDF', url: 'https://www.crummy.com/software/BeautifulSoup/bs4/doc.zh/' }],
    '数据处理(pandas)':   [{ title: 'Pandas 10分钟入门', type: 'PDF', url: 'https://pandas.pydata.org/docs/user_guide/10min.html' }],
    '邮件自动化':         [{ title: 'Python smtplib 文档', type: 'PDF', url: 'https://docs.python.org/zh-cn/3/library/smtplib.html' }],
    '数据可视化':         [{ title: 'Matplotlib 官方教程', type: 'PDF', url: 'https://matplotlib.org/stable/tutorials/index.html' }],

    // ── 数据分析 ───────────────────────────────────────────────────────────────
    '数据分析思维':       [{ title: '数据分析方法论讲义', type: 'PDF', url: 'https://www.ibm.com/topics/data-analytics' }],
    'Excel高级函数':      [{ title: 'Excel 函数速查手册', type: 'PDF', url: 'https://support.microsoft.com/zh-cn/office/excel-函数-按字母顺序-b3944572-255d-4efb-bb96-c6d90033e188' }],
    'Excel数据透视表':    [{ title: 'Excel 数据透视表教程', type: 'PDF', url: 'https://support.microsoft.com/zh-cn/office/创建数据透视表以分析工作表数据-a9a84538-bfe9-40a9-a8e9-f99134456576' }],
    'SQL查询基础':        [{ title: 'SQL 快速参考手册', type: 'PDF', url: 'https://www.w3schools.com/sql/sql_quickref.asp' }],
    'Pandas数据处理':     [{ title: 'Pandas 官方 Cheat Sheet', type: 'PDF', url: 'https://pandas.pydata.org/Pandas_Cheat_Sheet.pdf' }],
    'NumPy科学计算':      [{ title: 'NumPy 官方入门指南', type: 'PDF', url: 'https://numpy.org/doc/stable/user/absolute_beginners.html' }],
    '数据清洗技巧':       [{ title: 'Pandas 数据清洗指南', type: 'PDF', url: 'https://pandas.pydata.org/docs/user_guide/missing_data.html' }],
    '统计分析方法':       [{ title: 'SciPy 统计模块文档', type: 'PDF', url: 'https://docs.scipy.org/doc/scipy/reference/stats.html' }],
    'Matplotlib基础':     [{ title: 'Matplotlib Cheat Sheet', type: 'PDF', url: 'https://matplotlib.org/cheatsheets/_images/cheatsheets-1.png' }],
    'Seaborn统计图表':    [{ title: 'Seaborn 官方教程', type: 'PDF', url: 'https://seaborn.pydata.org/tutorial.html' }],
    'ECharts交互图表':    [{ title: 'ECharts 官方配置文档', type: 'PDF', url: 'https://echarts.apache.org/zh/option.html' }],
    'Tableau入门':        [{ title: 'Tableau 入门手册', type: 'PDF', url: 'https://help.tableau.com/current/guides/get-started-tutorial/zh-cn/get-started-tutorial-home.htm' }],

    // ── AI ──────────────────────────────────────────────────────────────────────
    'AI发展史与应用场景': [{ title: 'AI 概论讲义 (Stanford)', type: 'PDF', url: 'https://stanford.edu/~shervine/teaching/cs-229/' }],
    '线性代数基础':       [{ title: '线性代数精要 (MIT OpenCourseWare)', type: 'PDF', url: 'https://math.mit.edu/~gs/linearalgebra/ila6/indexila6.html' }],
    '概率论与统计':       [{ title: '概率论基础讲义', type: 'PDF', url: 'https://seeing-theory.brown.edu/cn.html' }],
    '微积分基础':         [{ title: '微积分可视化 (3Blue1Brown)', type: 'PDF', url: 'https://www.3blue1brown.com/topics/calculus' }],
    '数据预处理':         [{ title: 'Scikit-learn 数据预处理文档', type: 'PDF', url: 'https://scikit-learn.org/stable/modules/preprocessing.html' }],
    '监督学习算法':       [{ title: 'Scikit-learn 监督学习指南', type: 'PDF', url: 'https://scikit-learn.org/stable/supervised_learning.html' }],
    '无监督学习':         [{ title: 'Scikit-learn 无监督学习指南', type: 'PDF', url: 'https://scikit-learn.org/stable/unsupervised_learning.html' }],
    '模型评估方法':       [{ title: '模型评估指标文档', type: 'PDF', url: 'https://scikit-learn.org/stable/modules/model_evaluation.html' }],
    '特征工程':           [{ title: '特征工程实战指南', type: 'PDF', url: 'https://scikit-learn.org/stable/modules/feature_selection.html' }],
    'Scikit-learn实战':   [{ title: 'Scikit-learn 官方教程', type: 'PDF', url: 'https://scikit-learn.org/stable/tutorial/index.html' }],
    '神经网络原理':       [
        { title: '3Blue1Brown 神经网络笔记', type: 'PDF', url: 'https://www.3blue1brown.com/topics/neural-networks' },
        { title: 'Deep Learning Book (Goodfellow)', type: 'PDF', url: 'https://www.deeplearningbook.org/' },
    ],
    'CNN卷积网络':        [{ title: 'CNN 架构详解 (CS231n)', type: 'PDF', url: 'https://cs231n.github.io/convolutional-networks/' }],
    'RNN循环网络':        [{ title: 'RNN 原理详解 (colah)', type: 'PDF', url: 'https://colah.github.io/posts/2015-08-Understanding-LSTMs/' }],
    'Transformer架构':    [{ title: 'Attention Is All You Need (原始论文)', type: 'PDF', url: 'https://arxiv.org/abs/1706.03762' }],
    'PyTorch实战':        [{ title: 'PyTorch 官方教程', type: 'PDF', url: 'https://pytorch.org/tutorials/' }],
    '迁移学习':           [{ title: '迁移学习入门 (PyTorch)', type: 'PDF', url: 'https://pytorch.org/tutorials/beginner/transfer_learning_tutorial.html' }],

    // ── 产品经理 ───────────────────────────────────────────────────────────────
    '产品经理职责解析':   [{ title: '产品经理能力模型 (讲义)', type: 'PDF', url: 'https://www.svpg.com/articles/' }],
    '用户需求挖掘':       [{ title: '用户访谈方法论', type: 'PDF', url: 'https://www.nngroup.com/articles/interviewing-users/' }],
    '竞品分析方法':       [{ title: '竞品分析框架模板', type: 'PDF', url: 'https://www.productplan.com/learn/how-to-do-a-competitive-analysis/' }],
    'PRD文档撰写':        [{ title: 'PRD 撰写模板与规范', type: 'PDF', url: 'https://www.atlassian.com/agile/product-management/requirements' }],
    '商业模式画布':       [{ title: 'Business Model Canvas 模板', type: 'PDF', url: 'https://www.strategyzer.com/library/the-business-model-canvas' }],
    '用户故事地图':       [{ title: 'User Story Mapping 指南', type: 'PDF', url: 'https://www.jpattonassociates.com/user-story-mapping/' }],
    '原型设计(Axure)':    [{ title: 'Axure RP 官方文档', type: 'PDF', url: 'https://docs.axure.com/' }],
    '产品路线规划':       [{ title: 'Product Roadmap 最佳实践', type: 'PDF', url: 'https://www.productplan.com/learn/what-is-a-product-roadmap/' }],
    '数据指标体系':       [{ title: 'AARRR 模型详解', type: 'PDF', url: 'https://www.productplan.com/glossary/aarrr-framework/' }],
    'A/B测试':            [{ title: 'A/B Testing 实践指南', type: 'PDF', url: 'https://www.optimizely.com/optimization-glossary/ab-testing/' }],
    '用户增长策略':       [{ title: '增长黑客方法论 (讲义)', type: 'PDF', url: 'https://www.reforge.com/blog/growth-loops' }],
};

async function main() {
    console.log('📄 开始注入 PDF/文档学习资源...\n');

    const creator = await prisma.sysUser.findFirst({ where: { role: 'ADMIN' } });
    if (!creator) { console.error('❌ 未找到 ADMIN 用户'); return; }

    const allLessons = await prisma.stdCourseLesson.findMany({
        include: {
            resources: { include: { resource: true } },
            chapter: { include: { standard: { include: { courses: { select: { name: true } } } } } }
        }
    });

    let added = 0;

    for (const lesson of allLessons) {
        // 检查是否已有 PDF 资源
        const hasPdf = lesson.resources.some(r => r.resource.type === 'PDF');
        if (hasPdf) continue;

        const pdfDefs = PDF_BY_TITLE[lesson.title];
        if (!pdfDefs || pdfDefs.length === 0) continue;

        const standardId = lesson.chapter?.standard?.id;
        const existingCount = lesson.resources.length;

        for (let i = 0; i < pdfDefs.length; i++) {
            const def = pdfDefs[i];
            const resource = await prisma.stdResource.create({
                data: {
                    title: def.title,
                    type: def.type,
                    url: def.url,
                    status: 'PUBLISHED',
                    standard_id: standardId || null,
                    creator_id: creator.id,
                    sort_order: existingCount + i + 1,
                }
            });
            await prisma.stdLessonResource.create({
                data: { lesson_id: lesson.id, resource_id: resource.id, sort_order: existingCount + i + 1 }
            });
        }

        const courseName = lesson.chapter?.standard?.courses?.[0]?.name || '';
        console.log(`  📄 [${courseName}] ${lesson.title} → +${pdfDefs.length} 文档`);
        added++;
    }

    console.log(`\n🎉 完成！为 ${added} 个课时新增了 PDF/文档资源`);
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
