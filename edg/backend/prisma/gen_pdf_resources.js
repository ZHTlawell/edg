/**
 * gen_pdf_resources.js — 批量生成中文教学讲义 PDF 并写入数据库
 * 运行: node prisma/gen_pdf_resources.js
 */

const { PrismaClient } = require('@prisma/client');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const FONT = '/tmp/NotoSansSC-Regular.otf';
const FONT_BOLD = '/tmp/NotoSansSC-Bold.otf';
const OUT_DIR = path.join(__dirname, '..', 'uploads', 'resources');

// ── 每课时的讲义内容 ─────────────────────────────────────────────────────────
// { 课时标题: { objectives: [...], keyPoints: [...], summary: string, exercises: [...] } }
const CONTENT = {
    // ══════ 高级UI/UX设计实战 ══════
    '设计思维导论': {
        objectives: ['理解设计思维的五个阶段', '掌握共情（Empathize）的核心方法', '学会运用设计思维解决实际问题'],
        keyPoints: [
            '设计思维（Design Thinking）是一种以人为本的创新方法论，由斯坦福大学 d.school 提出。',
            '五个阶段：共情 → 定义 → 构思 → 原型 → 测试。这是一个非线性的迭代过程。',
            '共情阶段：通过用户访谈、观察、同理心地图等方式深入理解用户需求和痛点。',
            '定义阶段：将调研数据转化为清晰的问题陈述（Point of View Statement）。',
            '构思阶段：运用头脑风暴、SCAMPER 等方法产出大量创意方案。',
            '原型阶段：快速制作低保真原型，将想法具象化，便于验证和沟通。',
            '测试阶段：邀请真实用户进行测试，收集反馈，持续迭代优化。',
        ],
        summary: '设计思维不是一种工具，而是一种面对复杂问题的思维方式。它强调同理心、快速迭代和跨学科协作。',
        exercises: ['选择一个校园生活痛点，完成一次完整的共情访谈', '绘制一张同理心地图（Empathy Map）'],
    },
    '用户研究方法': {
        objectives: ['掌握定性与定量研究的区别', '学会选择合适的用户研究方法', '能独立完成一次用户访谈'],
        keyPoints: [
            '用户研究分为定性研究（WHY）和定量研究（WHAT/HOW MANY）两大类。',
            '常用定性方法：深度访谈、焦点小组、情境调查、日记研究、卡片分类。',
            '常用定量方法：问卷调查、A/B 测试、可用性测试（含量化指标）、数据分析。',
            '用户访谈技巧：开放式提问、5 个为什么、避免引导性问题、保持中立。',
            '样本量建议：定性研究 5-8 人可发现 80% 的问题；定量研究需要统计显著性。',
            '研究输出物：用户画像（Persona）、用户旅程图、机会区域（Opportunity Areas）。',
        ],
        summary: '好的设计源于对用户的深入理解。选择合适的研究方法，关键在于明确你想回答什么问题。',
        exercises: ['设计一份包含 10 个问题的用户访谈提纲', '选择 3 名同学进行访谈并整理成用户画像'],
    },
    '信息架构设计': {
        objectives: ['理解信息架构的四大要素', '掌握卡片分类与树形测试方法', '能为中型产品设计合理的信息架构'],
        keyPoints: [
            '信息架构（IA）的核心目标：让用户能找到所需信息，让内容有组织有逻辑。',
            '四大要素：组织系统、标签系统、导航系统、搜索系统。',
            '组织模式：按字母、时间、地理、任务、用户类型、主题等维度组织内容。',
            '卡片分类法（Card Sorting）：开放式（用户自己分组命名）vs 封闭式（预设分组）。',
            '树形测试（Tree Testing）：验证信息架构的可寻性，不依赖视觉设计。',
            '导航模式：全局导航、局部导航、面包屑、标签页、汉堡菜单等。',
            '站点地图（Sitemap）是信息架构的核心输出物，应清晰展示层级关系。',
        ],
        summary: '信息架构是用户体验的骨架。好的 IA 让用户无需思考就能找到目标内容。',
        exercises: ['为某个 App 执行一次卡片分类实验', '绘制一份完整的站点地图'],
    },
    '用户旅程地图': {
        objectives: ['理解用户旅程地图的组成要素', '学会绘制端到端的用户旅程', '识别关键的机会点与痛点'],
        keyPoints: [
            '用户旅程地图（Journey Map）是用户与产品交互全过程的可视化呈现。',
            '核心要素：阶段、用户行为、触点、情绪曲线、痛点、机会点。',
            '绘制步骤：确定角色 → 定义范围 → 收集数据 → 绘制旅程 → 标注洞察。',
            '情绪曲线：用折线图表示用户在每个阶段的情感波动（正面/中性/负面）。',
            '机会点：情绪低谷处即为最大的改善机会，要重点关注。',
        ],
        summary: '旅程地图帮助团队从用户视角审视完整体验，跳出"只见树木不见森林"的局限。',
        exercises: ['选择一个常用 App，绘制从注册到首次完成核心任务的用户旅程地图'],
    },
    '色彩与排版': {
        objectives: ['掌握色彩理论与配色原则', '理解排版的基本规则', '能建立一套完整的设计色板'],
        keyPoints: [
            '色彩三要素：色相（Hue）、饱和度（Saturation）、明度（Value/Brightness）。',
            '常用配色方案：单色、互补色、三色、类比色、分裂互补色。',
            '60-30-10 配色法则：主色 60%、辅色 30%、强调色 10%。',
            '无障碍要求：文本与背景对比度至少 4.5:1（WCAG AA 标准）。',
            '排版四原则：对齐（Alignment）、对比（Contrast）、重复（Repetition）、亲密性（Proximity）。',
            '字体选择：正文用衬线/无衬线体，标题可用展示字体；中文推荐思源黑体/苹方。',
            '行高建议：正文 1.5-1.75 倍，标题 1.2-1.3 倍。段落间距大于行间距。',
        ],
        summary: '色彩传达情感，排版建立秩序。两者共同构成视觉设计的基础语言。',
        exercises: ['用 Coolors 或 Adobe Color 创建一套包含 5 色的品牌色板', '重新排版一篇杂乱的文章页面'],
    },
    '组件系统设计': {
        objectives: ['理解设计系统的概念与价值', '掌握原子设计方法论', '能搭建一套基础组件库'],
        keyPoints: [
            '设计系统 = 设计原则 + 组件库 + 模式库 + 文档。它是产品一致性的保障。',
            '原子设计五层级：原子 → 分子 → 有机体 → 模板 → 页面。',
            '原子层：颜色、字体、图标、间距等最基础的设计令牌（Design Tokens）。',
            '分子层：按钮、输入框、标签等单一功能组件。',
            '有机体层：导航栏、卡片、表单等由多个分子组成的模块。',
            '组件变体（Variants）：通过属性控制组件的不同状态和样式。',
            '知名设计系统参考：Material Design (Google)、Ant Design (蚂蚁)、Arco Design (字节)。',
        ],
        summary: '设计系统是提效和保证一致性的核心武器，值得长期投入维护。',
        exercises: ['在 Figma 中搭建一套包含 Button/Input/Card 三个组件的迷你设计系统'],
    },
    'Figma进阶技巧': {
        objectives: ['掌握 Auto Layout 自动布局', '学会使用变量与设计令牌', '能高效组织和管理设计文件'],
        keyPoints: [
            'Auto Layout：自动根据内容调整尺寸和间距，是响应式设计的关键。',
            '嵌套 Auto Layout：外层垂直、内层水平，可灵活构建复杂页面结构。',
            '组件属性（Component Properties）：Boolean（显隐）、Instance Swap（实例替换）、Text（文本覆写）。',
            '变量（Variables）：Color/Number/String/Boolean 四种类型，支持多模式（浅色/深色主题）。',
            '文件组织：按页面分功能模块，封面页 + 组件页 + 设计页 + 交付页。',
            '命名规范：图层用 / 分隔（如 Button/Primary/Large），方便搜索和 Dev Mode 交付。',
            '常用快捷键：Ctrl+D 复制、Shift+A 添加 Auto Layout、Alt+拖拽 测量间距。',
        ],
        summary: 'Figma 的核心竞争力在于协作和组件化设计。善用 Auto Layout 和变量系统能极大提升效率。',
        exercises: ['将一个静态卡片组件改造为支持 Auto Layout 的自适应组件'],
    },
    '响应式设计': {
        objectives: ['理解响应式设计的核心原则', '掌握常用断点与布局策略', '能设计多端适配的界面'],
        keyPoints: [
            '响应式设计（Responsive Design）：一套设计适配多种屏幕尺寸。',
            '核心策略：流式布局、弹性图片、媒体查询（Media Query）。',
            '常用断点：320px（手机）、768px（平板）、1024px（小桌面）、1440px（大桌面）。',
            '移动优先（Mobile First）：先设计小屏，再逐步增强大屏布局。',
            '布局模式：单列→双列→三栏的渐进增强；侧边栏在小屏折叠为底部导航。',
            '触摸适配：最小点击区域 44×44px（Apple HIG）或 48×48dp（Material）。',
        ],
        summary: '移动优先不只是一种技术策略，更是一种优先级思维——先服务于最受限的场景。',
        exercises: ['为一个电商详情页设计手机端和桌面端两套布局，标注关键断点'],
    },

    // ══════ React+Node 精选 ══════
    '组件与Props': {
        objectives: ['理解 React 组件化思想', '掌握 Props 传递与类型校验', '能拆分复杂 UI 为组件树'],
        keyPoints: [
            'React 组件是 UI 的独立、可复用单元。分为函数组件（推荐）和类组件。',
            '函数组件：接收 props 对象，返回 JSX。例：function Button({ label }) { return <button>{label}</button> }',
            'Props 是父组件向子组件传递数据的方式，单向数据流（自上而下）。',
            'Props 只读：子组件不应修改 props，这保证了数据流的可预测性。',
            'children prop：特殊的 props，代表组件标签内嵌套的内容。',
            '组件拆分原则：单一职责、高内聚低耦合、可复用性。',
            '实际建议：一个组件超过 200 行就考虑拆分；嵌套超过 3 层考虑组合模式。',
        ],
        summary: 'React 的核心哲学是"一切皆组件"。好的组件设计是构建可维护应用的基础。',
        exercises: ['将一个包含头像、昵称、简介的用户卡片拆分为 Avatar、UserInfo、UserCard 三个组件'],
    },
    'Hooks深度讲解': {
        objectives: ['掌握 useState/useEffect/useRef 等核心 Hook', '理解闭包陷阱与依赖数组', '学会自定义 Hook'],
        keyPoints: [
            'useState：状态管理。const [count, setCount] = useState(0);',
            'useEffect：副作用处理（数据请求、订阅、DOM 操作）。依赖数组控制执行时机。',
            '空依赖 [] = 仅首次渲染执行；无依赖 = 每次渲染执行；[dep] = dep 变化时执行。',
            'useRef：持久化引用，修改 .current 不触发重渲染。常用于 DOM 引用和定时器。',
            'useMemo / useCallback：性能优化，避免不必要的重计算和函数重建。',
            '闭包陷阱：useEffect 内引用的 state 是闭包快照，需正确设置依赖数组。',
            '自定义 Hook：以 use 开头，封装可复用的状态逻辑。如 useLocalStorage、useFetch。',
        ],
        summary: 'Hooks 让函数组件拥有了类组件的全部能力，且代码更简洁、逻辑更内聚。',
        exercises: ['实现一个 useDebounce 自定义 Hook', '将一个类组件改写为使用 Hooks 的函数组件'],
    },
    'Express框架': {
        objectives: ['理解 Express 中间件机制', '掌握路由定义与参数解析', '能搭建一个 RESTful API 服务'],
        keyPoints: [
            'Express 是 Node.js 最流行的 Web 框架，轻量且扩展性强。',
            '核心概念：Application → Router → Middleware → Handler。',
            '中间件（Middleware）：按顺序执行的函数链，通过 next() 传递控制权。',
            '路由定义：app.get/post/put/delete(path, handler)。',
            '路由参数：/users/:id → req.params.id；查询参数 → req.query。',
            '常用中间件：express.json()、cors()、morgan()、helmet()。',
            '错误处理中间件：4 个参数 (err, req, res, next)，统一捕获异常。',
        ],
        summary: 'Express 的精髓在于中间件管道。理解请求的生命周期，就掌握了 Express 的核心。',
        exercises: ['搭建一个包含 CRUD 接口的 /api/todos 服务', '实现一个请求日志中间件'],
    },

    // ══════ Python 精选 ══════
    'Python环境搭建': {
        objectives: ['完成 Python 环境安装与配置', '掌握 pip 包管理和虚拟环境', '能在 VS Code 中编写和运行 Python'],
        keyPoints: [
            '推荐安装 Python 3.10+，官网 python.org 下载或使用 pyenv 管理版本。',
            'pip 是 Python 包管理器。pip install 包名 安装，pip list 查看已安装包。',
            '虚拟环境：python -m venv myenv → source myenv/bin/activate 隔离项目依赖。',
            'VS Code 推荐插件：Python (Microsoft)、Pylance（类型提示）、Jupyter。',
            '交互式环境：python 命令进入 REPL；推荐 IPython 或 Jupyter Notebook。',
            'requirements.txt：pip freeze > requirements.txt 导出依赖清单。',
        ],
        summary: '好的开发环境是高效学习的第一步。养成使用虚拟环境的好习惯，避免依赖冲突。',
        exercises: ['在本地创建一个虚拟环境并安装 requests 和 pandas 两个库'],
    },
    '面向对象编程': {
        objectives: ['理解类与对象的概念', '掌握继承、封装、多态三大特性', '能用 OOP 设计简单系统'],
        keyPoints: [
            '类（Class）：对象的蓝图/模板。定义属性和方法。',
            '__init__ 方法：构造函数，创建对象时自动调用。self 代表实例本身。',
            '继承：class Dog(Animal): 子类继承父类的属性和方法，可重写（Override）。',
            '封装：使用 _ 前缀表示受保护，__ 双下划线表示私有（名称改编）。',
            '多态：不同类的对象可以响应相同的方法调用，实现"一个接口多种实现"。',
            '@property 装饰器：将方法伪装为属性，实现 getter/setter。',
            '魔术方法：__str__（打印）、__len__（长度）、__eq__（相等判断）等。',
        ],
        summary: 'OOP 的核心价值是代码组织和复用。不要为了 OOP 而 OOP，简单场景用函数即可。',
        exercises: ['设计一个图书管理系统，包含 Book、Library、Member 三个类'],
    },

    // ══════ AI 精选 ══════
    '神经网络原理': {
        objectives: ['理解神经元与神经网络的数学模型', '掌握前向传播与反向传播原理', '了解激活函数的作用与选择'],
        keyPoints: [
            '人工神经元：接收输入 x，加权求和 Σ(w·x) + b，经激活函数输出。',
            '多层感知器（MLP）：输入层 → 隐藏层（可多层） → 输出层。',
            '前向传播（Forward Pass）：数据从输入层逐层计算到输出层。',
            '损失函数（Loss）：衡量预测值与真实值的差距。回归用 MSE，分类用交叉熵。',
            '反向传播（Backpropagation）：利用链式法则计算每个权重的梯度。',
            '梯度下降：沿梯度反方向更新权重 w = w - lr × ∂L/∂w。学习率 lr 是关键超参数。',
            '常用激活函数：ReLU（隐藏层首选）、Sigmoid（二分类输出）、Softmax（多分类输出）。',
            '过拟合防治：Dropout、L2 正则化、早停（Early Stopping）、数据增强。',
        ],
        summary: '神经网络的本质是一个可学习的函数逼近器。反向传播 + 梯度下降是训练的核心算法。',
        exercises: ['手动计算一个 2 输入 1 输出的单层网络的前向传播', '用 NumPy 实现一个简单的 2 层神经网络'],
    },
    'Transformer架构': {
        objectives: ['理解注意力机制的核心思想', '掌握 Self-Attention 计算过程', '了解 Transformer 在 NLP/CV 中的应用'],
        keyPoints: [
            'Attention 核心公式：Attention(Q, K, V) = softmax(QK^T / √d_k) · V',
            'Q（Query）、K（Key）、V（Value）：从输入通过不同的线性变换得到。',
            '自注意力（Self-Attention）：序列中每个位置都能"关注"到其他所有位置。',
            '多头注意力（Multi-Head）：并行运行多组 Attention，捕捉不同维度的关系。',
            'Transformer 架构：Encoder + Decoder，每层包含自注意力 + 前馈网络 + 残差连接。',
            '位置编码（Positional Encoding）：为序列注入位置信息，弥补注意力机制无序的缺陷。',
            '里程碑模型：BERT（Encoder-only）、GPT（Decoder-only）、T5（Encoder-Decoder）。',
            '应用范围：NLP（翻译、问答、生成）、CV（ViT）、多模态（CLIP）等。',
        ],
        summary: 'Transformer 是当代 AI 的基石架构。"Attention Is All You Need"这篇论文改变了整个领域。',
        exercises: ['手动计算一个 3 词序列的 Self-Attention 权重矩阵', '阅读原论文第 3.2 节并写出理解笔记'],
    },

    // ══════ 数据分析 精选 ══════
    'Pandas数据处理': {
        objectives: ['掌握 DataFrame 的创建与基本操作', '学会数据筛选、分组和聚合', '能完成常见的数据清洗任务'],
        keyPoints: [
            'DataFrame：二维表格数据结构，类似 Excel 工作表。每列是一个 Series。',
            '读取数据：pd.read_csv()、pd.read_excel()、pd.read_sql()。',
            '数据查看：df.head()、df.info()、df.describe()、df.shape。',
            '数据筛选：df[df["age"] > 18]、df.loc[行标签, 列标签]、df.iloc[行索引, 列索引]。',
            '缺失值处理：df.isnull().sum() 统计、df.fillna() 填充、df.dropna() 删除。',
            '分组聚合：df.groupby("city")["sales"].sum() → 按城市统计总销售额。',
            '数据合并：pd.merge()（SQL 风格 JOIN）、pd.concat()（上下/左右拼接）。',
            '数据透视：df.pivot_table(values, index, columns, aggfunc) 生成交叉表。',
        ],
        summary: 'Pandas 是 Python 数据分析的瑞士军刀。掌握 DataFrame 操作是所有数据工作的基础。',
        exercises: ['读取一个 CSV 文件，完成缺失值处理、分组统计并导出结果'],
    },
    'SQL查询基础': {
        objectives: ['掌握 SQL 基本查询语法', '学会多表 JOIN 和子查询', '能编写中等复杂度的数据查询'],
        keyPoints: [
            '基本查询：SELECT 列 FROM 表 WHERE 条件 ORDER BY 排序 LIMIT 数量。',
            '聚合函数：COUNT()、SUM()、AVG()、MAX()、MIN()，配合 GROUP BY 使用。',
            'HAVING：对分组后的结果进行筛选（WHERE 是分组前筛选）。',
            'JOIN 类型：INNER JOIN（交集）、LEFT JOIN（左全）、RIGHT JOIN、FULL OUTER JOIN。',
            '子查询：SELECT * FROM orders WHERE user_id IN (SELECT id FROM users WHERE city="上海")。',
            'CASE WHEN：条件表达式，实现 SQL 中的 if-else 逻辑。',
            '窗口函数：ROW_NUMBER()、RANK()、LAG()、LEAD() OVER (PARTITION BY ... ORDER BY ...)。',
        ],
        summary: 'SQL 是数据分析师的必备技能。无论用什么工具，最终的数据提取都离不开 SQL。',
        exercises: ['编写查询：统计每个城市的订单数和平均金额，按订单数降序排列'],
    },

    // ══════ 产品经理 精选 ══════
    '产品经理职责解析': {
        objectives: ['理解产品经理的核心职责', '了解不同类型 PM 的能力模型', '明确产品经理的日常工作流程'],
        keyPoints: [
            '产品经理 = 用户需求的代言人 + 团队协作的枢纽 + 产品价值的守护者。',
            '核心职能：需求分析、产品设计、项目推进、数据驱动、用户增长。',
            '工作流程：需求收集 → 需求评审 → PRD 撰写 → 设计评审 → 开发跟进 → 上线验证 → 数据复盘。',
            '三大能力维度：用户感知力（同理心）、商业判断力（ROI 思维）、执行推进力（跨团队沟通）。',
            'PM 类型：B 端 PM（流程/效率）、C 端 PM（体验/增长）、数据 PM、AI PM、策略 PM。',
            '常用工具：Axure/Figma（原型）、Jira/飞书（项目管理）、神策/GrowingIO（数据分析）。',
        ],
        summary: '产品经理不需要什么都会，但需要什么都懂一点。核心竞争力是"正确地做正确的事"。',
        exercises: ['记录某个常用 App 一周内的版本更新，分析其产品策略'],
    },
    'A/B测试': {
        objectives: ['理解 A/B 测试的基本原理', '掌握假设检验与显著性判断', '能设计一个完整的 A/B 实验'],
        keyPoints: [
            'A/B 测试：将用户随机分为对照组（A）和实验组（B），比较两组的指标差异。',
            '核心流程：提出假设 → 确定指标 → 计算样本量 → 随机分流 → 收集数据 → 统计分析。',
            '原假设 H0：A 和 B 没有差异。备择假设 H1：B 优于 A。',
            'p 值：在 H0 成立时，观测到当前差异的概率。p < 0.05 通常认为显著。',
            '统计功效（Power）：正确拒绝 H0 的概率，通常要求 ≥ 80%。',
            '样本量计算：与基线转化率、最小可检测效应（MDE）、显著性水平相关。',
            '常见陷阱：过早下结论（Peeking）、多重比较问题、辛普森悖论、样本偏差。',
        ],
        summary: 'A/B 测试是数据驱动决策的黄金标准。但要注意：统计显著 ≠ 业务显著。',
        exercises: ['设计一个按钮颜色的 A/B 测试方案，包含假设、指标和样本量计算'],
    },
};

// ── PDF 生成函数 ──────────────────────────────────────────────────────────────
function generatePDF(filePath, courseName, chapterName, lessonTitle, data) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 60 });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        const regular = FONT;
        const bold = FONT_BOLD;

        // ── 标题区域 ───────────────────────────────────────
        doc.rect(0, 0, 595, 140).fill('#1e293b');
        doc.font(bold).fontSize(10).fillColor('#94a3b8')
            .text(courseName + '  ›  ' + chapterName, 60, 35, { width: 475 });
        doc.font(bold).fontSize(22).fillColor('#ffffff')
            .text(lessonTitle, 60, 60, { width: 475 });
        doc.font(regular).fontSize(9).fillColor('#64748b')
            .text('教学讲义  |  仅供学习使用', 60, 110);

        let y = 165;
        const pageBottom = 760;

        function checkPage(need) {
            if (y + need > pageBottom) { doc.addPage(); y = 60; }
        }

        // ── 学习目标 ───────────────────────────────────────
        doc.font(bold).fontSize(14).fillColor('#1e293b').text('学习目标', 60, y);
        y += 25;
        for (const obj of data.objectives) {
            checkPage(20);
            doc.font(regular).fontSize(10).fillColor('#334155')
                .text('✦  ' + obj, 72, y, { width: 450 });
            y += doc.heightOfString('✦  ' + obj, { width: 450 }) + 6;
        }

        y += 15;
        checkPage(30);
        doc.moveTo(60, y).lineTo(535, y).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
        y += 20;

        // ── 核心知识点 ─────────────────────────────────────
        checkPage(30);
        doc.font(bold).fontSize(14).fillColor('#1e293b').text('核心知识点', 60, y);
        y += 25;
        for (let i = 0; i < data.keyPoints.length; i++) {
            const kp = data.keyPoints[i];
            const label = (i + 1) + '. ';
            checkPage(50);
            doc.font(bold).fontSize(10).fillColor('#3b82f6').text(label, 60, y, { continued: true });
            doc.font(regular).fontSize(10).fillColor('#334155').text(kp, { width: 440 });
            y += doc.heightOfString(label + kp, { width: 450 }) + 10;
        }

        y += 10;
        checkPage(30);
        doc.moveTo(60, y).lineTo(535, y).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
        y += 20;

        // ── 本节小结 ───────────────────────────────────────
        checkPage(60);
        doc.font(bold).fontSize(14).fillColor('#1e293b').text('本节小结', 60, y);
        y += 25;
        doc.roundedRect(60, y, 475, 50, 6).fillAndStroke('#f1f5f9', '#e2e8f0');
        doc.font(regular).fontSize(10).fillColor('#475569').text(data.summary, 72, y + 10, { width: 450 });
        y += 65;

        // ── 课后练习 ───────────────────────────────────────
        if (data.exercises && data.exercises.length > 0) {
            y += 10;
            checkPage(40);
            doc.font(bold).fontSize(14).fillColor('#1e293b').text('课后练习', 60, y);
            y += 25;
            for (let i = 0; i < data.exercises.length; i++) {
                checkPage(25);
                doc.font(regular).fontSize(10).fillColor('#334155')
                    .text('练习 ' + (i + 1) + '：' + data.exercises[i], 72, y, { width: 450 });
                y += doc.heightOfString('练习 ' + (i + 1) + '：' + data.exercises[i], { width: 450 }) + 8;
            }
        }

        doc.end();
        stream.on('finish', resolve);
        stream.on('error', reject);
    });
}

// ── 主流程 ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log('📄 开始生成教学讲义 PDF...\n');

    if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

    const creator = await prisma.sysUser.findFirst({ where: { role: 'ADMIN' } });
    if (!creator) { console.error('❌ 未找到 ADMIN 用户'); return; }

    // 获取所有课时 + 它们的现有资源
    const allLessons = await prisma.stdCourseLesson.findMany({
        include: {
            resources: { include: { resource: true } },
            chapter: { include: { standard: { include: { courses: { select: { name: true } } } } } },
        },
    });

    // 先删除之前外链 PDF 资源（URL 以 http 开头的 PDF 类型）
    const oldPdfResources = await prisma.stdResource.findMany({
        where: { type: 'PDF', url: { startsWith: 'http' } },
    });
    if (oldPdfResources.length > 0) {
        console.log(`  🗑️  清理 ${oldPdfResources.length} 个无法嵌入的外链 PDF 资源...`);
        for (const r of oldPdfResources) {
            await prisma.stdLessonResource.deleteMany({ where: { resource_id: r.id } });
            await prisma.stdResource.delete({ where: { id: r.id } });
        }
    }

    let generated = 0;

    for (const lesson of allLessons) {
        const data = CONTENT[lesson.title];
        if (!data) continue;

        const courseName = lesson.chapter?.standard?.courses?.[0]?.name || '课程';
        const chapterName = lesson.chapter?.title || '章节';
        const standardId = lesson.chapter?.standard?.id;

        // 生成 PDF 文件
        const filename = `lecture_${lesson.id.slice(0, 8)}.pdf`;
        const filePath = path.join(OUT_DIR, filename);
        await generatePDF(filePath, courseName, chapterName, lesson.title, data);

        // 写入数据库
        const existingCount = lesson.resources.length;
        const resource = await prisma.stdResource.create({
            data: {
                title: `${lesson.title} 教学讲义`,
                type: 'PDF',
                url: `/uploads/resources/${filename}`,
                file_name: filename,
                file_size: fs.statSync(filePath).size,
                status: 'PUBLISHED',
                standard_id: standardId || null,
                creator_id: creator.id,
                sort_order: existingCount + 1,
            },
        });
        await prisma.stdLessonResource.create({
            data: { lesson_id: lesson.id, resource_id: resource.id, sort_order: existingCount + 1 },
        });

        const sizeKB = (fs.statSync(filePath).size / 1024).toFixed(0);
        console.log(`  ✅ [${courseName}] ${lesson.title} → ${filename} (${sizeKB}KB)`);
        generated++;
    }

    console.log(`\n🎉 完成！共生成 ${generated} 份教学讲义 PDF`);
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
