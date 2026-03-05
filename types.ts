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
  description?: string;
}

export type ClassStatus = 'pending' | 'ongoing' | 'closed';

export interface Class {
  id: string;
  name: string;
  campus: string;
  courseId: string; // 关联课程 ID
  courseName: string;
  teacherName: string;
  capacity: number;
  enrolled: number;
  schedule: string; // 每周几 + 时间段
  status: ClassStatus;
  createdAt: string;
}

export type StudentStatus = 'potential' | 'trial' | 'active' | 'inactive' | 'graduated' | 'dropped';

export interface Student {
  id: string;
  name: string;
  gender: 'male' | 'female';
  phone: string;
  campus: string;
  status: StudentStatus;
  className: string;
  lastStudyTime: string;
  createdAt: string;
  birthday?: string;
  balanceAmount?: number;
  balanceLessons?: number;
}

export type AttendStatus = 'present' | 'leave' | 'absent' | 'late';

export interface AttendanceRecord {
  id: string;
  lessonId: string;
  studentId: string;
  courseId: string;
  classId: string;
  campusId: string;
  status: AttendStatus;
  deductHours: number;
  deductStatus: 'pending' | 'completed' | 'failed';
  remark?: string;
  createdAt: string;
}

export interface AssetAccount {
  id: string;
  studentId: string;
  courseId: string;
  campusId: string;
  totalQty: number;
  remainingQty: number;
  lockedQty: number;
  status: 'active' | 'exhausted' | 'frozen';
  updatedAt: string;
}

export interface AssetLedger {
  id: string;
  accountId: string;
  studentId: string;
  businessType: 'BUY' | 'CONSUME' | 'REFUND';
  changeQty: number;
  balanceSnapshot: number;
  refId: string; // 关联考勤记录 ID 或订单 ID
  occurTime: string;
}

export type OrderStatus = 'pending' | 'paid' | 'cancelled' | 'refunded';

export interface Order {
  id: string;
  studentId: string;
  courseId: string;
  classId: string;
  campusId: string;
  lessons: number; // 购买课时
  amount: number; // 支付金额
  paymentMethod: string;
  status: OrderStatus;
  notes?: string;
  createdAt: string;
}