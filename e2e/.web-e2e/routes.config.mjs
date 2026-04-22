/**
 * Edg1 路由/视图配置
 *
 * Edg1 是 SPA，视图由 App.tsx 的 `activeView` 状态切换。
 * 这里把每个 view 视为"逻辑路由"，导航通过点击 Sidebar 对应 label 实现。
 *
 * 字段说明：
 *   id         - App.tsx 内 activeView 值
 *   label      - Sidebar 中文按钮文案，测试用它点击
 *   group      - Sidebar 父级分组 label（若有），需先点开再点子项
 *   roles      - 哪些角色有权访问
 *   priority   - P0 冒烟 / P1 主流程 / P2 次要
 */
export const ROUTES = [
  // Admin
  { id: 'dashboard',          label: '工作台概览',     group: null,           roles: ['admin'],                    priority: 'P0' },
  { id: 'campus-list',        label: '校区管理',       group: '校区组织',     roles: ['admin'],                    priority: 'P0' },
  { id: 'students',           label: '学员档案',       group: '学员管理',     roles: ['admin','campus_admin'],     priority: 'P0' },
  { id: 'attendance-module',  label: '考勤中心',       group: '学员管理',     roles: ['admin'],                    priority: 'P1' },
  { id: 'courses',            label: '课程库',         group: '教研产品',     roles: ['admin','campus_admin'],     priority: 'P0' },
  { id: 'classes',            label: '班级管理',       group: '教研产品',     roles: ['admin','campus_admin','teacher'], priority: 'P0' },
  { id: 'payments',           label: '报名缴费',       group: '学员报名/退费管理', roles: ['admin','campus_admin'], priority: 'P0' },
  { id: 'refund-management',  label: '退费管理',       group: '学员报名/退费管理', roles: ['admin','campus_admin'], priority: 'P1' },
  { id: 'teaching',           label: '教学调度',       group: null,           roles: ['admin','campus_admin','teacher'], priority: 'P0' },
  { id: 'stats',              label: '统计看板',       group: '统计报表',     roles: ['admin','campus_admin'],     priority: 'P1' },
  { id: 'report-details',     label: '报表明细',       group: '统计报表',     roles: ['admin','campus_admin'],     priority: 'P2' },
  { id: 'finance-report',     label: '财务报表',       group: '统计报表',     roles: ['campus_admin'],             priority: 'P1' },
  { id: 'roles',              label: '权限配置',       group: '系统设置',     roles: ['admin'],                    priority: 'P2' },
  { id: 'logs',               label: '审计日志',       group: '系统设置',     roles: ['admin'],                    priority: 'P2' },
  { id: 'announcemnt-mgmt',   label: '公告管理',       group: '系统设置',     roles: ['admin'],                    priority: 'P1' },
  { id: 'course-standard',    label: '课程体系管理',   group: null,           roles: ['admin'],                    priority: 'P1' },

  // Campus admin
  { id: 'teacher-registration', label: '教师档案',     group: '教务组织',     roles: ['campus_admin'],             priority: 'P0' },
  { id: 'teacher-approval',     label: '教师注册审核', group: '教务组织',     roles: ['campus_admin','admin'],     priority: 'P1' },
  { id: 'student-approval',     label: '学员注册审核', group: '学员管理',     roles: ['campus_admin','admin'],     priority: 'P1' },
  { id: 'announcement-view',    label: '系统公告',     group: null,           roles: ['campus_admin'],             priority: 'P2' },

  // Teacher
  { id: 'schedule',           label: '我的课表',       group: null,           roles: ['teacher'],                  priority: 'P0' },
  { id: 'teacher-homework',   label: '作业分发',       group: null,           roles: ['teacher'],                  priority: 'P1' },
  { id: 'resources',          label: '学习资源',       group: null,           roles: ['teacher'],                  priority: 'P2' },
  { id: 'my-stats',           label: '教学统计',       group: null,           roles: ['teacher'],                  priority: 'P1' },

  // Student
  { id: 'student-dashboard',    label: '学生首页',     group: null,           roles: ['student'],                  priority: 'P0' },
  { id: 'student-schedule',     label: '我的课表',     group: null,           roles: ['student'],                  priority: 'P0' },
  { id: 'student-learning',     label: '在线学习',     group: null,           roles: ['student'],                  priority: 'P0' },
  { id: 'student-homework',     label: '我的作业',     group: null,           roles: ['student'],                  priority: 'P1' },
  { id: 'student-market',       label: '精品市场',     group: null,           roles: ['student'],                  priority: 'P0' },
  { id: 'student-orders',       label: '订单与课时',   group: null,           roles: ['student'],                  priority: 'P1' },
  { id: 'student-notifications',label: '通知中心',     group: null,           roles: ['student'],                  priority: 'P2' },
];
