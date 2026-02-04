
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

export type CourseStatus = 'ongoing' | 'completed' | 'pending';

export interface Course {
  id: string;
  name: string;
  description: string;
  instructor: string;
  totalLessons: number;
  startDate: string;
  status: CourseStatus;
  category: string;
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
