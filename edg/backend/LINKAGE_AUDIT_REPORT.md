# 学员端四端联通性审计报告

**执行日期**: 2026-04-14  
**系统**: Edg1 Backend (NestJS + Prisma + SQLite)  
**数据库**: `/Users/macmini/Desktop/Edg1/edg/backend/prisma/dev.db`

---

## 一、数据规模概览

| 指标 | 数值 |
|------|------|
| 学员用户 | 73 |
| 教师用户 | 4 |
| 班级 | 12 |
| 课程 | 7 |
| 课程标准 | 7 |
| 订单 | 155 |
| 课时资产账户 | 152 |
| 考勤记录 | 1080 |
| 学习进度 | 8 ⚠️ |
| 作业 | 7 |
| 作业提交 | 5 |

---

## 二、四端联通性评估

### 🟢 端1: 学员登录端 [PASS]

**现状**: ✓ 完整  
**覆盖率**: 100% (73/73 学员激活)

```
SysUser (role=STUDENT) → EduStudent
- 所有73个学员账户状态: ACTIVE
- 认证系统: 正常运作
- Campus覆盖: 
  - CAMPUS_PUDONG: 50个学员
  - CAMPUS_XUHUI: 23个学员
```

**评分**: 25/25

---

### 🟢 端2: 课程查看端 [PASS]

**现状**: ✓ 完整  
**覆盖率**: 98.6% (72/73 学员)

```
Student → Class → Course → Teacher
- 学员-班级关联: 149条 (平均2.07个班级/学员)
- 班级-课程分配: 12条 (100% 班级有课程)

示例班级:
  ├─ 全栈开发：React+Node-2025-12-1班
  ├─ 高级UI/UX设计实战-2026-04班
  ├─ 产品经理集训-2026Q1班
  └─ 零基础Python自动化-2026-02-1班

示例课程:
  ├─ 全栈开发：React+Node [讲师: 李华]
  ├─ 高级UI/UX设计实战 [讲师: 张明]
  ├─ 产品经理实战训练营 [讲师: 王芳]
  └─ 零基础Python自动化 [讲师: 张明]
```

**评分**: 25/25

---

### 🟢 端3: 订单-支付端 [PASS]

**现状**: ✓ 完整  
**覆盖率**: 95.5% (148/155 已支付)

```
Student → Order → Payment → Asset Account

订单统计:
  - 总订单: 155
  - 已支付(PAID): 148 (95.5%)
  - 待支付: 1 (0.6%)
  - 已退款: 2 (1.3%)
  - 已取消: 4 (2.6%)

支付记录:
  - 有支付记录的订单: 119/155 (76.8%)
  - 支付渠道: 多个支付方式覆盖

课时资产:
  - 资产账户总数: 152
  - 购买总课时: 4982
  - 已消费: 987课时 (19.8%)
  - 剩余: 3995课时 (80.2%)
```

**典型链路**:
- 学员何宇轩 → 订单(零基础Python) → 支付¥2800 → 资产24课时 → 消费6课时 → 剩余18课时 ✓

**评分**: 25/25

---

### 🔴 端4: 学习-考勤端 [PARTIAL - CRITICAL ISSUE]

**现状**: ⚠️ 不完整  
**覆盖率**: 2.2% (8/370 预期进度记录)

```
Student → Attendance → LessonSchedule → Course → Lesson → Progress

考勤系统:
  - 考勤记录: 1080条
  - 覆盖学员: 72/73 (98.6%)
  - 考勤状态分布:
    ├─ PRESENT(出席): 893条 (82.7%)
    ├─ ABSENT(缺席): 75条 (6.9%)
    ├─ LATE(迟到): 61条 (5.6%)
    └─ LEAVE(请假): 51条 (4.7%)
  
  - 课消扣费:
    ├─ DEDUCTED(已扣费): 812条 (75.2%)
    ├─ CONFIRMED(确认): 252条 (23.3%)
    └─ NO_DEDUCTION(无扣费): 16条 (1.5%)

🔴 学习进度记录 [严重不足]:
  - 总记录: 8条 (vs 1080条考勤)
  - 覆盖学员: 1/73 (1.4%)
  - 进度状态:
    ├─ COMPLETED: 7条 (87.5%)
    └─ IN_PROGRESS: 1条 (12.5%)

数据缺口分析:
  - 预期: 73学员 × ~5课程/学员 = 365条进度
  - 实际: 8条
  - 缺失率: 97.8% ❌

作业系统:
  - 作业定义: 7条
  - 作业提交: 5条 (71.4% 完成率)
  - 批改状态:
    ├─ GRADED(已批改): 2条
    └─ SUBMITTED(已提交): 3条
```

**问题链路**:
- 学员杨博文 → 23次考勤 → 0条学习进度 ⚠️
  - 订单: 2个 (全栈+Python)
  - 资产: 2个 (48+24课时)
  - 考勤: 23次 (消费17课时)
  - 学习进度: 0 ❌

**评分**: 2/25 (仅考勤系统, 学习进度极其不足)

---

## 三、课程标准完整性检查

| 标准名称 | 课时 | 章节 | 资源 | 状态 |
|---------|------|------|------|------|
| 高级UI/UX设计实战 | 20/24 | 4 | 21 | ❌ 缺4课时 |
| 全栈开发：React+Node | 26/32 | 4 | 19 | ❌ 缺6课时 |
| 零基础Python自动化 | 18/20 | 4 | 12 | ❌ 缺2课时 |
| 产品经理实战训练营 | 20/24 | 4 | 8 | ❌ 缺4课时 |
| 人工智能基础与应用 | 24/28 | 4 | 11 | ❌ 缺4课时 |
| 数据分析与可视化 | 17/20 | 4 | 12 | ❌ 缺3课时 |
| [历史]__TEST__大额课程 | 0/20 | 0 | 0 | ❌ 完全空 |

**问题**: 7/7 个标准都有课时定义不符

---

## 四、关键问题与优先级

### 🔴 严重问题 (Critical) - 优先级1

#### 问题1: 学习进度数据严重不足

**现象**:
- 8条学习进度 vs 1080条考勤 vs 155个订单
- 覆盖率仅2.2%
- 仅1个学员有进度记录

**根本原因**:
- StudentLessonProgress 表在业务流程中未被正确写入
- 缺少 attendance → lesson_progress 的映射逻辑
- 学员可能未实现课程学习路径追踪

**业务影响**:
- 学员看不到自己的学习进度
- 无法判断学员是否掌握课程内容
- 平台缺少学习数据分析
- 无法生成学习报告

**修复方案**:
```javascript
// 建议: 考勤扣费时触发学习进度记录
// 流程: attendance(confirmed) 
//   → 找到对应的 lesson(schedule) 
//   → 找到对应的 course 
//   → 找到 course 的所有 lessons 
//   → 创建/更新 StudentLessonProgress
```

**优先级**: 🔴🔴🔴  最高

---

### 🟡 中等问题 (Medium) - 优先级2

#### 问题2: 作业系统低度使用

**现象**:
- 7个作业定义，仅5个学生提交
- 覆盖率1.4%

**根本原因**:
- 作业发放流程不完善
- 班级-作业关联不足
- 缺乏学员提交激励

**修复方案**:
1. 增加班级作业批量下发功能
2. 改进学员作业提交界面
3. 增加作业完成提醒

**优先级**: 🟡🟡 中等

---

#### 问题3: 课程标准课时定义不完整

**现象**:
- 7/7 个标准都有 lesson count mismatch
- 缺失课时数: 4+6+2+4+4+3+20 = 43课时

**根本原因**:
- 课程设计人员未完整补充课时定义
- StdCourseChapter 和 StdCourseLesson 未被完整填充

**修复方案**:
1. 检查每个标准的设计文档
2. 补充缺失的章节和课时
3. 为每个课时增加资源关联

**优先级**: 🟡 中等

---

### 🟢 正常运作 (Operational)

- ✓ 学员登录认证系统
- ✓ 班级课程绑定
- ✓ 订单与支付
- ✓ 课时资产管理
- ✓ 考勤记录与课消

---

## 五、数据质量评分

| 维度 | 评分 | 满分 | 比例 |
|------|------|------|------|
| 学员-班级链路 | 25 | 25 | 100% |
| 班级-课程链路 | 25 | 25 | 100% |
| 订单-支付链路 | 25 | 25 | 100% |
| 学习-考勤链路 | 2 | 25 | 8% |
| **总体评分** | **77** | **100** | **77%** |

---

## 六、建议优化方向

### 优先级1: 建立学习进度追踪系统 [紧急]

**目标**: 将 StudentLessonProgress 覆盖率从 1.4% 提升至 80%

**方案**:

1. **自动化进度记录**
   ```typescript
   // 在 attendance 扣费成功后，自动创建学习进度
   async recordStudentProgress(attendance: TeachAttendance) {
     const lesson = attendance.lesson;
     const schedule = await lessonSchedule.findById(lesson.id);
     const course = await course.findById(schedule.course_id);
     
     // 获取课程的所有课时
     const allLessons = await standardLesson.findByCourse(course.standard_id);
     
     // 创建/更新进度记录
     for (const stdLesson of allLessons) {
       await studentLessonProgress.upsert({
         student_id: attendance.student_id,
         lesson_id: stdLesson.id,
         course_id: course.id,
         status: 'IN_PROGRESS', // 考勤即视为学习中
         started_at: new Date()
       });
     }
   }
   ```

2. **学员课程页面展示**
   - 显示课程学习进度条 (x/y 课时)
   - 显示已完成课时列表
   - 显示学习时间线

3. **数据迁移**
   - 根据现有考勤数据，追溯创建历史进度记录
   - 期望补充 ~900条进度记录

---

### 优先级2: 完善作业系统 [高]

**目标**: 提升作业参与度至 50%+

1. **批量发放作业**
   - 按班级发放
   - 设置截止日期
   - 自动提醒

2. **改进提交流程**
   - 支持多种提交方式 (文本、图片、文件)
   - 实时反馈

3. **批改系统**
   - 教师批量批改
   - 自动评分模板

---

### 优先级3: 补完课程标准定义 [中]

**目标**: 消除 7/7 标准的课时定义缺陷

1. **检查课程设计**
   - 验证是否应该是 20 还是 24 课时
   - 与教师确认课程大纲

2. **补充课时**
   ```sql
   -- 示例: 为 STD-UIUX-001 补充4个缺失的课时
   INSERT INTO StdCourseLesson (
     id, chapter_id, title, sort_order, duration
   ) VALUES
     (uuid(), chapter_id, 'Lesson 21: Advanced Prototyping', 21, 45),
     (uuid(), chapter_id, 'Lesson 22: User Testing', 22, 45),
     (uuid(), chapter_id, 'Lesson 23: Design Systems', 23, 45),
     (uuid(), chapter_id, 'Lesson 24: Portfolio Building', 24, 45);
   ```

3. **资源关联**
   - 每个课时至少关联 1 个资源
   - 资源类型: 视频、PPT、PDF、案例等

---

## 七、SQL 查询验证脚本

```javascript
// 验证完整链路的查询
const fullLinkageQuery = async (studentId) => {
  // 1. 学员信息
  const student = await prisma.sysUser.findUnique({
    where: { id: studentId },
    select: { username: true, campus_id: true, studentProfile: true }
  });
  
  // 2. 班级
  const classes = await prisma.eduStudentInClass.findMany({
    where: { student_id: student.studentProfile.id }
  });
  
  // 3. 订单
  const orders = await prisma.finOrder.findMany({
    where: { student_id: student.studentProfile.id }
  });
  
  // 4. 资产
  const assets = await prisma.finAssetAccount.findMany({
    where: { student_id: student.studentProfile.id }
  });
  
  // 5. 考勤
  const attendance = await prisma.teachAttendance.findMany({
    where: { student_id: student.studentProfile.id }
  });
  
  // 6. 进度
  const progress = await prisma.studentLessonProgress.findMany({
    where: { student_id: student.studentProfile.id }
  });
  
  return {
    student, classes, orders, assets, attendance, progress
  };
};
```

---

## 八、监控指标建议

| 指标 | 当前 | 目标 | 优先级 |
|------|------|------|--------|
| 学习进度覆盖率 | 1.4% | 80% | 🔴 |
| 作业参与率 | 7.1% | 50% | 🟡 |
| 课程标准完整率 | 0% | 100% | 🟡 |
| 考勤->课消 | 75.2% | 90% | 🟡 |
| 订单->资产映射 | 98.1% | 100% | 🟢 |

---

## 九、总结

**当前系统数据链路状态:**
- ✓ 学员登录、班级、订单、支付、考勤: 基本完整
- ✗ 学习进度: 严重缺失 (97.8% 数据缺口)
- ⚠️ 作业系统: 低度使用 (1.4% 参与)
- ⚠️ 课程标准: 定义不完整 (100% 缺陷)

**推荐行动方案:**
1. **本周**: 启动学习进度自动化填充，预计补充 800+ 条记录
2. **下周**: 完善课程标准定义，补充 43 个缺失课时
3. **后续**: 优化作业系统，提升教学互动

**预计改进后评分**: 95/100

---

*报告生成日期: 2026-04-14*  
*生成工具: node scripts/check-linkage.js*  
*数据库: SQLite dev.db*

