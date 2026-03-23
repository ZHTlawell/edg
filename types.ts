// Added React import to resolve missing 'React' namespace in TypeScript
import React from 'react';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  children?: NavItem[];
}

export interface StatData {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  iconBg: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'registration' | 'payment' | 'alert' | 'course';
}

export type CourseStatus = 'enabled' | 'disabled' | 'pending';

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
  is_standard?: boolean;
  standard_id?: string;
}

export interface Teacher {
  id: string;
  name: string;
  department?: string;
  phone?: string;
  campus?: string;
  campus_id?: string;
}

export interface Schedule {
  id: string;
  class_id: string;
  start_time: string;
  end_time: string;
  classroom?: string;
  status: string;
  attendances?: any[];
}

export type ClassStatus = 'pending' | 'ongoing' | 'closed';

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

export type StudentStatus = 'potential' | 'trial' | 'active' | 'inactive' | 'graduated' | 'dropped';

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

export type AttendStatus = 'present' | 'leave' | 'absent' | 'late';

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

export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'PARTIAL_REFUNDED' | 'REFUNDED' | 'CANCELLED';

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

export interface PaymentRecord {
  id: string;
  order_id: string;
  amount: number;
  channel: string; // Wechat, Alipay, Cash, etc.
  status: 'SUCCESS' | 'FAILED';
  operator_id?: string;
  createdAt: string;
}

export interface RefundRecord {
  id: string;
  order_id: string;
  student_id: string;
  amount: number;
  reason: string;
  status: 'PENDING_APPROVAL' | 'PENDING_HQ_APPROVAL' | 'APPROVED' | 'REJECTED';
  applicant_id: string;
  approver_id?: string;
  createdAt: string;
  updatedAt: string;
  student?: Student;
  order?: Order;
}

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

export type AnnouncementStatus = 'DRAFT' | 'PUBLISHED' | 'WITHDRAWN';
export type AnnouncementScope = 'ALL' | 'SPECIFIC';

export interface AnnouncementTarget {
  id: string;
  announcement_id: string;
  campus_id: string;
}

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