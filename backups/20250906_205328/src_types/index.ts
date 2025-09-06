export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  systemRole: 'system_admin' | 'admin' | 'dispatcher' | 'engineer_manager' | 'engineer';
  companyId: number;
  departmentId: number;
  isActive: boolean;
  avatar?: string;
  bio?: string;
  createdAt: Date;
  lastLoginAt?: Date | null;
}

export interface Notification {
  id: number;
  type: 'unassigned_schedule' | 'assigned_schedule';
  title: string;
  description: string;
  scheduleId: number;
  engineerId?: number;
  engineerName?: string;
  createdAt: Date;
  read: boolean;
}

export interface Company {
  id: number;
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Department {
  id: number;
  name: string;
  companyId: number;
  isActive: boolean;
  createdAt: Date;
}

export interface Engineer {
  id: number;
  name: string;
  email: string;
  phone: string;
  departmentId: number;
  skills: string[];
  status: 'active' | 'available' | 'busy' | 'inactive' | 'on_leave';
  avatar?: string;
  currentTask?: {
    title: string;
    location: string;
  };
  progress?: number;
}

export interface Schedule {
  id: number;
  title: string;
  description: string;
  engineerId: number;
  startDate: string;
  endDate: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  workOrderId?: number | null;
}

export interface WorkOrder {
  id: number;
  title: string;
  description: string;
  location: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedDuration: number;
  dueDate: Date;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed';
  assignedEngineerId?: number | null;
  progress?: number;
  createdAt: Date;
  completedAt?: Date | null;
}
