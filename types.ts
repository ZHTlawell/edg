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
  description: string;
}

export type ClassStatus = 'pending' | 'ongoing' | 'closed';

export interface Class {
  id: string;
  name: string;
  campus: string;
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
}