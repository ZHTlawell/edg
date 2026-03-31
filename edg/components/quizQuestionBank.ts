/**
 * quizQuestionBank.ts — 章节测验题库
 * key = 数据库中的实际章节标题（来自 seed_catalog.ts）
 * 每章 5 道题（单选 + 多选混合），与章节内容对应
 */

export interface QuizQuestion {
  id: number;
  type: 'single' | 'multiple';
  text: string;
  options: { id: string; label: string; text: string }[];
  answer: string[];
}

export const QUESTION_BANK: Record<string, QuizQuestion[]> = {

  // ═══════════════════════════════════════════════════════════════════════════
  // 高级UI/UX设计实战
  // ═══════════════════════════════════════════════════════════════════════════

  '设计基础与思维': [
    { id: 1, type: 'single', text: '设计思维(Design Thinking)的第一个阶段是什么？', options: [
      { id: 'A', label: 'A', text: '定义问题' }, { id: 'B', label: 'B', text: '共情(Empathize)' },
      { id: 'C', label: 'C', text: '原型制作' }, { id: 'D', label: 'D', text: '测试验证' },
    ], answer: ['B'] },
    { id: 2, type: 'multiple', text: '以下哪些属于用户研究的常用方法？(多选)', options: [
      { id: 'A', label: 'A', text: '用户访谈' }, { id: 'B', label: 'B', text: '卡片分类法' },
      { id: 'C', label: 'C', text: '代码审查' }, { id: 'D', label: 'D', text: '问卷调查' },
    ], answer: ['A', 'B', 'D'] },
    { id: 3, type: 'single', text: '信息架构(Information Architecture)的主要目的是？', options: [
      { id: 'A', label: 'A', text: '让页面视觉更好看' }, { id: 'B', label: 'B', text: '组织和分类信息，让用户高效找到所需内容' },
      { id: 'C', label: 'C', text: '增加页面动效' }, { id: 'D', label: 'D', text: '提高服务器性能' },
    ], answer: ['B'] },
    { id: 4, type: 'single', text: '用户旅程地图(User Journey Map)中，纵轴通常表示什么？', options: [
      { id: 'A', label: 'A', text: '用户数量' }, { id: 'B', label: 'B', text: '用户的情绪/满意度变化' },
      { id: 'C', label: 'C', text: '项目进度' }, { id: 'D', label: 'D', text: '代码行数' },
    ], answer: ['B'] },
    { id: 5, type: 'multiple', text: '关于设计思维的"定义"阶段，以下说法正确的是？(多选)', options: [
      { id: 'A', label: 'A', text: '将共情阶段的发现总结为具体问题陈述' }, { id: 'B', label: 'B', text: '使用 HMW(How Might We) 句式框定问题' },
      { id: 'C', label: 'C', text: '直接开始编写代码' }, { id: 'D', label: 'D', text: '明确用户痛点和核心需求' },
    ], answer: ['A', 'B', 'D'] },
  ],

  'UI设计核心技能': [
    { id: 1, type: 'single', text: '在色彩理论中，互补色是指色环上相隔多少度的颜色？', options: [
      { id: 'A', label: 'A', text: '90度' }, { id: 'B', label: 'B', text: '120度' },
      { id: 'C', label: 'C', text: '180度' }, { id: 'D', label: 'D', text: '60度' },
    ], answer: ['C'] },
    { id: 2, type: 'multiple', text: '关于Figma组件变量(Variants)的描述，以下哪些是正确的？(多选)', options: [
      { id: 'A', label: 'A', text: '可以将不同状态的组件组织在一起' }, { id: 'B', label: 'B', text: '可以减少组件库中冗余的命名' },
      { id: 'C', label: 'C', text: '支持Boolean类型开关控制' }, { id: 'D', label: 'D', text: '只能在一个文件内生效' },
    ], answer: ['A', 'B', 'C'] },
    { id: 3, type: 'single', text: '字体排版中，正文行高(Line Height)一般建议设置为字号的多少倍？', options: [
      { id: 'A', label: 'A', text: '1.0-1.2倍' }, { id: 'B', label: 'B', text: '1.4-1.8倍' },
      { id: 'C', label: 'C', text: '2.0-2.5倍' }, { id: 'D', label: 'D', text: '0.8-1.0倍' },
    ], answer: ['B'] },
    { id: 4, type: 'single', text: '设计系统(Design System)中全局颜色变更时，最有效的处理方式是？', options: [
      { id: 'A', label: 'A', text: '手动逐个页面修改' }, { id: 'B', label: 'B', text: '通过更新全局颜色样式库一键应用' },
      { id: 'C', label: 'C', text: '重新创建所有组件' }, { id: 'D', label: 'D', text: '让开发直接在代码层级覆盖' },
    ], answer: ['B'] },
    { id: 5, type: 'multiple', text: '响应式设计(Responsive Design)需要考虑哪些因素？(多选)', options: [
      { id: 'A', label: 'A', text: '不同屏幕尺寸的布局适配' }, { id: 'B', label: 'B', text: '触摸与鼠标交互差异' },
      { id: 'C', label: 'C', text: '图片资源的多分辨率适配' }, { id: 'D', label: 'D', text: '只需考虑手机端即可' },
    ], answer: ['A', 'B', 'C'] },
  ],

  '交互设计进阶': [
    { id: 1, type: 'single', text: '在Figma中制作高保真交互原型时，"Smart Animate"的作用是？', options: [
      { id: 'A', label: 'A', text: '自动生成代码' }, { id: 'B', label: 'B', text: '在两个画面之间自动补间过渡动画' },
      { id: 'C', label: 'C', text: '智能修复设计稿错误' }, { id: 'D', label: 'D', text: '自动调整图层命名' },
    ], answer: ['B'] },
    { id: 2, type: 'multiple', text: '以下哪些是常见的微交互(Micro-Interaction)应用场景？(多选)', options: [
      { id: 'A', label: 'A', text: '点赞按钮动画' }, { id: 'B', label: 'B', text: '表单验证实时反馈' },
      { id: 'C', label: 'C', text: '下拉刷新动效' }, { id: 'D', label: 'D', text: '数据库表设计' },
    ], answer: ['A', 'B', 'C'] },
    { id: 3, type: 'single', text: '可用性测试(Usability Test)中，通常建议测试多少个用户即可发现大部分问题？', options: [
      { id: 'A', label: 'A', text: '1-2个' }, { id: 'B', label: 'B', text: '5个左右' },
      { id: 'C', label: 'C', text: '20个以上' }, { id: 'D', label: 'D', text: '50个以上' },
    ], answer: ['B'] },
    { id: 4, type: 'single', text: '动效设计中，缓动函数(Easing)的作用是什么？', options: [
      { id: 'A', label: 'A', text: '让动画匀速运动' }, { id: 'B', label: 'B', text: '控制动画的加速和减速曲线，使其更自然' },
      { id: 'C', label: 'C', text: '减少动画渲染消耗' }, { id: 'D', label: 'D', text: '延迟动画开始时间' },
    ], answer: ['B'] },
    { id: 5, type: 'single', text: '设计评审(Design Review)的主要目的是？', options: [
      { id: 'A', label: 'A', text: '批评设计师' }, { id: 'B', label: 'B', text: '多方视角审查设计方案，发现问题并达成共识' },
      { id: 'C', label: 'C', text: '审查代码质量' }, { id: 'D', label: 'D', text: '确定薪资待遇' },
    ], answer: ['B'] },
  ],

  '实战项目': [
    { id: 1, type: 'single', text: '在电商App设计中，商品详情页的"加入购物车"按钮通常应使用什么颜色？', options: [
      { id: 'A', label: 'A', text: '灰色，保持低调' }, { id: 'B', label: 'B', text: '高对比度暖色(如橙/红)，吸引行动' },
      { id: 'C', label: 'C', text: '蓝色，表示链接' }, { id: 'D', label: 'D', text: '白色，融入背景' },
    ], answer: ['B'] },
    { id: 2, type: 'multiple', text: '设计交付(Design Handoff)时需要提供哪些规格标注？(多选)', options: [
      { id: 'A', label: 'A', text: '间距和尺寸标注' }, { id: 'B', label: 'B', text: '颜色色值(HEX/RGB)' },
      { id: 'C', label: 'C', text: '字体字号行高信息' }, { id: 'D', label: 'D', text: '数据库ER图' },
    ], answer: ['A', 'B', 'C'] },
    { id: 3, type: 'single', text: '设计走查(Design QA)的主要目的是？', options: [
      { id: 'A', label: 'A', text: '编写测试用例' }, { id: 'B', label: 'B', text: '对比开发实现与设计稿的一致性' },
      { id: 'C', label: 'C', text: '审查代码质量' }, { id: 'D', label: 'D', text: '优化服务器性能' },
    ], answer: ['B'] },
    { id: 4, type: 'single', text: '作品集(Portfolio)中最重要的展示要素是？', options: [
      { id: 'A', label: 'A', text: '作品数量越多越好' }, { id: 'B', label: 'B', text: '清晰的设计思考过程和解决问题的能力' },
      { id: 'C', label: 'C', text: '使用最流行的工具' }, { id: 'D', label: 'D', text: '只展示最终界面' },
    ], answer: ['B'] },
    { id: 5, type: 'multiple', text: '一个完整的设计复盘(Retrospective)应包含哪些内容？(多选)', options: [
      { id: 'A', label: 'A', text: '项目目标回顾' }, { id: 'B', label: 'B', text: '数据指标对比分析' },
      { id: 'C', label: 'C', text: '流程中的问题与改进点' }, { id: 'D', label: 'D', text: '仅列出成功经验' },
    ], answer: ['A', 'B', 'C'] },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // 全栈开发：React+Node
  // ═══════════════════════════════════════════════════════════════════════════

  'React 核心基础': [
    { id: 1, type: 'single', text: 'JSX本质上会被编译成什么？', options: [
      { id: 'A', label: 'A', text: 'HTML字符串' }, { id: 'B', label: 'B', text: 'React.createElement() 函数调用' },
      { id: 'C', label: 'C', text: 'DOM元素' }, { id: 'D', label: 'D', text: 'CSS样式' },
    ], answer: ['B'] },
    { id: 2, type: 'multiple', text: '以下关于React Hooks的说法正确的是？(多选)', options: [
      { id: 'A', label: 'A', text: 'Hooks只能在函数组件顶层调用' }, { id: 'B', label: 'B', text: '自定义Hook的命名必须以use开头' },
      { id: 'C', label: 'C', text: 'useRef的值变化会触发重渲染' }, { id: 'D', label: 'D', text: 'useMemo可用于缓存计算结果' },
    ], answer: ['A', 'B', 'D'] },
    { id: 3, type: 'single', text: 'React中 useEffect 的依赖数组为空 [] 时，效果等价于？', options: [
      { id: 'A', label: 'A', text: '每次渲染都执行' }, { id: 'B', label: 'B', text: '仅在组件挂载时执行一次' },
      { id: 'C', label: 'C', text: '组件卸载时执行' }, { id: 'D', label: 'D', text: '永远不执行' },
    ], answer: ['B'] },
    { id: 4, type: 'single', text: 'React中 key 属性的主要作用是？', options: [
      { id: 'A', label: 'A', text: '加密组件数据' }, { id: 'B', label: 'B', text: '帮助React识别列表中哪些元素发生了变化' },
      { id: 'C', label: 'C', text: '设置CSS样式' }, { id: 'D', label: 'D', text: '定义组件的唯一URL' },
    ], answer: ['B'] },
    { id: 5, type: 'single', text: 'React Router v6中，用于嵌套路由渲染子路由的组件是？', options: [
      { id: 'A', label: 'A', text: '<Switch>' }, { id: 'B', label: 'B', text: '<Outlet />' },
      { id: 'C', label: 'C', text: '<Route>' }, { id: 'D', label: 'D', text: '<Link>' },
    ], answer: ['B'] },
  ],

  'Node.js 服务端开发': [
    { id: 1, type: 'single', text: 'Node.js的事件循环(Event Loop)基于什么模型？', options: [
      { id: 'A', label: 'A', text: '多线程同步模型' }, { id: 'B', label: 'B', text: '单线程非阻塞异步I/O模型' },
      { id: 'C', label: 'C', text: '多进程共享内存模型' }, { id: 'D', label: 'D', text: '协程模型' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'Express中间件(Middleware)的执行顺序是？', options: [
      { id: 'A', label: 'A', text: '随机执行' }, { id: 'B', label: 'B', text: '按注册顺序依次执行' },
      { id: 'C', label: 'C', text: '按字母顺序执行' }, { id: 'D', label: 'D', text: '并行执行' },
    ], answer: ['B'] },
    { id: 3, type: 'single', text: 'RESTful API设计中，更新资源通常使用哪个HTTP方法？', options: [
      { id: 'A', label: 'A', text: 'GET' }, { id: 'B', label: 'B', text: 'POST' },
      { id: 'C', label: 'C', text: 'PUT/PATCH' }, { id: 'D', label: 'D', text: 'DELETE' },
    ], answer: ['C'] },
    { id: 4, type: 'multiple', text: '关于JWT(JSON Web Token)认证，以下说法正确的是？(多选)', options: [
      { id: 'A', label: 'A', text: '由Header、Payload、Signature三部分组成' }, { id: 'B', label: 'B', text: '适合无状态的API认证' },
      { id: 'C', label: 'C', text: 'Payload默认是加密的' }, { id: 'D', label: 'D', text: '可以设置过期时间' },
    ], answer: ['A', 'B', 'D'] },
    { id: 5, type: 'single', text: 'Express中 res.json() 与 res.send() 的区别是？', options: [
      { id: 'A', label: 'A', text: '完全相同' }, { id: 'B', label: 'B', text: 'res.json() 会自动设置Content-Type为application/json并序列化对象' },
      { id: 'C', label: 'C', text: 'res.send() 只能发送字符串' }, { id: 'D', label: 'D', text: 'res.json() 速度更慢' },
    ], answer: ['B'] },
  ],

  '数据库与全栈整合': [
    { id: 1, type: 'single', text: 'SQL中 JOIN 默认是哪种类型的连接？', options: [
      { id: 'A', label: 'A', text: 'LEFT JOIN' }, { id: 'B', label: 'B', text: 'INNER JOIN' },
      { id: 'C', label: 'C', text: 'OUTER JOIN' }, { id: 'D', label: 'D', text: 'CROSS JOIN' },
    ], answer: ['B'] },
    { id: 2, type: 'multiple', text: 'Prisma ORM的核心优势包括？(多选)', options: [
      { id: 'A', label: 'A', text: '类型安全的数据库查询' }, { id: 'B', label: 'B', text: '自动生成迁移文件' },
      { id: 'C', label: 'C', text: '直观的Schema定义语言' }, { id: 'D', label: 'D', text: '内置前端UI组件' },
    ], answer: ['A', 'B', 'C'] },
    { id: 3, type: 'single', text: '前后端联调时出现CORS错误，应该在哪里解决？', options: [
      { id: 'A', label: 'A', text: '只在前端解决' }, { id: 'B', label: 'B', text: '在后端服务器设置CORS头' },
      { id: 'C', label: 'C', text: '修改浏览器设置' }, { id: 'D', label: 'D', text: '修改数据库配置' },
    ], answer: ['B'] },
    { id: 4, type: 'single', text: '在生产环境部署Node.js应用时，PM2的主要作用是？', options: [
      { id: 'A', label: 'A', text: '代码编译' }, { id: 'B', label: 'B', text: '进程管理、自动重启和负载均衡' },
      { id: 'C', label: 'C', text: '数据库管理' }, { id: 'D', label: 'D', text: 'DNS解析' },
    ], answer: ['B'] },
    { id: 5, type: 'single', text: 'MySQL中索引(Index)的主要作用是？', options: [
      { id: 'A', label: 'A', text: '增加数据安全性' }, { id: 'B', label: 'B', text: '加速查询速度' },
      { id: 'C', label: 'C', text: '减少存储空间' }, { id: 'D', label: 'D', text: '自动备份数据' },
    ], answer: ['B'] },
  ],

  '进阶专题': [
    { id: 1, type: 'single', text: 'TypeScript中 interface 和 type 的主要区别是？', options: [
      { id: 'A', label: 'A', text: '完全没有区别' }, { id: 'B', label: 'B', text: 'interface可以被继承和合并声明，type更灵活支持联合类型' },
      { id: 'C', label: 'C', text: 'type性能更好' }, { id: 'D', label: 'D', text: 'interface只能用于函数' },
    ], answer: ['B'] },
    { id: 2, type: 'multiple', text: '以下哪些是React状态管理方案？(多选)', options: [
      { id: 'A', label: 'A', text: 'Redux' }, { id: 'B', label: 'B', text: 'Zustand' },
      { id: 'C', label: 'C', text: 'Jotai' }, { id: 'D', label: 'D', text: 'Express' },
    ], answer: ['A', 'B', 'C'] },
    { id: 3, type: 'single', text: 'React性能优化中，React.memo的作用是？', options: [
      { id: 'A', label: 'A', text: '缓存API请求' }, { id: 'B', label: 'B', text: '当props没有变化时跳过组件重渲染' },
      { id: 'C', label: 'C', text: '压缩代码体积' }, { id: 'D', label: 'D', text: '加速首屏加载' },
    ], answer: ['B'] },
    { id: 4, type: 'multiple', text: '以下哪些是TypeScript的内置工具类型(Utility Types)？(多选)', options: [
      { id: 'A', label: 'A', text: 'Partial<T>' }, { id: 'B', label: 'B', text: 'Pick<T, K>' },
      { id: 'C', label: 'C', text: 'Omit<T, K>' }, { id: 'D', label: 'D', text: 'Observable<T>' },
    ], answer: ['A', 'B', 'C'] },
    { id: 5, type: 'single', text: 'Zustand相比Redux的主要优势是？', options: [
      { id: 'A', label: 'A', text: '功能更多' }, { id: 'B', label: 'B', text: '更轻量、无模板代码、不需要Provider包裹' },
      { id: 'C', label: 'C', text: '只支持类组件' }, { id: 'D', label: 'D', text: '自带路由功能' },
    ], answer: ['B'] },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // 零基础Python自动化
  // ═══════════════════════════════════════════════════════════════════════════

  'Python 基础语法': [
    { id: 1, type: 'single', text: 'Python中以下哪种数据类型是不可变的(Immutable)？', options: [
      { id: 'A', label: 'A', text: 'list' }, { id: 'B', label: 'B', text: 'dict' },
      { id: 'C', label: 'C', text: 'tuple' }, { id: 'D', label: 'D', text: 'set' },
    ], answer: ['C'] },
    { id: 2, type: 'multiple', text: '以下哪些是Python的基本数据类型？(多选)', options: [
      { id: 'A', label: 'A', text: 'int' }, { id: 'B', label: 'B', text: 'str' },
      { id: 'C', label: 'C', text: 'float' }, { id: 'D', label: 'D', text: 'array' },
    ], answer: ['A', 'B', 'C'] },
    { id: 3, type: 'single', text: 'Python中 range(1, 10, 2) 生成的序列是？', options: [
      { id: 'A', label: 'A', text: '1, 2, 3, 4, 5, 6, 7, 8, 9' }, { id: 'B', label: 'B', text: '1, 3, 5, 7, 9' },
      { id: 'C', label: 'C', text: '2, 4, 6, 8, 10' }, { id: 'D', label: 'D', text: '1, 3, 5, 7, 9, 10' },
    ], answer: ['B'] },
    { id: 4, type: 'single', text: 'Python函数定义中 *args 的作用是？', options: [
      { id: 'A', label: 'A', text: '接收一个列表参数' }, { id: 'B', label: 'B', text: '接收任意数量的位置参数' },
      { id: 'C', label: 'C', text: '接收关键字参数' }, { id: 'D', label: 'D', text: '定义默认参数' },
    ], answer: ['B'] },
    { id: 5, type: 'single', text: 'Python中列表推导式 [x**2 for x in range(5)] 的结果是？', options: [
      { id: 'A', label: 'A', text: '[1, 4, 9, 16, 25]' }, { id: 'B', label: 'B', text: '[0, 1, 4, 9, 16]' },
      { id: 'C', label: 'C', text: '[0, 2, 4, 6, 8]' }, { id: 'D', label: 'D', text: '[1, 2, 3, 4, 5]' },
    ], answer: ['B'] },
  ],

  '自动化实战': [
    { id: 1, type: 'single', text: 'Python中 os.path.join() 的作用是？', options: [
      { id: 'A', label: 'A', text: '合并两个字符串' }, { id: 'B', label: 'B', text: '跨平台地拼接文件路径' },
      { id: 'C', label: 'C', text: '连接数据库' }, { id: 'D', label: 'D', text: '合并两个列表' },
    ], answer: ['B'] },
    { id: 2, type: 'multiple', text: '以下哪些是requests库支持的HTTP方法？(多选)', options: [
      { id: 'A', label: 'A', text: 'requests.get()' }, { id: 'B', label: 'B', text: 'requests.post()' },
      { id: 'C', label: 'C', text: 'requests.put()' }, { id: 'D', label: 'D', text: 'requests.render()' },
    ], answer: ['A', 'B', 'C'] },
    { id: 3, type: 'single', text: 'BeautifulSoup中 find_all() 方法返回的数据类型是？', options: [
      { id: 'A', label: 'A', text: '字符串' }, { id: 'B', label: 'B', text: 'ResultSet(类似列表)' },
      { id: 'C', label: 'C', text: '字典' }, { id: 'D', label: 'D', text: '单个元素' },
    ], answer: ['B'] },
    { id: 4, type: 'single', text: 'openpyxl库中，读取Excel文件使用哪个方法？', options: [
      { id: 'A', label: 'A', text: 'openpyxl.open()' }, { id: 'B', label: 'B', text: 'openpyxl.load_workbook()' },
      { id: 'C', label: 'C', text: 'openpyxl.read()' }, { id: 'D', label: 'D', text: 'openpyxl.Workbook()' },
    ], answer: ['B'] },
    { id: 5, type: 'multiple', text: 'Python定时任务的实现方式有？(多选)', options: [
      { id: 'A', label: 'A', text: 'schedule库' }, { id: 'B', label: 'B', text: '操作系统crontab' },
      { id: 'C', label: 'C', text: 'APScheduler' }, { id: 'D', label: 'D', text: 'time.sleep()循环' },
    ], answer: ['A', 'B', 'C', 'D'] },
  ],

  '综合项目': [
    { id: 1, type: 'single', text: '项目规划阶段，最重要的产出物是？', options: [
      { id: 'A', label: 'A', text: '完整的代码' }, { id: 'B', label: 'B', text: '需求分析和技术方案文档' },
      { id: 'C', label: 'C', text: '测试报告' }, { id: 'D', label: 'D', text: '部署脚本' },
    ], answer: ['B'] },
    { id: 2, type: 'multiple', text: '代码实现阶段的良好实践包括？(多选)', options: [
      { id: 'A', label: 'A', text: '版本控制(Git)' }, { id: 'B', label: 'B', text: '代码注释和文档' },
      { id: 'C', label: 'C', text: '模块化设计' }, { id: 'D', label: 'D', text: '所有代码写在一个文件中' },
    ], answer: ['A', 'B', 'C'] },
    { id: 3, type: 'single', text: 'Python中 try-except 语句的作用是？', options: [
      { id: 'A', label: 'A', text: '循环执行代码' }, { id: 'B', label: 'B', text: '捕获和处理运行时异常' },
      { id: 'C', label: 'C', text: '定义函数' }, { id: 'D', label: 'D', text: '导入模块' },
    ], answer: ['B'] },
    { id: 4, type: 'single', text: '调试(Debug)时最常用的Python工具是？', options: [
      { id: 'A', label: 'A', text: 'print() 和 pdb' }, { id: 'B', label: 'B', text: 'pip install' },
      { id: 'C', label: 'C', text: 'import os' }, { id: 'D', label: 'D', text: 'class Debug' },
    ], answer: ['A'] },
    { id: 5, type: 'single', text: '项目展示时，除了演示功能外，还应着重展示什么？', options: [
      { id: 'A', label: 'A', text: '代码行数' }, { id: 'B', label: 'B', text: '解决问题的思路和技术选型的理由' },
      { id: 'C', label: 'C', text: '使用了多少个第三方库' }, { id: 'D', label: 'D', text: '电脑配置' },
    ], answer: ['B'] },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // 数据分析与可视化
  // ═══════════════════════════════════════════════════════════════════════════

  '数据分析基础': [
    { id: 1, type: 'single', text: 'NumPy中创建全零数组的函数是？', options: [
      { id: 'A', label: 'A', text: 'np.empty()' }, { id: 'B', label: 'B', text: 'np.zeros()' },
      { id: 'C', label: 'C', text: 'np.null()' }, { id: 'D', label: 'D', text: 'np.blank()' },
    ], answer: ['B'] },
    { id: 2, type: 'multiple', text: 'Pandas DataFrame的数据选择方式包括？(多选)', options: [
      { id: 'A', label: 'A', text: 'df.loc[] (标签索引)' }, { id: 'B', label: 'B', text: 'df.iloc[] (位置索引)' },
      { id: 'C', label: 'C', text: 'df[条件] (布尔索引)' }, { id: 'D', label: 'D', text: 'df.compile()' },
    ], answer: ['A', 'B', 'C'] },
    { id: 3, type: 'single', text: 'Pandas中处理缺失值NaN的 fillna() 方法的作用是？', options: [
      { id: 'A', label: 'A', text: '删除含NaN的行' }, { id: 'B', label: 'B', text: '用指定值填充NaN' },
      { id: 'C', label: 'C', text: '查找NaN的位置' }, { id: 'D', label: 'D', text: '统计NaN的数量' },
    ], answer: ['B'] },
    { id: 4, type: 'single', text: 'Pandas中 groupby() 方法的作用是？', options: [
      { id: 'A', label: 'A', text: '合并两个DataFrame' }, { id: 'B', label: 'B', text: '按指定列分组聚合数据' },
      { id: 'C', label: 'C', text: '排序数据' }, { id: 'D', label: 'D', text: '重命名列' },
    ], answer: ['B'] },
    { id: 5, type: 'multiple', text: '数据清洗通常需要处理的问题包括？(多选)', options: [
      { id: 'A', label: 'A', text: '缺失值' }, { id: 'B', label: 'B', text: '重复数据' },
      { id: 'C', label: 'C', text: '数据类型不一致' }, { id: 'D', label: 'D', text: '模型训练调参' },
    ], answer: ['A', 'B', 'C'] },
  ],

  '数据可视化': [
    { id: 1, type: 'single', text: 'Matplotlib中创建子图的方法是？', options: [
      { id: 'A', label: 'A', text: 'plt.subplot() 或 plt.subplots()' }, { id: 'B', label: 'B', text: 'plt.create()' },
      { id: 'C', label: 'C', text: 'plt.draw()' }, { id: 'D', label: 'D', text: 'plt.new_figure()' },
    ], answer: ['A'] },
    { id: 2, type: 'multiple', text: '以下哪些图表类型适合展示数据分布？(多选)', options: [
      { id: 'A', label: 'A', text: '直方图(Histogram)' }, { id: 'B', label: 'B', text: '箱线图(Box Plot)' },
      { id: 'C', label: 'C', text: '饼图(Pie Chart)' }, { id: 'D', label: 'D', text: '核密度图(KDE)' },
    ], answer: ['A', 'B', 'D'] },
    { id: 3, type: 'single', text: 'Seaborn相比Matplotlib的主要优势是？', options: [
      { id: 'A', label: 'A', text: '运行速度更快' }, { id: 'B', label: 'B', text: '更美观的默认样式和高级统计图表API' },
      { id: 'C', label: 'C', text: '支持3D图表' }, { id: 'D', label: 'D', text: '可以直接连接数据库' },
    ], answer: ['B'] },
    { id: 4, type: 'single', text: 'Plotly相比Matplotlib最大的优势是？', options: [
      { id: 'A', label: 'A', text: '运行速度更快' }, { id: 'B', label: 'B', text: '原生支持交互式图表(缩放、悬停提示等)' },
      { id: 'C', label: 'C', text: '安装更简单' }, { id: 'D', label: 'D', text: '只需一行代码' },
    ], answer: ['B'] },
    { id: 5, type: 'single', text: '制作商业报表时，最重要的原则是？', options: [
      { id: 'A', label: 'A', text: '图表越多越好' }, { id: 'B', label: 'B', text: '数据准确、可视化清晰、突出核心指标' },
      { id: 'C', label: 'C', text: '使用最复杂的图表类型' }, { id: 'D', label: 'D', text: '颜色越鲜艳越好' },
    ], answer: ['B'] },
  ],

  '实战与项目': [
    { id: 1, type: 'single', text: '电商数据分析中，RFM模型的"R"代表什么？', options: [
      { id: 'A', label: 'A', text: 'Revenue(收入)' }, { id: 'B', label: 'B', text: 'Recency(最近一次消费时间)' },
      { id: 'C', label: 'C', text: 'Rating(评分)' }, { id: 'D', label: 'D', text: 'Return(退货)' },
    ], answer: ['B'] },
    { id: 2, type: 'multiple', text: '用户行为分析中常用的指标包括？(多选)', options: [
      { id: 'A', label: 'A', text: '日活跃用户(DAU)' }, { id: 'B', label: 'B', text: '留存率' },
      { id: 'C', label: 'C', text: '转化漏斗' }, { id: 'D', label: 'D', text: '服务器CPU使用率' },
    ], answer: ['A', 'B', 'C'] },
    { id: 3, type: 'single', text: '数据报告撰写的"金字塔原理"是指？', options: [
      { id: 'A', label: 'A', text: '先说细节再总结' }, { id: 'B', label: 'B', text: '先给结论，再层层展开论据' },
      { id: 'C', label: 'C', text: '只用图表不用文字' }, { id: 'D', label: 'D', text: '报告越长越好' },
    ], answer: ['B'] },
    { id: 4, type: 'single', text: '数据分析中的"漏斗分析"主要用于？', options: [
      { id: 'A', label: 'A', text: '分析数据分布' }, { id: 'B', label: 'B', text: '追踪用户在各转化环节的流失情况' },
      { id: 'C', label: 'C', text: '预测未来趋势' }, { id: 'D', label: 'D', text: '数据存储优化' },
    ], answer: ['B'] },
    { id: 5, type: 'multiple', text: '一份优秀的数据分析报告应包含？(多选)', options: [
      { id: 'A', label: 'A', text: '清晰的分析目标' }, { id: 'B', label: 'B', text: '关键发现和可视化' },
      { id: 'C', label: 'C', text: '可行的建议方案' }, { id: 'D', label: 'D', text: '所有原始数据' },
    ], answer: ['A', 'B', 'C'] },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // 人工智能基础与应用
  // ═══════════════════════════════════════════════════════════════════════════

  '机器学习基础': [
    { id: 1, type: 'single', text: '以下哪个不属于监督学习算法？', options: [
      { id: 'A', label: 'A', text: '线性回归' }, { id: 'B', label: 'B', text: '决策树' },
      { id: 'C', label: 'C', text: 'K-Means聚类' }, { id: 'D', label: 'D', text: '支持向量机(SVM)' },
    ], answer: ['C'] },
    { id: 2, type: 'multiple', text: '防止模型过拟合的方法包括？(多选)', options: [
      { id: 'A', label: 'A', text: '增加训练数据' }, { id: 'B', label: 'B', text: '正则化(L1/L2)' },
      { id: 'C', label: 'C', text: 'Dropout' }, { id: 'D', label: 'D', text: '增加模型复杂度' },
    ], answer: ['A', 'B', 'C'] },
    { id: 3, type: 'single', text: 'Scikit-learn中 train_test_split 的默认测试集比例是？', options: [
      { id: 'A', label: 'A', text: '10%' }, { id: 'B', label: 'B', text: '25%' },
      { id: 'C', label: 'C', text: '30%' }, { id: 'D', label: 'D', text: '50%' },
    ], answer: ['B'] },
    { id: 4, type: 'single', text: '混淆矩阵(Confusion Matrix)中，"精确率(Precision)"的含义是？', options: [
      { id: 'A', label: 'A', text: '所有样本中预测正确的比例' }, { id: 'B', label: 'B', text: '预测为正的样本中实际为正的比例' },
      { id: 'C', label: 'C', text: '实际为正的样本中被正确预测的比例' }, { id: 'D', label: 'D', text: '预测错误的总数' },
    ], answer: ['B'] },
    { id: 5, type: 'single', text: '机器学习中，梯度下降法的目的是？', options: [
      { id: 'A', label: 'A', text: '增大损失函数' }, { id: 'B', label: 'B', text: '找到损失函数的最小值点' },
      { id: 'C', label: 'C', text: '增加模型参数' }, { id: 'D', label: 'D', text: '提高学习率' },
    ], answer: ['B'] },
  ],

  '深度学习入门': [
    { id: 1, type: 'single', text: '卷积神经网络(CNN)中，卷积层的主要作用是？', options: [
      { id: 'A', label: 'A', text: '降低图片分辨率' }, { id: 'B', label: 'B', text: '提取局部特征' },
      { id: 'C', label: 'C', text: '全连接分类' }, { id: 'D', label: 'D', text: '数据增强' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: '激活函数ReLU的定义是？', options: [
      { id: 'A', label: 'A', text: 'f(x) = 1/(1+e^(-x))' }, { id: 'B', label: 'B', text: 'f(x) = max(0, x)' },
      { id: 'C', label: 'C', text: 'f(x) = tanh(x)' }, { id: 'D', label: 'D', text: 'f(x) = x^2' },
    ], answer: ['B'] },
    { id: 3, type: 'multiple', text: '以下关于TensorFlow/Keras的说法正确的是？(多选)', options: [
      { id: 'A', label: 'A', text: 'Keras是TensorFlow的高层API' }, { id: 'B', label: 'B', text: '支持GPU加速训练' },
      { id: 'C', label: 'C', text: 'Sequential模型是最简单的模型类型' }, { id: 'D', label: 'D', text: '只能处理图像数据' },
    ], answer: ['A', 'B', 'C'] },
    { id: 4, type: 'single', text: 'Batch Normalization的主要作用是？', options: [
      { id: 'A', label: 'A', text: '增加批次大小' }, { id: 'B', label: 'B', text: '加速训练收敛并稳定梯度' },
      { id: 'C', label: 'C', text: '减少模型参数' }, { id: 'D', label: 'D', text: '数据预处理' },
    ], answer: ['B'] },
    { id: 5, type: 'single', text: '图像分类任务中，CNN最后通常接什么层进行分类？', options: [
      { id: 'A', label: 'A', text: '卷积层' }, { id: 'B', label: 'B', text: '全连接层(Dense) + Softmax' },
      { id: 'C', label: 'C', text: '池化层' }, { id: 'D', label: 'D', text: '循环层' },
    ], answer: ['B'] },
  ],

  'AI 应用开发': [
    { id: 1, type: 'single', text: 'NLP中，分词(Tokenization)的作用是？', options: [
      { id: 'A', label: 'A', text: '翻译文本' }, { id: 'B', label: 'B', text: '将文本切分为最小语义单元(词/子词)' },
      { id: 'C', label: 'C', text: '压缩文本' }, { id: 'D', label: 'D', text: '加密文本' },
    ], answer: ['B'] },
    { id: 2, type: 'multiple', text: '大语言模型(LLM) API调用时需要注意什么？(多选)', options: [
      { id: 'A', label: 'A', text: 'Token数量限制' }, { id: 'B', label: 'B', text: '温度(Temperature)参数影响输出随机性' },
      { id: 'C', label: 'C', text: 'API Key安全管理' }, { id: 'D', label: 'D', text: '无需考虑费用' },
    ], answer: ['A', 'B', 'C'] },
    { id: 3, type: 'single', text: 'Prompt Engineering(提示词工程)的目的是？', options: [
      { id: 'A', label: 'A', text: '训练模型' }, { id: 'B', label: 'B', text: '通过优化输入提示来获得更好的模型输出' },
      { id: 'C', label: 'C', text: '修改模型参数' }, { id: 'D', label: 'D', text: '加速推理' },
    ], answer: ['B'] },
    { id: 4, type: 'single', text: 'RAG(检索增强生成)架构的核心思想是？', options: [
      { id: 'A', label: 'A', text: '只用检索不用生成' }, { id: 'B', label: 'B', text: '先检索相关文档，再将检索结果作为上下文输入生成模型' },
      { id: 'C', label: 'C', text: '随机生成答案' }, { id: 'D', label: 'D', text: '替换数据库' },
    ], answer: ['B'] },
    { id: 5, type: 'multiple', text: '构建一个智能问答应用需要哪些核心组件？(多选)', options: [
      { id: 'A', label: 'A', text: '知识库/向量数据库' }, { id: 'B', label: 'B', text: 'LLM推理引擎' },
      { id: 'C', label: 'C', text: '用户交互界面' }, { id: 'D', label: 'D', text: '区块链' },
    ], answer: ['A', 'B', 'C'] },
  ],

  // ═══════════════════════════════════════════════════════════════════════════
  // 产品经理实战训练营
  // ═══════════════════════════════════════════════════════════════════════════

  '产品思维与方法论': [
    { id: 1, type: 'single', text: '产品经理的核心职责是？', options: [
      { id: 'A', label: 'A', text: '编写代码' }, { id: 'B', label: 'B', text: '定义产品方向、协调团队交付用户价值' },
      { id: 'C', label: 'C', text: '设计UI界面' }, { id: 'D', label: 'D', text: '运维服务器' },
    ], answer: ['B'] },
    { id: 2, type: 'multiple', text: '用户需求挖掘的常用方法包括？(多选)', options: [
      { id: 'A', label: 'A', text: '用户访谈' }, { id: 'B', label: 'B', text: '问卷调查' },
      { id: 'C', label: 'C', text: '数据分析' }, { id: 'D', label: 'D', text: '代码审查' },
    ], answer: ['A', 'B', 'C'] },
    { id: 3, type: 'single', text: 'KANO模型将需求分为几个主要类型？', options: [
      { id: 'A', label: 'A', text: '2种' }, { id: 'B', label: 'B', text: '3种(基本型、期望型、兴奋型)' },
      { id: 'C', label: 'C', text: '5种(包含无差别型和反向型)' }, { id: 'D', label: 'D', text: '1种' },
    ], answer: ['C'] },
    { id: 4, type: 'multiple', text: '一份完整的PRD(产品需求文档)通常包含？(多选)', options: [
      { id: 'A', label: 'A', text: '产品概述和目标' }, { id: 'B', label: 'B', text: '功能需求和用户故事' },
      { id: 'C', label: 'C', text: '信息架构和页面流程' }, { id: 'D', label: 'D', text: '服务器硬件采购清单' },
    ], answer: ['A', 'B', 'C'] },
    { id: 5, type: 'single', text: '产品路线图(Roadmap)的主要作用是？', options: [
      { id: 'A', label: 'A', text: '记录Bug列表' }, { id: 'B', label: 'B', text: '规划产品中长期发展方向和里程碑' },
      { id: 'C', label: 'C', text: '统计销售数据' }, { id: 'D', label: 'D', text: '管理员工考勤' },
    ], answer: ['B'] },
  ],

  '产品设计与执行': [
    { id: 1, type: 'single', text: '产品原型设计中，低保真原型的主要作用是？', options: [
      { id: 'A', label: 'A', text: '展示最终视觉效果' }, { id: 'B', label: 'B', text: '快速验证信息架构和交互流程' },
      { id: 'C', label: 'C', text: '提供开发规格标注' }, { id: 'D', label: 'D', text: '替代用户测试' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: '数据驱动决策中，北极星指标(North Star Metric)的特点是？', options: [
      { id: 'A', label: 'A', text: '每个部门有不同的北极星指标' }, { id: 'B', label: 'B', text: '能反映产品核心价值，驱动长期增长的唯一关键指标' },
      { id: 'C', label: 'C', text: '只关注收入' }, { id: 'D', label: 'D', text: '每天都需要更换' },
    ], answer: ['B'] },
    { id: 3, type: 'single', text: 'A/B测试中，保证结果可靠的关键是？', options: [
      { id: 'A', label: 'A', text: '测试时间越短越好' }, { id: 'B', label: 'B', text: '充足的样本量和统计显著性' },
      { id: 'C', label: 'C', text: '同时测试多个变量' }, { id: 'D', label: 'D', text: '只看点击率' },
    ], answer: ['B'] },
    { id: 4, type: 'multiple', text: '跨团队协作沟通时，产品经理应注意什么？(多选)', options: [
      { id: 'A', label: 'A', text: '与设计师对齐用户体验目标' }, { id: 'B', label: 'B', text: '与工程师确认技术可行性' },
      { id: 'C', label: 'C', text: '与运营确认推广节奏' }, { id: 'D', label: 'D', text: '所有决定由产品经理单独做' },
    ], answer: ['A', 'B', 'C'] },
    { id: 5, type: 'single', text: '产品迭代中的"灰度发布"是指？', options: [
      { id: 'A', label: 'A', text: '界面使用灰色主题' }, { id: 'B', label: 'B', text: '将新功能逐步推送给部分用户以降低风险' },
      { id: 'C', label: 'C', text: '仅在夜间发布' }, { id: 'D', label: 'D', text: '不经过测试直接上线' },
    ], answer: ['B'] },
  ],

  '案例与求职': [
    { id: 1, type: 'single', text: '产品案例拆解时，最重要的分析角度是？', options: [
      { id: 'A', label: 'A', text: '界面美观度' }, { id: 'B', label: 'B', text: '产品解决了什么问题、如何盈利、增长策略' },
      { id: 'C', label: 'C', text: '使用了什么技术栈' }, { id: 'D', label: 'D', text: '公司规模大小' },
    ], answer: ['B'] },
    { id: 2, type: 'multiple', text: '产品经理面试中常见的题型包括？(多选)', options: [
      { id: 'A', label: 'A', text: '产品设计题(设计一个XX)' }, { id: 'B', label: 'B', text: '策略分析题(如何提升XX指标)' },
      { id: 'C', label: 'C', text: '行为面试题(STAR法则)' }, { id: 'D', label: 'D', text: '算法编程题' },
    ], answer: ['A', 'B', 'C'] },
    { id: 3, type: 'single', text: 'STAR面试法则中的"T"代表什么？', options: [
      { id: 'A', label: 'A', text: 'Team(团队)' }, { id: 'B', label: 'B', text: 'Task(任务)' },
      { id: 'C', label: 'C', text: 'Technology(技术)' }, { id: 'D', label: 'D', text: 'Time(时间)' },
    ], answer: ['B'] },
    { id: 4, type: 'single', text: '产品经理作品集应该重点展示什么？', options: [
      { id: 'A', label: 'A', text: '参与过的所有项目' }, { id: 'B', label: 'B', text: '2-3个有深度的案例，体现思考过程和数据驱动' },
      { id: 'C', label: 'C', text: '技术文档' }, { id: 'D', label: 'D', text: '代码截图' },
    ], answer: ['B'] },
    { id: 5, type: 'multiple', text: 'AARRR海盗指标模型包括哪些阶段？(多选)', options: [
      { id: 'A', label: 'A', text: '获取(Acquisition)' }, { id: 'B', label: 'B', text: '激活(Activation)' },
      { id: 'C', label: 'C', text: '留存(Retention)' }, { id: 'D', label: 'D', text: '推荐(Referral)' },
    ], answer: ['A', 'B', 'C', 'D'] },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// 小节练习题库 — 每个课时独立的练习题（2题/节），用于课后巩固
// key = 数据库中的实际课时标题（来自 seed_catalog.ts）
// ═══════════════════════════════════════════════════════════════════════════════

export const LESSON_QUESTION_BANK: Record<string, QuizQuestion[]> = {

  // ─── 高级UI/UX设计实战 ─── 设计基础与思维 ──────────────────────────────────
  '设计思维导论': [
    { id: 1, type: 'single', text: '设计思维(Design Thinking)通常包括几个核心阶段？', options: [
      { id: 'A', label: 'A', text: '3个' }, { id: 'B', label: 'B', text: '5个' },
      { id: 'C', label: 'C', text: '7个' }, { id: 'D', label: 'D', text: '10个' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: '以用户为中心的设计(UCD)的核心理念是？', options: [
      { id: 'A', label: 'A', text: '以技术为优先' }, { id: 'B', label: 'B', text: '始终围绕用户需求进行设计决策' },
      { id: 'C', label: 'C', text: '以商业利润为唯一导向' }, { id: 'D', label: 'D', text: '追随竞品设计' },
    ], answer: ['B'] },
  ],
  '用户研究方法': [
    { id: 1, type: 'single', text: '定性研究与定量研究的主要区别是？', options: [
      { id: 'A', label: 'A', text: '定性关注"为什么"，定量关注"多少"' }, { id: 'B', label: 'B', text: '完全相同' },
      { id: 'C', label: 'C', text: '定量更便宜' }, { id: 'D', label: 'D', text: '定性不需要用户参与' },
    ], answer: ['A'] },
    { id: 2, type: 'multiple', text: '以下哪些属于定性研究方法？(多选)', options: [
      { id: 'A', label: 'A', text: '深度访谈' }, { id: 'B', label: 'B', text: '焦点小组' },
      { id: 'C', label: 'C', text: 'A/B测试' }, { id: 'D', label: 'D', text: '情境观察' },
    ], answer: ['A', 'B', 'D'] },
  ],
  '信息架构设计': [
    { id: 1, type: 'single', text: '卡片分类法(Card Sorting)主要用于？', options: [
      { id: 'A', label: 'A', text: '测试视觉效果' }, { id: 'B', label: 'B', text: '帮助确定信息分类和导航结构' },
      { id: 'C', label: 'C', text: '编写代码' }, { id: 'D', label: 'D', text: '评估性能' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: '网站地图(Site Map)的核心作用是？', options: [
      { id: 'A', label: 'A', text: '展示视觉设计' }, { id: 'B', label: 'B', text: '呈现信息层级和页面之间的关系' },
      { id: 'C', label: 'C', text: '记录开发进度' }, { id: 'D', label: 'D', text: '搜索引擎优化' },
    ], answer: ['B'] },
  ],
  '用户旅程地图': [
    { id: 1, type: 'single', text: '用户旅程地图中，"触点(Touchpoint)"是指？', options: [
      { id: 'A', label: 'A', text: '触摸屏操作' }, { id: 'B', label: 'B', text: '用户与产品/服务交互的每个接触点' },
      { id: 'C', label: 'C', text: '用户的手指位置' }, { id: 'D', label: 'D', text: '服务器节点' },
    ], answer: ['B'] },
    { id: 2, type: 'multiple', text: '用户旅程地图通常包含哪些要素？(多选)', options: [
      { id: 'A', label: 'A', text: '用户行为步骤' }, { id: 'B', label: 'B', text: '情绪曲线' },
      { id: 'C', label: 'C', text: '痛点与机会点' }, { id: 'D', label: 'D', text: '数据库表结构' },
    ], answer: ['A', 'B', 'C'] },
  ],

  // ─── 高级UI/UX设计实战 ─── UI设计核心技能 ──────────────────────────────────
  '色彩与排版': [
    { id: 1, type: 'single', text: '60-30-10色彩配比规则中，60%用于？', options: [
      { id: 'A', label: 'A', text: '强调色' }, { id: 'B', label: 'B', text: '主色/背景色' },
      { id: 'C', label: 'C', text: '辅助色' }, { id: 'D', label: 'D', text: '渐变色' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: '无衬线体(Sans-serif)相比衬线体的特点是？', options: [
      { id: 'A', label: 'A', text: '字母末端有装饰线' }, { id: 'B', label: 'B', text: '简洁现代，屏幕阅读体验更佳' },
      { id: 'C', label: 'C', text: '仅用于印刷' }, { id: 'D', label: 'D', text: '字号更大' },
    ], answer: ['B'] },
  ],
  'Figma工具入门': [
    { id: 1, type: 'single', text: 'Figma中 Auto Layout 的主要作用是？', options: [
      { id: 'A', label: 'A', text: '自动生成代码' }, { id: 'B', label: 'B', text: '让元素根据内容自动排列和调整尺寸' },
      { id: 'C', label: 'C', text: '自动保存文件' }, { id: 'D', label: 'D', text: '自动分享链接' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'Figma中 Frame 与 Group 的关键区别是？', options: [
      { id: 'A', label: 'A', text: '没有区别' }, { id: 'B', label: 'B', text: 'Frame 可设置独立尺寸、裁剪和约束，Group 不行' },
      { id: 'C', label: 'C', text: 'Group 性能更好' }, { id: 'D', label: 'D', text: 'Frame 不能嵌套' },
    ], answer: ['B'] },
  ],
  '组件系统设计': [
    { id: 1, type: 'single', text: 'Figma组件(Component)的实例(Instance)修改后，主组件更新时会？', options: [
      { id: 'A', label: 'A', text: '实例不受影响' }, { id: 'B', label: 'B', text: '未覆写的属性跟随更新，覆写的属性保留' },
      { id: 'C', label: 'C', text: '实例被完全重置' }, { id: 'D', label: 'D', text: '需手动同步' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: '原子化设计(Atomic Design)中"分子(Molecules)"是指？', options: [
      { id: 'A', label: 'A', text: '最小设计元素' }, { id: 'B', label: 'B', text: '由多个原子组合成的简单功能组件' },
      { id: 'C', label: 'C', text: '完整页面' }, { id: 'D', label: 'D', text: '页面模板' },
    ], answer: ['B'] },
  ],
  '响应式设计原则': [
    { id: 1, type: 'single', text: '响应式设计中，断点(Breakpoint)是指？', options: [
      { id: 'A', label: 'A', text: '代码出错的位置' }, { id: 'B', label: 'B', text: '布局发生变化的屏幕宽度临界值' },
      { id: 'C', label: 'C', text: '网络中断点' }, { id: 'D', label: 'D', text: '用户退出的页面' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'Mobile First 设计策略是指？', options: [
      { id: 'A', label: 'A', text: '只设计手机端' }, { id: 'B', label: 'B', text: '先从移动端设计，再逐步扩展到大屏' },
      { id: 'C', label: 'C', text: '手机端上线更快' }, { id: 'D', label: 'D', text: '移动端用户更多' },
    ], answer: ['B'] },
  ],

  // ─── 高级UI/UX设计实战 ─── 交互设计进阶 ──────────────────────────────────
  '交互原型制作': [
    { id: 1, type: 'single', text: '低保真原型和高保真原型的核心区别是？', options: [
      { id: 'A', label: 'A', text: '工具不同' }, { id: 'B', label: 'B', text: '低保真聚焦流程逻辑，高保真接近最终视觉和交互' },
      { id: 'C', label: 'C', text: '高保真更便宜' }, { id: 'D', label: 'D', text: '低保真不需要用户测试' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'Figma原型中，Trigger(触发器)的作用是？', options: [
      { id: 'A', label: 'A', text: '定义何种用户操作启动交互' }, { id: 'B', label: 'B', text: '定义颜色' },
      { id: 'C', label: 'C', text: '生成代码' }, { id: 'D', label: 'D', text: '导出图片' },
    ], answer: ['A'] },
  ],
  '动效设计基础': [
    { id: 1, type: 'single', text: '动效设计的12条迪士尼动画原则中，"缓入缓出"(Ease In/Out)的作用是？', options: [
      { id: 'A', label: 'A', text: '让动画加速到最大' }, { id: 'B', label: 'B', text: '模拟物理运动，让动画更自然' },
      { id: 'C', label: 'C', text: '延长动画时间' }, { id: 'D', label: 'D', text: '减少帧率' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'UI动效持续时间通常建议在什么范围内？', options: [
      { id: 'A', label: 'A', text: '100-500毫秒' }, { id: 'B', label: 'B', text: '1-3秒' },
      { id: 'C', label: 'C', text: '5-10秒' }, { id: 'D', label: 'D', text: '无所谓' },
    ], answer: ['A'] },
  ],
  '可用性测试方法': [
    { id: 1, type: 'single', text: '可用性测试中"出声思考法"(Think Aloud)是指？', options: [
      { id: 'A', label: 'A', text: '测试者大声朗读文本' }, { id: 'B', label: 'B', text: '用户操作时口述自己的想法和感受' },
      { id: 'C', label: 'C', text: '团队讨论设计方案' }, { id: 'D', label: 'D', text: '语音控制界面' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'SUS(系统可用性量表)满分是多少？', options: [
      { id: 'A', label: 'A', text: '50分' }, { id: 'B', label: 'B', text: '100分' },
      { id: 'C', label: 'C', text: '10分' }, { id: 'D', label: 'D', text: '没有上限' },
    ], answer: ['B'] },
  ],
  '设计评审与迭代': [
    { id: 1, type: 'single', text: '设计评审的最佳参与人群是？', options: [
      { id: 'A', label: 'A', text: '仅设计师' }, { id: 'B', label: 'B', text: '产品、设计、开发等多角色跨职能团队' },
      { id: 'C', label: 'C', text: '仅管理层' }, { id: 'D', label: 'D', text: '仅客户' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: '敏捷迭代中，设计Sprint通常持续多长时间？', options: [
      { id: 'A', label: 'A', text: '1天' }, { id: 'B', label: 'B', text: '1-2周' },
      { id: 'C', label: 'C', text: '3个月' }, { id: 'D', label: 'D', text: '1年' },
    ], answer: ['B'] },
  ],

  // ─── 高级UI/UX设计实战 ─── 实战项目 ──────────────────────────────────
  'App设计全流程': [
    { id: 1, type: 'single', text: 'App设计的第一步通常是？', options: [
      { id: 'A', label: 'A', text: '打开Figma画界面' }, { id: 'B', label: 'B', text: '用户调研和需求分析' },
      { id: 'C', label: 'C', text: '选择配色方案' }, { id: 'D', label: 'D', text: '发布上线' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: '竞品分析的主要目的是？', options: [
      { id: 'A', label: 'A', text: '抄袭竞品设计' }, { id: 'B', label: 'B', text: '了解市场现状和差异化机会' },
      { id: 'C', label: 'C', text: '统计竞品数量' }, { id: 'D', label: 'D', text: '联系竞品公司' },
    ], answer: ['B'] },
  ],
  '设计稿交付规范': [
    { id: 1, type: 'single', text: '切图(Slice)交付时，iOS @2x 图标应输出多大？', options: [
      { id: 'A', label: 'A', text: '原始尺寸' }, { id: 'B', label: 'B', text: '2倍于设计稿的逻辑像素尺寸' },
      { id: 'C', label: 'C', text: '3倍' }, { id: 'D', label: 'D', text: '0.5倍' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: '设计交付标注中最重要的信息是？', options: [
      { id: 'A', label: 'A', text: '设计师签名' }, { id: 'B', label: 'B', text: '间距、字号、色值等精确数值' },
      { id: 'C', label: 'C', text: '设计灵感来源' }, { id: 'D', label: 'D', text: '项目预算' },
    ], answer: ['B'] },
  ],
  '作品集整理': [
    { id: 1, type: 'single', text: '设计作品集中，每个案例最应突出展示的是？', options: [
      { id: 'A', label: 'A', text: '最终效果图' }, { id: 'B', label: 'B', text: '设计思考过程和问题解决能力' },
      { id: 'C', label: 'C', text: '使用工具列表' }, { id: 'D', label: 'D', text: '工作时长' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: '作品集建议放多少个案例？', options: [
      { id: 'A', label: 'A', text: '越多越好' }, { id: 'B', label: 'B', text: '3-5个精品案例' },
      { id: 'C', label: 'C', text: '1个' }, { id: 'D', label: 'D', text: '10个以上' },
    ], answer: ['B'] },
  ],
  '结课答辩': [
    { id: 1, type: 'single', text: '答辩演示中，开场最应该做什么？', options: [
      { id: 'A', label: 'A', text: '展示所有页面' }, { id: 'B', label: 'B', text: '明确项目背景、目标和要解决的问题' },
      { id: 'C', label: 'C', text: '感谢评委' }, { id: 'D', label: 'D', text: '展示工具技能' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: '答辩中面对质疑时，最佳回应方式是？', options: [
      { id: 'A', label: 'A', text: '坚持自己是对的' }, { id: 'B', label: 'B', text: '先认可问题，再用数据或逻辑解释设计决策' },
      { id: 'C', label: 'C', text: '回避问题' }, { id: 'D', label: 'D', text: '反问评委' },
    ], answer: ['B'] },
  ],

  // ─── 全栈开发：React+Node ─── React 核心基础 ──────────────────────────────
  'JSX 与组件基础': [
    { id: 1, type: 'single', text: 'JSX中，HTML class 属性应该写成？', options: [
      { id: 'A', label: 'A', text: 'class' }, { id: 'B', label: 'B', text: 'className' },
      { id: 'C', label: 'C', text: 'cssClass' }, { id: 'D', label: 'D', text: 'htmlClass' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'React函数组件与类组件的主要区别是？', options: [
      { id: 'A', label: 'A', text: '函数组件不能管理状态' }, { id: 'B', label: 'B', text: '函数组件更简洁，使用Hooks管理状态和副作用' },
      { id: 'C', label: 'C', text: '类组件性能更好' }, { id: 'D', label: 'D', text: '没有区别' },
    ], answer: ['B'] },
  ],
  'State 与 Props': [
    { id: 1, type: 'single', text: 'React中 Props 是？', options: [
      { id: 'A', label: 'A', text: '组件内部可变状态' }, { id: 'B', label: 'B', text: '父组件传递给子组件的只读数据' },
      { id: 'C', label: 'C', text: '全局变量' }, { id: 'D', label: 'D', text: '样式属性' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: '为什么不能直接修改 state（如 state.count = 1）？', options: [
      { id: 'A', label: 'A', text: '语法错误' }, { id: 'B', label: 'B', text: '直接修改不会触发重渲染' },
      { id: 'C', label: 'C', text: '会导致内存泄漏' }, { id: 'D', label: 'D', text: '可以直接修改' },
    ], answer: ['B'] },
  ],
  'React Hooks 深入': [
    { id: 1, type: 'single', text: 'useCallback 的作用是？', options: [
      { id: 'A', label: 'A', text: '缓存计算结果' }, { id: 'B', label: 'B', text: '缓存函数引用，避免子组件不必要的重渲染' },
      { id: 'C', label: 'C', text: '回调函数注册' }, { id: 'D', label: 'D', text: '异步请求' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'useRef 的值变化时会触发重渲染吗？', options: [
      { id: 'A', label: 'A', text: '会' }, { id: 'B', label: 'B', text: '不会' },
      { id: 'C', label: 'C', text: '仅在类组件中会' }, { id: 'D', label: 'D', text: '取决于依赖数组' },
    ], answer: ['B'] },
  ],
  '路由与导航': [
    { id: 1, type: 'single', text: 'React Router 中 <Link> 与 <a> 标签的区别是？', options: [
      { id: 'A', label: 'A', text: '完全相同' }, { id: 'B', label: 'B', text: 'Link 不会刷新页面，实现客户端路由导航' },
      { id: 'C', label: 'C', text: 'a 标签性能更好' }, { id: 'D', label: 'D', text: 'Link 只能用于外部链接' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'useNavigate() Hook 的用途是？', options: [
      { id: 'A', label: 'A', text: '获取URL参数' }, { id: 'B', label: 'B', text: '在代码中编程式地跳转路由' },
      { id: 'C', label: 'C', text: '定义路由配置' }, { id: 'D', label: 'D', text: '监听浏览器后退' },
    ], answer: ['B'] },
  ],

  // ─── 全栈开发：React+Node ─── Node.js 服务端开发 ──────────────────────────
  'Node.js 入门': [
    { id: 1, type: 'single', text: 'Node.js 使用的 JavaScript 引擎是？', options: [
      { id: 'A', label: 'A', text: 'SpiderMonkey' }, { id: 'B', label: 'B', text: 'V8' },
      { id: 'C', label: 'C', text: 'JavaScriptCore' }, { id: 'D', label: 'D', text: 'Chakra' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'npm init 命令的作用是？', options: [
      { id: 'A', label: 'A', text: '安装所有依赖' }, { id: 'B', label: 'B', text: '初始化 package.json 项目配置文件' },
      { id: 'C', label: 'C', text: '启动服务器' }, { id: 'D', label: 'D', text: '发布包到npm' },
    ], answer: ['B'] },
  ],
  'Express 框架基础': [
    { id: 1, type: 'single', text: 'Express 中 app.get(\'/api/users\', handler) 定义的是？', options: [
      { id: 'A', label: 'A', text: '一个GET请求路由处理器' }, { id: 'B', label: 'B', text: '一个POST请求' },
      { id: 'C', label: 'C', text: '一个中间件' }, { id: 'D', label: 'D', text: '一个数据库查询' },
    ], answer: ['A'] },
    { id: 2, type: 'single', text: 'Express 中 req.body 默认为 undefined，需要使用什么来解析请求体？', options: [
      { id: 'A', label: 'A', text: 'express.static()' }, { id: 'B', label: 'B', text: 'express.json() 中间件' },
      { id: 'C', label: 'C', text: 'express.urlencoded()' }, { id: 'D', label: 'D', text: 'express.Router()' },
    ], answer: ['B'] },
  ],
  'RESTful API 设计': [
    { id: 1, type: 'single', text: 'RESTful API 中，DELETE /users/123 表示？', options: [
      { id: 'A', label: 'A', text: '查询id为123的用户' }, { id: 'B', label: 'B', text: '删除id为123的用户' },
      { id: 'C', label: 'C', text: '更新用户' }, { id: 'D', label: 'D', text: '创建用户' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'HTTP 状态码 201 表示？', options: [
      { id: 'A', label: 'A', text: '请求成功' }, { id: 'B', label: 'B', text: '资源已成功创建' },
      { id: 'C', label: 'C', text: '未找到资源' }, { id: 'D', label: 'D', text: '服务器错误' },
    ], answer: ['B'] },
  ],
  '中间件与认证': [
    { id: 1, type: 'single', text: 'Express 中间件中 next() 的作用是？', options: [
      { id: 'A', label: 'A', text: '返回响应' }, { id: 'B', label: 'B', text: '将控制权传递给下一个中间件或路由' },
      { id: 'C', label: 'C', text: '跳过所有中间件' }, { id: 'D', label: 'D', text: '重启服务器' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'JWT Token 通常放在 HTTP 请求的哪里？', options: [
      { id: 'A', label: 'A', text: 'URL参数' }, { id: 'B', label: 'B', text: 'Authorization Header (Bearer Token)' },
      { id: 'C', label: 'C', text: '请求体' }, { id: 'D', label: 'D', text: 'Cookie 和 Header 都可以' },
    ], answer: ['D'] },
  ],

  // ─── 全栈开发：React+Node ─── 数据库与全栈整合 ────────────────────────────
  'MySQL 基础操作': [
    { id: 1, type: 'single', text: 'SQL 中 SELECT * FROM users WHERE age > 18 的作用是？', options: [
      { id: 'A', label: 'A', text: '创建表' }, { id: 'B', label: 'B', text: '查询年龄大于18的所有用户' },
      { id: 'C', label: 'C', text: '删除用户' }, { id: 'D', label: 'D', text: '更新用户年龄' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: '主键(Primary Key)的特点是？', options: [
      { id: 'A', label: 'A', text: '可以为NULL' }, { id: 'B', label: 'B', text: '唯一标识每条记录，不允许NULL和重复' },
      { id: 'C', label: 'C', text: '一张表可以有多个主键' }, { id: 'D', label: 'D', text: '仅用于排序' },
    ], answer: ['B'] },
  ],
  'Prisma ORM 入门': [
    { id: 1, type: 'single', text: 'Prisma Schema 中 @id 注解的作用是？', options: [
      { id: 'A', label: 'A', text: '定义索引' }, { id: 'B', label: 'B', text: '标记字段为主键' },
      { id: 'C', label: 'C', text: '设置默认值' }, { id: 'D', label: 'D', text: '定义关联' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'prisma.user.findMany({ where: { age: { gt: 18 } } }) 等价于什么SQL？', options: [
      { id: 'A', label: 'A', text: 'SELECT * FROM user' }, { id: 'B', label: 'B', text: 'SELECT * FROM user WHERE age > 18' },
      { id: 'C', label: 'C', text: 'DELETE FROM user WHERE age > 18' }, { id: 'D', label: 'D', text: 'UPDATE user SET age = 18' },
    ], answer: ['B'] },
  ],
  '前后端联调': [
    { id: 1, type: 'single', text: 'CORS(跨域资源共享)错误出现的原因是？', options: [
      { id: 'A', label: 'A', text: '服务器宕机' }, { id: 'B', label: 'B', text: '浏览器阻止了不同源之间的请求' },
      { id: 'C', label: 'C', text: 'URL拼写错误' }, { id: 'D', label: 'D', text: '网络断开' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: '前后端联调时，最常用的API调试工具是？', options: [
      { id: 'A', label: 'A', text: 'Figma' }, { id: 'B', label: 'B', text: 'Postman / Insomnia' },
      { id: 'C', label: 'C', text: 'Photoshop' }, { id: 'D', label: 'D', text: 'Excel' },
    ], answer: ['B'] },
  ],
  '部署与上线': [
    { id: 1, type: 'single', text: 'Docker 的核心作用是？', options: [
      { id: 'A', label: 'A', text: '代码版本管理' }, { id: 'B', label: 'B', text: '将应用及其依赖打包成可移植的容器' },
      { id: 'C', label: 'C', text: '数据库管理' }, { id: 'D', label: 'D', text: 'UI设计' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'CI/CD 中的 CD 代表什么？', options: [
      { id: 'A', label: 'A', text: 'Continuous Design' }, { id: 'B', label: 'B', text: 'Continuous Delivery / Deployment' },
      { id: 'C', label: 'C', text: 'Code Debug' }, { id: 'D', label: 'D', text: 'Cloud Database' },
    ], answer: ['B'] },
  ],

  // ─── 全栈开发：React+Node ─── 进阶专题 ──────────────────────────────────
  'TypeScript 实战': [
    { id: 1, type: 'single', text: 'TypeScript 中 unknown 与 any 的区别是？', options: [
      { id: 'A', label: 'A', text: '完全相同' }, { id: 'B', label: 'B', text: 'unknown 需要类型检查后才能操作，any 跳过所有检查' },
      { id: 'C', label: 'C', text: 'any 更安全' }, { id: 'D', label: 'D', text: 'unknown 是旧版语法' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'TypeScript 泛型(Generics)的主要作用是？', options: [
      { id: 'A', label: 'A', text: '加快运行速度' }, { id: 'B', label: 'B', text: '编写可复用且类型安全的代码' },
      { id: 'C', label: 'C', text: '替代接口' }, { id: 'D', label: 'D', text: '减少文件体积' },
    ], answer: ['B'] },
  ],
  'React 状态管理 (Zustand)': [
    { id: 1, type: 'single', text: 'Zustand 创建 store 使用的函数是？', options: [
      { id: 'A', label: 'A', text: 'createStore()' }, { id: 'B', label: 'B', text: 'create()' },
      { id: 'C', label: 'C', text: 'useStore()' }, { id: 'D', label: 'D', text: 'new Store()' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'Zustand 相比 Context API 的优势是？', options: [
      { id: 'A', label: 'A', text: '官方内置' }, { id: 'B', label: 'B', text: '不会导致无关组件重渲染，性能更好' },
      { id: 'C', label: 'C', text: '语法更复杂' }, { id: 'D', label: 'D', text: '需要Provider' },
    ], answer: ['B'] },
  ],
  '性能优化': [
    { id: 1, type: 'single', text: 'React 中代码分割(Code Splitting)的主要手段是？', options: [
      { id: 'A', label: 'A', text: '删除代码' }, { id: 'B', label: 'B', text: 'React.lazy() + Suspense 动态导入' },
      { id: 'C', label: 'C', text: '缩小字体' }, { id: 'D', label: 'D', text: '压缩图片' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'React DevTools Profiler 的作用是？', options: [
      { id: 'A', label: 'A', text: '编写单元测试' }, { id: 'B', label: 'B', text: '可视化分析组件渲染性能和耗时' },
      { id: 'C', label: 'C', text: '管理路由' }, { id: 'D', label: 'D', text: '部署应用' },
    ], answer: ['B'] },
  ],
  '实战项目答辩': [
    { id: 1, type: 'single', text: '全栈项目答辩中，应优先展示的是？', options: [
      { id: 'A', label: 'A', text: '每行代码的解释' }, { id: 'B', label: 'B', text: '系统架构、核心功能演示和技术亮点' },
      { id: 'C', label: 'C', text: '使用的库的数量' }, { id: 'D', label: 'D', text: '代码行数' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'README.md 文档中最应包含的信息是？', options: [
      { id: 'A', label: 'A', text: '个人简历' }, { id: 'B', label: 'B', text: '项目介绍、安装步骤、使用说明和技术栈' },
      { id: 'C', label: 'C', text: '设计稿' }, { id: 'D', label: 'D', text: '数据库密码' },
    ], answer: ['B'] },
  ],

  // ─── 零基础Python自动化 ─── Python 基础语法 ────────────────────────────────
  'Python 环境与基础语法': [
    { id: 1, type: 'single', text: 'Python 中用于输出内容到控制台的函数是？', options: [
      { id: 'A', label: 'A', text: 'echo()' }, { id: 'B', label: 'B', text: 'print()' },
      { id: 'C', label: 'C', text: 'console.log()' }, { id: 'D', label: 'D', text: 'puts()' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'Python 的代码缩进(Indentation)的作用是？', options: [
      { id: 'A', label: 'A', text: '美观' }, { id: 'B', label: 'B', text: '定义代码块的层级结构，是语法的一部分' },
      { id: 'C', label: 'C', text: '可选的' }, { id: 'D', label: 'D', text: '仅用于注释' },
    ], answer: ['B'] },
  ],
  '数据类型与变量': [
    { id: 1, type: 'single', text: 'Python 中 type(3.14) 返回什么？', options: [
      { id: 'A', label: 'A', text: 'int' }, { id: 'B', label: 'B', text: 'float' },
      { id: 'C', label: 'C', text: 'str' }, { id: 'D', label: 'D', text: 'double' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'Python 中字典(dict)的键有什么要求？', options: [
      { id: 'A', label: 'A', text: '必须是字符串' }, { id: 'B', label: 'B', text: '必须是可哈希(不可变)的类型' },
      { id: 'C', label: 'C', text: '必须是整数' }, { id: 'D', label: 'D', text: '没有限制' },
    ], answer: ['B'] },
  ],
  '流程控制': [
    { id: 1, type: 'single', text: 'Python for 循环中 break 的作用是？', options: [
      { id: 'A', label: 'A', text: '跳过当前迭代' }, { id: 'B', label: 'B', text: '立即终止整个循环' },
      { id: 'C', label: 'C', text: '重启循环' }, { id: 'D', label: 'D', text: '暂停循环' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'Python 中 elif 关键字等价于其他语言的？', options: [
      { id: 'A', label: 'A', text: 'else' }, { id: 'B', label: 'B', text: 'else if' },
      { id: 'C', label: 'C', text: 'switch case' }, { id: 'D', label: 'D', text: 'while' },
    ], answer: ['B'] },
  ],
  '函数与模块': [
    { id: 1, type: 'single', text: 'Python 中 **kwargs 接收的是什么类型的参数？', options: [
      { id: 'A', label: 'A', text: '位置参数' }, { id: 'B', label: 'B', text: '关键字参数(字典形式)' },
      { id: 'C', label: 'C', text: '列表参数' }, { id: 'D', label: 'D', text: '默认参数' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'from math import sqrt 的作用是？', options: [
      { id: 'A', label: 'A', text: '导入math模块所有内容' }, { id: 'B', label: 'B', text: '仅从math模块导入sqrt函数' },
      { id: 'C', label: 'C', text: '安装math库' }, { id: 'D', label: 'D', text: '创建math模块' },
    ], answer: ['B'] },
  ],

  // ─── 零基础Python自动化 ─── 自动化实战 ────────────────────────────────────
  '文件与目录操作': [
    { id: 1, type: 'single', text: 'Python 中 with open() as f: 语法的优势是？', options: [
      { id: 'A', label: 'A', text: '更快' }, { id: 'B', label: 'B', text: '自动管理文件关闭，防止资源泄漏' },
      { id: 'C', label: 'C', text: '可以打开多个文件' }, { id: 'D', label: 'D', text: '只读模式' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'os.listdir() 的作用是？', options: [
      { id: 'A', label: 'A', text: '创建目录' }, { id: 'B', label: 'B', text: '列出指定目录下的所有文件和文件夹' },
      { id: 'C', label: 'C', text: '删除目录' }, { id: 'D', label: 'D', text: '读取文件内容' },
    ], answer: ['B'] },
  ],
  '网络爬虫基础': [
    { id: 1, type: 'single', text: 'HTTP GET 请求与 POST 请求的核心区别是？', options: [
      { id: 'A', label: 'A', text: '速度不同' }, { id: 'B', label: 'B', text: 'GET 用于获取数据，POST 用于提交数据' },
      { id: 'C', label: 'C', text: '没有区别' }, { id: 'D', label: 'D', text: 'GET 更安全' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'robots.txt 文件的作用是？', options: [
      { id: 'A', label: 'A', text: '存储网站数据' }, { id: 'B', label: 'B', text: '声明哪些页面允许或禁止爬虫访问' },
      { id: 'C', label: 'C', text: '网站的CSS样式' }, { id: 'D', label: 'D', text: '用户登录配置' },
    ], answer: ['B'] },
  ],
  '定时任务与批处理': [
    { id: 1, type: 'single', text: 'crontab 表达式 "0 9 * * 1" 代表什么时间？', options: [
      { id: 'A', label: 'A', text: '每天9点' }, { id: 'B', label: 'B', text: '每周一上午9:00' },
      { id: 'C', label: 'C', text: '每月1号9点' }, { id: 'D', label: 'D', text: '每9分钟' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'Python schedule 库的核心设计理念是？', options: [
      { id: 'A', label: 'A', text: '多线程并发' }, { id: 'B', label: 'B', text: '人类可读的时间调度语法' },
      { id: 'C', label: 'C', text: '替代操作系统crontab' }, { id: 'D', label: 'D', text: '数据库定时备份' },
    ], answer: ['B'] },
  ],
  'Excel 自动化处理': [
    { id: 1, type: 'single', text: 'openpyxl 中 wb.active 返回的是？', options: [
      { id: 'A', label: 'A', text: '工作簿名称' }, { id: 'B', label: 'B', text: '当前活动的工作表(sheet)' },
      { id: 'C', label: 'C', text: '所有单元格' }, { id: 'D', label: 'D', text: '文件路径' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: '用 pandas 的 read_excel() 和 to_excel() 处理Excel的优势是？', options: [
      { id: 'A', label: 'A', text: '界面更漂亮' }, { id: 'B', label: 'B', text: '可以方便地进行数据清洗、分析后再导出' },
      { id: 'C', label: 'C', text: '只能读不能写' }, { id: 'D', label: 'D', text: '只支持xlsx格式' },
    ], answer: ['B'] },
  ],

  // ─── 零基础Python自动化 ─── 综合项目 ──────────────────────────────────────
  '项目规划与设计': [
    { id: 1, type: 'single', text: '软件项目规划中，需求分析的目标是？', options: [
      { id: 'A', label: 'A', text: '选择编程语言' }, { id: 'B', label: 'B', text: '明确要解决什么问题和功能范围' },
      { id: 'C', label: 'C', text: '编写代码' }, { id: 'D', label: 'D', text: '部署上线' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: '技术方案选型时最应优先考虑的因素是？', options: [
      { id: 'A', label: 'A', text: '技术最新' }, { id: 'B', label: 'B', text: '是否适合当前问题场景和团队能力' },
      { id: 'C', label: 'C', text: '流行度' }, { id: 'D', label: 'D', text: 'GitHub Star数' },
    ], answer: ['B'] },
  ],
  '代码实现': [
    { id: 1, type: 'single', text: 'Git 中 git commit 的作用是？', options: [
      { id: 'A', label: 'A', text: '推送代码到远程' }, { id: 'B', label: 'B', text: '将暂存区的修改保存为一个版本快照' },
      { id: 'C', label: 'C', text: '下载远程代码' }, { id: 'D', label: 'D', text: '创建分支' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: '函数命名采用 snake_case 风格的语言是？', options: [
      { id: 'A', label: 'A', text: 'Java' }, { id: 'B', label: 'B', text: 'Python' },
      { id: 'C', label: 'C', text: 'C#' }, { id: 'D', label: 'D', text: 'JavaScript' },
    ], answer: ['B'] },
  ],
  '测试与调试': [
    { id: 1, type: 'single', text: 'Python unittest 中 assertEqual(a, b) 的作用是？', options: [
      { id: 'A', label: 'A', text: '赋值' }, { id: 'B', label: 'B', text: '断言 a 和 b 相等，不等则测试失败' },
      { id: 'C', label: 'C', text: '打印a和b' }, { id: 'D', label: 'D', text: '比较大小' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'pdb 调试器中 n(next) 命令的作用是？', options: [
      { id: 'A', label: 'A', text: '退出调试' }, { id: 'B', label: 'B', text: '执行下一行代码' },
      { id: 'C', label: 'C', text: '查看变量' }, { id: 'D', label: 'D', text: '设置断点' },
    ], answer: ['B'] },
  ],
  '项目展示': [
    { id: 1, type: 'single', text: '技术项目展示中，demo演示最重要的原则是？', options: [
      { id: 'A', label: 'A', text: '展示所有代码' }, { id: 'B', label: 'B', text: '聚焦核心功能，展示完整用户故事' },
      { id: 'C', label: 'C', text: '越长越好' }, { id: 'D', label: 'D', text: '只用PPT不演示' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: '项目总结中应重点反思的是？', options: [
      { id: 'A', label: 'A', text: '使用了多少个库' }, { id: 'B', label: 'B', text: '遇到了什么问题、如何解决、学到了什么' },
      { id: 'C', label: 'C', text: '花了多少时间' }, { id: 'D', label: 'D', text: '代码量' },
    ], answer: ['B'] },
  ],

  // ─── 数据分析与可视化 ─── 数据分析基础 ────────────────────────────────────
  'NumPy 核心操作': [
    { id: 1, type: 'single', text: 'NumPy 数组相比 Python 列表的主要优势是？', options: [
      { id: 'A', label: 'A', text: '语法更简单' }, { id: 'B', label: 'B', text: '底层C实现，向量化运算速度快数十倍' },
      { id: 'C', label: 'C', text: '支持字符串操作' }, { id: 'D', label: 'D', text: '自带可视化' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'np.reshape() 的作用是？', options: [
      { id: 'A', label: 'A', text: '删除元素' }, { id: 'B', label: 'B', text: '改变数组形状而不改变数据' },
      { id: 'C', label: 'C', text: '排序数组' }, { id: 'D', label: 'D', text: '合并数组' },
    ], answer: ['B'] },
  ],
  'Pandas 数据处理': [
    { id: 1, type: 'single', text: 'Pandas 中 DataFrame 和 Series 的关系是？', options: [
      { id: 'A', label: 'A', text: '完全无关' }, { id: 'B', label: 'B', text: 'DataFrame 由多个 Series 组成（每列一个）' },
      { id: 'C', label: 'C', text: 'Series 包含 DataFrame' }, { id: 'D', label: 'D', text: '都是标量' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'df.head(10) 的作用是？', options: [
      { id: 'A', label: 'A', text: '删除前10行' }, { id: 'B', label: 'B', text: '返回前10行数据用于快速预览' },
      { id: 'C', label: 'C', text: '排序前10行' }, { id: 'D', label: 'D', text: '选择第10列' },
    ], answer: ['B'] },
  ],
  '数据清洗技巧': [
    { id: 1, type: 'single', text: 'Pandas 中 dropna() 的作用是？', options: [
      { id: 'A', label: 'A', text: '填充缺失值' }, { id: 'B', label: 'B', text: '删除包含缺失值的行或列' },
      { id: 'C', label: 'C', text: '查找缺失值' }, { id: 'D', label: 'D', text: '替换特定值' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: '处理重复数据时 df.duplicated() 返回的是？', options: [
      { id: 'A', label: 'A', text: '重复行的DataFrame' }, { id: 'B', label: 'B', text: '布尔Series，True表示该行是重复的' },
      { id: 'C', label: 'C', text: '重复行的数量' }, { id: 'D', label: 'D', text: '去重后的DataFrame' },
    ], answer: ['B'] },
  ],
  '数据聚合与分组': [
    { id: 1, type: 'single', text: 'df.groupby("city").agg({"sales": "sum"}) 的含义是？', options: [
      { id: 'A', label: 'A', text: '按城市排序' }, { id: 'B', label: 'B', text: '按城市分组后计算每组的销售额总和' },
      { id: 'C', label: 'C', text: '筛选城市列' }, { id: 'D', label: 'D', text: '合并数据' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'Pandas 中 pivot_table() 的作用是？', options: [
      { id: 'A', label: 'A', text: '旋转图片' }, { id: 'B', label: 'B', text: '创建交叉汇总的透视表' },
      { id: 'C', label: 'C', text: '转置DataFrame' }, { id: 'D', label: 'D', text: '合并多个表' },
    ], answer: ['B'] },
  ],

  // ─── 数据分析与可视化 ─── 数据可视化 ──────────────────────────────────────
  'Matplotlib 基础绘图': [
    { id: 1, type: 'single', text: 'plt.show() 的作用是？', options: [
      { id: 'A', label: 'A', text: '保存图片' }, { id: 'B', label: 'B', text: '在窗口中渲染并显示当前图表' },
      { id: 'C', label: 'C', text: '关闭图表' }, { id: 'D', label: 'D', text: '创建新图表' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'plt.savefig("chart.png", dpi=300) 中 dpi 参数的作用是？', options: [
      { id: 'A', label: 'A', text: '设置颜色深度' }, { id: 'B', label: 'B', text: '设置导出图片的分辨率(每英寸像素)' },
      { id: 'C', label: 'C', text: '设置图表大小' }, { id: 'D', label: 'D', text: '设置字体大小' },
    ], answer: ['B'] },
  ],
  'Seaborn 统计图表': [
    { id: 1, type: 'single', text: 'sns.heatmap() 最适合展示什么数据？', options: [
      { id: 'A', label: 'A', text: '时间序列' }, { id: 'B', label: 'B', text: '相关性矩阵或二维数值分布' },
      { id: 'C', label: 'C', text: '分类数量' }, { id: 'D', label: 'D', text: '文件大小' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'Seaborn 中 sns.set_theme() 的作用是？', options: [
      { id: 'A', label: 'A', text: '设置数据主题' }, { id: 'B', label: 'B', text: '全局设置图表的视觉风格和配色' },
      { id: 'C', label: 'C', text: '创建主题报告' }, { id: 'D', label: 'D', text: '重置数据' },
    ], answer: ['B'] },
  ],
  '交互式图表 (Plotly)': [
    { id: 1, type: 'single', text: 'Plotly Express(px)相比 Plotly Graph Objects(go) 的特点是？', options: [
      { id: 'A', label: 'A', text: '功能更多' }, { id: 'B', label: 'B', text: '语法更简洁，一行代码快速创建图表' },
      { id: 'C', label: 'C', text: '性能更好' }, { id: 'D', label: 'D', text: '不支持交互' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'Plotly Dash 框架的用途是？', options: [
      { id: 'A', label: 'A', text: '数据清洗' }, { id: 'B', label: 'B', text: '构建交互式数据仪表盘Web应用' },
      { id: 'C', label: 'C', text: '训练机器学习模型' }, { id: 'D', label: 'D', text: '替代Excel' },
    ], answer: ['B'] },
  ],
  '商业报表制作': [
    { id: 1, type: 'single', text: '商业报表中"对比"最有效的可视化方式是？', options: [
      { id: 'A', label: 'A', text: '饼图' }, { id: 'B', label: 'B', text: '柱状图(分组或堆叠)' },
      { id: 'C', label: 'C', text: '折线图' }, { id: 'D', label: 'D', text: '散点图' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: '数据可视化中"墨水比"(Data-ink ratio)原则是？', options: [
      { id: 'A', label: 'A', text: '用更多墨水' }, { id: 'B', label: 'B', text: '最大化数据信息量，减少非必要的装饰元素' },
      { id: 'C', label: 'C', text: '使用彩色打印' }, { id: 'D', label: 'D', text: '加粗所有文字' },
    ], answer: ['B'] },
  ],

  // ─── 数据分析与可视化 ─── 实战与项目 ──────────────────────────────────────
  '电商数据分析': [
    { id: 1, type: 'single', text: '电商中GMV(Gross Merchandise Volume)是指？', options: [
      { id: 'A', label: 'A', text: '利润' }, { id: 'B', label: 'B', text: '网站成交总额(含退款前)' },
      { id: 'C', label: 'C', text: '访客数' }, { id: 'D', label: 'D', text: '商品数量' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: '电商漏斗分析中，从"加购"到"支付"的转化率低，可能原因是？', options: [
      { id: 'A', label: 'A', text: '商品太好了' }, { id: 'B', label: 'B', text: '支付流程复杂、运费过高或缺少支付方式' },
      { id: 'C', label: 'C', text: '图片太好看' }, { id: 'D', label: 'D', text: '访问量太高' },
    ], answer: ['B'] },
  ],
  '用户行为分析': [
    { id: 1, type: 'single', text: '次日留存率的计算公式是？', options: [
      { id: 'A', label: 'A', text: '当日新增用户数/总用户数' }, { id: 'B', label: 'B', text: '第二天仍活跃的新用户数/当日新增用户数' },
      { id: 'C', label: 'C', text: '月活/日活' }, { id: 'D', label: 'D', text: '付费用户数/总用户数' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: '用户分群(User Segmentation)的主要目的是？', options: [
      { id: 'A', label: 'A', text: '减少用户数量' }, { id: 'B', label: 'B', text: '针对不同群体制定差异化运营策略' },
      { id: 'C', label: 'C', text: '删除不活跃用户' }, { id: 'D', label: 'D', text: '统一所有用户体验' },
    ], answer: ['B'] },
  ],
  '数据报告撰写': [
    { id: 1, type: 'single', text: '数据报告的"Executive Summary"应该放在？', options: [
      { id: 'A', label: 'A', text: '最后面' }, { id: 'B', label: 'B', text: '最前面，让读者快速了解核心结论' },
      { id: 'C', label: 'C', text: '中间' }, { id: 'D', label: 'D', text: '附录' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: '数据报告中使用图表时，最重要的原则是？', options: [
      { id: 'A', label: 'A', text: '越炫酷越好' }, { id: 'B', label: 'B', text: '选择合适的图表类型，清晰传达数据洞察' },
      { id: 'C', label: 'C', text: '每页放10个图表' }, { id: 'D', label: 'D', text: '不加标题和标签' },
    ], answer: ['B'] },
  ],
  '结课报告展示': [
    { id: 1, type: 'single', text: '数据分析项目展示中，最能打动评审的是？', options: [
      { id: 'A', label: 'A', text: '图表数量' }, { id: 'B', label: 'B', text: '有价值的洞察和可落地的建议' },
      { id: 'C', label: 'C', text: '代码量' }, { id: 'D', label: 'D', text: '数据集大小' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: '展示中面对"数据准确性"质疑时，最佳回应是？', options: [
      { id: 'A', label: 'A', text: '忽略' }, { id: 'B', label: 'B', text: '说明数据来源、清洗过程和验证方法' },
      { id: 'C', label: 'C', text: '反驳' }, { id: 'D', label: 'D', text: '道歉' },
    ], answer: ['B'] },
  ],

  // ─── 人工智能基础与应用 ─── 机器学习基础 ──────────────────────────────────
  '什么是人工智能': [
    { id: 1, type: 'single', text: '人工智能(AI)、机器学习(ML)、深度学习(DL)的关系是？', options: [
      { id: 'A', label: 'A', text: '三者互不相关' }, { id: 'B', label: 'B', text: 'AI ⊃ ML ⊃ DL（层层包含关系）' },
      { id: 'C', label: 'C', text: 'DL包含AI' }, { id: 'D', label: 'D', text: '三者完全相同' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: '以下哪个是机器学习的典型应用？', options: [
      { id: 'A', label: 'A', text: '计算器' }, { id: 'B', label: 'B', text: '垃圾邮件过滤' },
      { id: 'C', label: 'C', text: 'HTML渲染' }, { id: 'D', label: 'D', text: '文件压缩' },
    ], answer: ['B'] },
  ],
  '监督学习原理': [
    { id: 1, type: 'single', text: '监督学习与无监督学习的核心区别是？', options: [
      { id: 'A', label: 'A', text: '算法不同' }, { id: 'B', label: 'B', text: '监督学习需要带标签的训练数据' },
      { id: 'C', label: 'C', text: '无监督学习更准确' }, { id: 'D', label: 'D', text: '监督学习不需要数据' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: '回归(Regression)与分类(Classification)的区别是？', options: [
      { id: 'A', label: 'A', text: '没有区别' }, { id: 'B', label: 'B', text: '回归预测连续值，分类预测离散类别' },
      { id: 'C', label: 'C', text: '分类只能二分类' }, { id: 'D', label: 'D', text: '回归更简单' },
    ], answer: ['B'] },
  ],
  'Scikit-learn 实践': [
    { id: 1, type: 'single', text: 'sklearn 中 fit() 方法的作用是？', options: [
      { id: 'A', label: 'A', text: '预测数据' }, { id: 'B', label: 'B', text: '用训练数据拟合/训练模型' },
      { id: 'C', label: 'C', text: '评估模型' }, { id: 'D', label: 'D', text: '数据预处理' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'sklearn Pipeline 的作用是？', options: [
      { id: 'A', label: 'A', text: '连接数据库' }, { id: 'B', label: 'B', text: '将预处理和模型训练串联成标准化流程' },
      { id: 'C', label: 'C', text: '并行训练模型' }, { id: 'D', label: 'D', text: '可视化结果' },
    ], answer: ['B'] },
  ],
  '模型评估与调优': [
    { id: 1, type: 'single', text: '交叉验证(Cross-Validation)的作用是？', options: [
      { id: 'A', label: 'A', text: '加速训练' }, { id: 'B', label: 'B', text: '更可靠地评估模型泛化能力' },
      { id: 'C', label: 'C', text: '减少数据量' }, { id: 'D', label: 'D', text: '选择特征' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'GridSearchCV 的用途是？', options: [
      { id: 'A', label: 'A', text: '搜索数据集' }, { id: 'B', label: 'B', text: '自动搜索最优超参数组合' },
      { id: 'C', label: 'C', text: '绘制网格图' }, { id: 'D', label: 'D', text: '清洗数据' },
    ], answer: ['B'] },
  ],

  // ─── 人工智能基础与应用 ─── 深度学习入门 ──────────────────────────────────
  '神经网络原理': [
    { id: 1, type: 'single', text: '人工神经元(Perceptron)的三个核心要素是？', options: [
      { id: 'A', label: 'A', text: '输入、CPU、输出' }, { id: 'B', label: 'B', text: '输入+权重、激活函数、输出' },
      { id: 'C', label: 'C', text: '数据、代码、结果' }, { id: 'D', label: 'D', text: '层、节点、边' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: '反向传播(Backpropagation)的作用是？', options: [
      { id: 'A', label: 'A', text: '从输出到输入传播数据' }, { id: 'B', label: 'B', text: '计算梯度并更新网络权重以减小损失' },
      { id: 'C', label: 'C', text: '增加网络层数' }, { id: 'D', label: 'D', text: '数据增强' },
    ], answer: ['B'] },
  ],
  'TensorFlow/Keras 基础': [
    { id: 1, type: 'single', text: 'Keras Sequential 模型中 model.compile() 需要指定什么？', options: [
      { id: 'A', label: 'A', text: '输入数据' }, { id: 'B', label: 'B', text: '优化器(optimizer)、损失函数(loss)和评估指标(metrics)' },
      { id: 'C', label: 'C', text: '网络层数' }, { id: 'D', label: 'D', text: '训练轮数' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'model.fit() 中 epochs 参数的含义是？', options: [
      { id: 'A', label: 'A', text: '批次大小' }, { id: 'B', label: 'B', text: '遍历全部训练数据的轮数' },
      { id: 'C', label: 'C', text: '学习率' }, { id: 'D', label: 'D', text: '层数' },
    ], answer: ['B'] },
  ],
  '卷积神经网络 (CNN)': [
    { id: 1, type: 'single', text: 'CNN 中池化层(Pooling)的主要作用是？', options: [
      { id: 'A', label: 'A', text: '增加参数' }, { id: 'B', label: 'B', text: '降低特征图尺寸，减少计算量并提取主要特征' },
      { id: 'C', label: 'C', text: '增加图片分辨率' }, { id: 'D', label: 'D', text: '生成新的训练样本' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: '3x3卷积核在一次滑动中处理的区域大小是？', options: [
      { id: 'A', label: 'A', text: '1个像素' }, { id: 'B', label: 'B', text: '3x3=9个像素的局部区域' },
      { id: 'C', label: 'C', text: '整张图片' }, { id: 'D', label: 'D', text: '3个像素' },
    ], answer: ['B'] },
  ],
  '图像分类实战': [
    { id: 1, type: 'single', text: '数据增强(Data Augmentation)的目的是？', options: [
      { id: 'A', label: 'A', text: '提高图片质量' }, { id: 'B', label: 'B', text: '通过变换扩充训练集，减少过拟合' },
      { id: 'C', label: 'C', text: '加快训练速度' }, { id: 'D', label: 'D', text: '压缩图片体积' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: '迁移学习(Transfer Learning)的核心思想是？', options: [
      { id: 'A', label: 'A', text: '从零训练新模型' }, { id: 'B', label: 'B', text: '利用预训练模型的特征提取能力，在新任务上微调' },
      { id: 'C', label: 'C', text: '复制他人代码' }, { id: 'D', label: 'D', text: '数据迁移' },
    ], answer: ['B'] },
  ],

  // ─── 人工智能基础与应用 ─── AI 应用开发 ──────────────────────────────────
  'NLP 文本处理入门': [
    { id: 1, type: 'single', text: '词向量(Word Embedding)的作用是？', options: [
      { id: 'A', label: 'A', text: '加密文本' }, { id: 'B', label: 'B', text: '将文字映射为密集数值向量，捕捉语义关系' },
      { id: 'C', label: 'C', text: '翻译文本' }, { id: 'D', label: 'D', text: '压缩文本' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: '停用词(Stop Words)过滤的目的是？', options: [
      { id: 'A', label: 'A', text: '翻译文本' }, { id: 'B', label: 'B', text: '去除高频无意义的词(如"的、是、了")以提升处理效率' },
      { id: 'C', label: 'C', text: '检查拼写' }, { id: 'D', label: 'D', text: '加密文本' },
    ], answer: ['B'] },
  ],
  '大语言模型 API 调用': [
    { id: 1, type: 'single', text: 'Temperature=0 时模型的输出特点是？', options: [
      { id: 'A', label: 'A', text: '最随机' }, { id: 'B', label: 'B', text: '最确定性，倾向选择概率最高的token' },
      { id: 'C', label: 'C', text: '不输出' }, { id: 'D', label: 'D', text: '输出最长' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'System Prompt 的作用是？', options: [
      { id: 'A', label: 'A', text: '修改模型权重' }, { id: 'B', label: 'B', text: '设定模型的角色、行为规则和回复风格' },
      { id: 'C', label: 'C', text: '加速推理' }, { id: 'D', label: 'D', text: '减少费用' },
    ], answer: ['B'] },
  ],
  '智能应用构建': [
    { id: 1, type: 'single', text: '向量数据库(Vector DB)在AI应用中的作用是？', options: [
      { id: 'A', label: 'A', text: '存储用户密码' }, { id: 'B', label: 'B', text: '存储文本嵌入向量，支持语义相似性搜索' },
      { id: 'C', label: 'C', text: '训练模型' }, { id: 'D', label: 'D', text: '生成图片' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'LangChain 框架的主要用途是？', options: [
      { id: 'A', label: 'A', text: '训练大模型' }, { id: 'B', label: 'B', text: '简化LLM应用的开发，编排Prompt和工具链' },
      { id: 'C', label: 'C', text: '区块链开发' }, { id: 'D', label: 'D', text: '前端开发' },
    ], answer: ['B'] },
  ],
  '综合项目实战': [
    { id: 1, type: 'single', text: 'AI项目中 MVP(最小可行产品) 的意义是？', options: [
      { id: 'A', label: 'A', text: '做最复杂的功能' }, { id: 'B', label: 'B', text: '用最小成本验证核心假设和用户需求' },
      { id: 'C', label: 'C', text: '跳过测试' }, { id: 'D', label: 'D', text: '最大化代码量' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'AI 应用上线后，模型效果下降(Model Drift)的常见原因是？', options: [
      { id: 'A', label: 'A', text: '服务器升级' }, { id: 'B', label: 'B', text: '现实数据分布随时间变化，与训练数据偏差增大' },
      { id: 'C', label: 'C', text: '用户太多' }, { id: 'D', label: 'D', text: '模型文件太大' },
    ], answer: ['B'] },
  ],

  // ─── 产品经理实战训练营 ─── 产品思维与方法论 ──────────────────────────────
  '什么是产品经理': [
    { id: 1, type: 'single', text: '产品经理与项目经理的核心区别是？', options: [
      { id: 'A', label: 'A', text: '薪资不同' }, { id: 'B', label: 'B', text: '产品经理关注"做正确的事"，项目经理关注"正确地做事"' },
      { id: 'C', label: 'C', text: '没有区别' }, { id: 'D', label: 'D', text: '产品经理写代码' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: '产品生命周期的四个阶段是？', options: [
      { id: 'A', label: 'A', text: '设计、开发、测试、上线' }, { id: 'B', label: 'B', text: '引入期、成长期、成熟期、衰退期' },
      { id: 'C', label: 'C', text: '策划、执行、监控、收尾' }, { id: 'D', label: 'D', text: '需求、设计、编码、部署' },
    ], answer: ['B'] },
  ],
  '用户需求挖掘': [
    { id: 1, type: 'single', text: '"用户要的不是1/4英寸的钻头，而是1/4英寸的洞"，这句话说明？', options: [
      { id: 'A', label: 'A', text: '不要卖钻头' }, { id: 'B', label: 'B', text: '要透过表面需求挖掘背后的真实目标' },
      { id: 'C', label: 'C', text: '洞比钻头重要' }, { id: 'D', label: 'D', text: '用户不会表达需求' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: '5 Why 分析法的核心思路是？', options: [
      { id: 'A', label: 'A', text: '问5个人' }, { id: 'B', label: 'B', text: '连续追问"为什么"直到找到根本原因' },
      { id: 'C', label: 'C', text: '5分钟内完成' }, { id: 'D', label: 'D', text: '列出5个需求' },
    ], answer: ['B'] },
  ],
  '需求文档 (PRD) 撰写': [
    { id: 1, type: 'single', text: '用户故事(User Story)的标准格式是？', options: [
      { id: 'A', label: 'A', text: '需求编号+描述' }, { id: 'B', label: 'B', text: '作为[角色]，我想要[功能]，以便[价值]' },
      { id: 'C', label: 'C', text: '标题+截图' }, { id: 'D', label: 'D', text: '接口文档' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'PRD 中"验收标准"(Acceptance Criteria)的作用是？', options: [
      { id: 'A', label: 'A', text: '美化文档' }, { id: 'B', label: 'B', text: '明确功能完成的标准，方便开发和测试对齐' },
      { id: 'C', label: 'C', text: '记录开发时间' }, { id: 'D', label: 'D', text: '统计需求数量' },
    ], answer: ['B'] },
  ],
  '产品路线图规划': [
    { id: 1, type: 'single', text: '产品路线图应该以什么为导向来规划？', options: [
      { id: 'A', label: 'A', text: '技术趋势' }, { id: 'B', label: 'B', text: '产品目标和用户价值' },
      { id: 'C', label: 'C', text: '竞品动态' }, { id: 'D', label: 'D', text: '领导偏好' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'MoSCoW 优先级排序法中的 M 代表？', options: [
      { id: 'A', label: 'A', text: 'Maybe(也许)' }, { id: 'B', label: 'B', text: 'Must have(必须有)' },
      { id: 'C', label: 'C', text: 'More(更多)' }, { id: 'D', label: 'D', text: 'Minimum(最小)' },
    ], answer: ['B'] },
  ],

  // ─── 产品经理实战训练营 ─── 产品设计与执行 ────────────────────────────────
  '原型设计工具': [
    { id: 1, type: 'single', text: '以下哪个不是主流原型设计工具？', options: [
      { id: 'A', label: 'A', text: 'Figma' }, { id: 'B', label: 'B', text: 'Axure' },
      { id: 'C', label: 'C', text: 'VS Code' }, { id: 'D', label: 'D', text: '墨刀' },
    ], answer: ['C'] },
    { id: 2, type: 'single', text: '产品经理画原型的核心目的是？', options: [
      { id: 'A', label: 'A', text: '展示设计能力' }, { id: 'B', label: 'B', text: '清晰传达产品需求和交互逻辑' },
      { id: 'C', label: 'C', text: '替代开发' }, { id: 'D', label: 'D', text: '获得设计奖' },
    ], answer: ['B'] },
  ],
  '数据驱动决策': [
    { id: 1, type: 'single', text: '数据埋点(Event Tracking)的作用是？', options: [
      { id: 'A', label: 'A', text: '隐藏数据' }, { id: 'B', label: 'B', text: '记录用户行为事件，为数据分析提供原始数据' },
      { id: 'C', label: 'C', text: '加密用户数据' }, { id: 'D', label: 'D', text: '提升页面速度' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: '"相关性不等于因果性"这句话在数据决策中的含义是？', options: [
      { id: 'A', label: 'A', text: '数据没用' }, { id: 'B', label: 'B', text: '两个指标同步变化不代表是一个导致了另一个' },
      { id: 'C', label: 'C', text: '因果关系不重要' }, { id: 'D', label: 'D', text: '不需要数据' },
    ], answer: ['B'] },
  ],
  'A/B 测试方法': [
    { id: 1, type: 'single', text: 'A/B测试中"对照组"的作用是？', options: [
      { id: 'A', label: 'A', text: '测试新功能' }, { id: 'B', label: 'B', text: '作为基准，用来比较实验组的效果变化' },
      { id: 'C', label: 'C', text: '收集更多数据' }, { id: 'D', label: 'D', text: '可以不设对照组' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'A/B 测试中 p 值 < 0.05 意味着？', options: [
      { id: 'A', label: 'A', text: '实验失败' }, { id: 'B', label: 'B', text: '结果在统计上显著，有 95% 信心非偶然' },
      { id: 'C', label: 'C', text: '需要更多数据' }, { id: 'D', label: 'D', text: '效果很大' },
    ], answer: ['B'] },
  ],
  '跨团队协作沟通': [
    { id: 1, type: 'single', text: '产品经理与工程师沟通需求时，最应避免的是？', options: [
      { id: 'A', label: 'A', text: '提供原型' }, { id: 'B', label: 'B', text: '只说"我要什么"而不解释"为什么"' },
      { id: 'C', label: 'C', text: '讨论技术方案' }, { id: 'D', label: 'D', text: '设定优先级' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: '需求评审会(Review)的核心目标是？', options: [
      { id: 'A', label: 'A', text: '让产品经理展示PPT' }, { id: 'B', label: 'B', text: '确保各角色对需求理解一致，发现潜在问题' },
      { id: 'C', label: 'C', text: '决定谁加班' }, { id: 'D', label: 'D', text: '分配Bug' },
    ], answer: ['B'] },
  ],

  // ─── 产品经理实战训练营 ─── 案例与求职 ────────────────────────────────────
  '产品案例拆解': [
    { id: 1, type: 'single', text: '产品案例拆解中，分析商业模式最应关注的是？', options: [
      { id: 'A', label: 'A', text: '界面美观度' }, { id: 'B', label: 'B', text: '价值主张、用户群体、收入来源和成本结构' },
      { id: 'C', label: 'C', text: '公司人数' }, { id: 'D', label: 'D', text: '办公地址' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: 'SWOT 分析中的 O 代表？', options: [
      { id: 'A', label: 'A', text: 'Organization(组织)' }, { id: 'B', label: 'B', text: 'Opportunities(机会)' },
      { id: 'C', label: 'C', text: 'Output(输出)' }, { id: 'D', label: 'D', text: 'Objective(目标)' },
    ], answer: ['B'] },
  ],
  '面试技巧与模拟': [
    { id: 1, type: 'single', text: '产品面试中"估算题"(如中国有多少加油站)考察的核心能力是？', options: [
      { id: 'A', label: 'A', text: '记忆力' }, { id: 'B', label: 'B', text: '逻辑拆解和结构化思维' },
      { id: 'C', label: 'C', text: '数学计算' }, { id: 'D', label: 'D', text: '百度搜索' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: '面试中"你最近使用频率最高的App是什么"这类问题，考察的是？', options: [
      { id: 'A', label: 'A', text: '手机型号' }, { id: 'B', label: 'B', text: '对产品的观察力、分析力和产品感' },
      { id: 'C', label: 'C', text: '流行趋势' }, { id: 'D', label: 'D', text: '使用时长' },
    ], answer: ['B'] },
  ],
  '作品集制作': [
    { id: 1, type: 'single', text: '产品经理作品集与设计师作品集的最大区别是？', options: [
      { id: 'A', label: 'A', text: '更美观' }, { id: 'B', label: 'B', text: '侧重展示产品思考、数据验证和业务成果' },
      { id: 'C', label: 'C', text: '更长' }, { id: 'D', label: 'D', text: '不需要图' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: '作品集中展示数据时，最应注意的是？', options: [
      { id: 'A', label: 'A', text: '数字越大越好' }, { id: 'B', label: 'B', text: '脱敏处理，用百分比/倍数替代绝对值' },
      { id: 'C', label: 'C', text: '不展示数据' }, { id: 'D', label: 'D', text: '编造数据' },
    ], answer: ['B'] },
  ],
  '结营总结': [
    { id: 1, type: 'single', text: '学习产品管理后，最重要的持续提升方式是？', options: [
      { id: 'A', label: 'A', text: '看更多课程' }, { id: 'B', label: 'B', text: '在实际项目中实践并持续复盘' },
      { id: 'C', label: 'C', text: '背诵方法论' }, { id: 'D', label: 'D', text: '考更多证书' },
    ], answer: ['B'] },
    { id: 2, type: 'single', text: '产品思维在日常生活中的应用体现在？', options: [
      { id: 'A', label: 'A', text: '只适用于互联网公司' }, { id: 'B', label: 'B', text: '识别问题、分析需求、验证假设的通用思维方式' },
      { id: 'C', label: 'C', text: '写PRD' }, { id: 'D', label: 'D', text: '画原型' },
    ], answer: ['B'] },
  ],
};
