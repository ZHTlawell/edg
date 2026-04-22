/**
 * 全局类型定义
 * 集中维护前端用到的数据模型：导航、课程、班级、学员、订单、
 * 考勤、资产账户/流水、作业、公告等核心业务实体。
 * 与后端字段保持一致；部分字段因历史原因同时存在驼峰与下划线命名。
 */

// Added React import to resolve missing 'React' namespace in TypeScript
import React from 'react';

// 侧边栏 / 顶部导航项结构（支持多级子菜单）
export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  children?: NavItem[];
}

// 仪表盘统计卡片数据模型（含变化趋势、图标样式）
export interface StatData {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  iconBg: string;
}

// 最近活动流数据模型（报名 / 缴费 / 告警 / 课程）
export interface Activity {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'registration' | 'payment' | 'alert' | 'course';
}

// 课程上下架状态：启用 / 停用 / 审核中
export type CourseStatus = 'enabled' | 'disabled' | 'pending';

// 课程数据模型（用于课程管理、选课、学员资产等场景）
export interface Course {
  id: string;
  code: string; // 课程编号
  name: string;
  category: string; // 课程类型
  level: string; // 级别 (初级/中级/高级)
  totalLessons: number; // 课时数
  price: string; // 价格/价格策略
  campus: string; // 适用校区
  status: CourseStatus;
  updateTime: string;
  instructor: string;
  instructor_id?: string;
  campus_id?: string;
  description?: string;
  standard_id?: string;
  standard_code?: string;
  standard_name?: string;
}

// 教师基础信息
export interface Teacher {
  id: string;
  name: string;
  department?: string;
  phone?: string;
  campus?: string;
  campus_id?: string;
}

// 单节课时（Schedule/Lesson）排课记录
export interface Schedule {
  id: string;
  class_id: string;
  start_time: string;
  end_time: string;
  classroom?: string;
  status: string;
  attendances?: any[];
}

// 班级状态：待开班 / 进行中 / 已结课
export type ClassStatus = 'pending' | 'ongoing' | 'closed';

// 班级数据模型（一个班级绑定一个课程 + 一位教师 + 多个排课）
export interface Class {
  id: string;
  name: string;
  capacity: number;
  enrolled: number;
  campus?: string; // Legacy
  campus_id?: string;
  status: ClassStatus;
  courseName?: string; // Legacy
  course_id?: string;
  course?: Course;
  teacherName?: string; // Legacy
  teacher_id?: string;
  teacher?: Teacher;
  schedule?: string; // Legacy
  students?: any[];
  schedules?: Schedule[];
  createdAt?: string; // Legacy
}

// 学员生命周期状态：潜客 / 试听 / 在读 / 沉睡 / 结业 / 流失
export type StudentStatus = 'potential' | 'trial' | 'active' | 'inactive' | 'graduated' | 'dropped';

// 学员数据模型（含余额、余课时等财务摘要字段）
export interface Student {
  id: string;
  name: string;
  gender: 'male' | 'female';
  phone: string;
  campus?: string; // 校区名称
  campus_id?: string;
  status: StudentStatus;
  className?: string; // Derived or linked
  lastStudyTime: string;
  createdAt: string;
  birthday?: string;
  balanceAmount?: number;
  balance?: number; // Real cash balance from backend
  balanceLessons?: number;
}

// 出勤状态：出勤 / 请假 / 旷课 / 迟到
export type AttendStatus = 'present' | 'leave' | 'absent' | 'late';

// 单条考勤记录（含扣课时数、扣课状态等）
export interface AttendanceRecord {
  id: string;
  lesson_id: string;
  student_id: string;
  studentId?: string; // Legacy
  course_id: string;
  courseId?: string; // Legacy
  class_id: string;
  classId?: string; // Legacy
  campus_id: string;
  campusId?: string; // Legacy
  status: AttendStatus;
  deductHours: number;
  deductStatus: 'pending' | 'completed' | 'failed';
  remark?: string;
  createdAt: string;
}

// 学员资产账户：某学员在某课程下的课时账户（总/剩余/锁定/已退）
export interface AssetAccount {
  id: string;
  student_id: string;
  studentId?: string; // Legacy
  course_id: string;
  courseId?: string; // Legacy
  campus_id: string;
  campusId?: string; // Legacy
  total_qty: number;
  totalQty?: number; // Legacy
  remaining_qty: number;
  remainingQty?: number; // Legacy
  locked_qty: number;
  refunded_qty: number;
  refunded_amount: number;
  status: 'ACTIVE' | 'DEPLETED' | 'REFUNDED';
  updatedAt: string;
  course?: Course;
}

// 资产流水（购买 / 消耗 / 退费）记录，用于审计
export interface AssetLedger {
  id: string;
  account_id: string;
  student_id: string;
  studentId?: string; // Legacy
  businessType: 'BUY' | 'CONSUME' | 'REFUND';
  changeQty: number;
  balanceSnapshot: number;
  refId: string; // 关联考勤记录 ID 或订单 ID
  occurTime: string;
}

// 订单状态：待付款 / 已付款 / 部分退款 / 已退款 / 已取消
export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'PARTIAL_REFUNDED' | 'REFUNDED' | 'CANCELLED';

// 订单数据模型（学员自助下单或管理员代下单）
export interface Order {
  id: string;
  student_id: string;
  studentId?: string; // Legacy
  course_id: string;
  courseId?: string; // Legacy
  campus_id?: string;
  campusId?: string; // Legacy
  amount: number;
  total_qty: number;
  totalQty?: number; // Legacy
  lessons?: number; // Legacy
  order_source: 'student' | 'admin';
  operator_id?: string;
  status: OrderStatus;
  createdAt: string;
  course?: Course;
  paymentMethod?: string;
}

// 支付流水记录（微信 / 支付宝 / 现金等）
export interface PaymentRecord {
  id: string;
  order_id: string;
  amount: number;
  channel: string; // Wechat, Alipay, Cash, etc.
  status: 'SUCCESS' | 'FAILED';
  operator_id?: string;
  createdAt: string;
}

// 退费申请 / 审批记录
export interface RefundRecord {
  id: string;
  order_id: string;
  student_id: string;
  amount: number;
  reason: string;
  requested_qty?: number;
  approved_qty?: number;
  estimated_amount?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  review_note?: string;
  applicant_id: string;
  approver_id?: string;
  createdAt: string;
  reviewedAt?: string;
  updatedAt: string;
  student?: Student;
  order?: Order;
}

// 教师发布的作业实体
export interface Homework {
  id: string;
  title: string;
  content: string;
  course_id: string;
  class_id: string;
  teacher_id: string;
  deadline: string;
  attachmentName?: string;
  attachmentUrl?: string;
  createdAt: string;
  status: 'active' | 'closed';
}

// 学员作业提交记录（可被教师评分）
export interface HomeworkSubmission {
  id: string;
  homework_id: string;
  student_id: string;
  content: string;
  status: 'submitted' | 'graded';
  score?: number;
  feedback?: string;
  submittedAt: string;
}

// 公告发布状态：草稿 / 已发布 / 已撤回
export type AnnouncementStatus = 'DRAFT' | 'PUBLISHED' | 'WITHDRAWN';
// 公告覆盖范围：全部校区 / 指定校区
export type AnnouncementScope = 'ALL' | 'SPECIFIC';

// 公告的目标校区关联表（scope=SPECIFIC 时使用）
export interface AnnouncementTarget {
  id: string;
  announcement_id: string;
  campus_id: string;
}

// 公告实体（支持草稿、发布、撤回等完整生命周期）
export interface Announcement {
  id: string;
  title: string;
  content: string;
  status: AnnouncementStatus;
  scope: AnnouncementScope;
  publisher_id: string;
  publishTime?: string;
  withdrawTime?: string;
  createdAt: string;
  updatedAt: string;
  targets?: AnnouncementTarget[];
}