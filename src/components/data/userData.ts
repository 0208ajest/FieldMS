import { Company, Department, User } from '@/types';

export const companies: Company[] = [
  { id: 1, name: 'FieldMS 株式会社', address: '東京都千代田区1-1-1', phone: '03-0000-0000', isActive: true },
];

export const departments: Department[] = [
  { id: 1, name: '技術部', companyId: 1, managerId: 2, isActive: true },
  { id: 2, name: '保守部', companyId: 1, managerId: 3, isActive: true },
];

export const users: User[] = [
  {
    id: 1,
    email: 'admin@fieldms.com',
    name: 'システム管理者',
    systemRole: 'system_admin',
    companyId: 1,
    departmentId: 1,
    isActive: true,
    phone: '03-1234-5678',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 2,
    email: 'manager@fieldms.com',
    name: '管理者',
    systemRole: 'admin',
    companyId: 1,
    departmentId: 1,
    isActive: true,
    phone: '03-1234-5679',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 3,
    email: 'dispatcher@fieldms.com',
    name: 'ディスパッチャー',
    systemRole: 'dispatcher',
    companyId: 1,
    departmentId: 1,
    isActive: true,
    phone: '03-1111-2222',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 4,
    email: 'engineer.manager@fieldms.com',
    name: 'エンジニア管理',
    systemRole: 'engineer_manager',
    companyId: 1,
    departmentId: 2,
    isActive: true,
    phone: '03-3333-4444',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 5,
    email: 'engineer@fieldms.com',
    name: 'エンジニア田中',
    systemRole: 'engineer',
    companyId: 1,
    departmentId: 2,
    isActive: true,
    phone: '090-1234-5678',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

export const demoLoginCredentials = [
  { email: 'admin@fieldms.com', password: 'admin123', user: users[0] },
  { email: 'manager@fieldms.com', password: 'manager123', user: users[1] },
  { email: 'dispatcher@fieldms.com', password: 'dispatch123', user: users[2] },
  { email: 'engineer.manager@fieldms.com', password: 'engmgr123', user: users[3] },
  { email: 'engineer@fieldms.com', password: 'eng123', user: users[4] },
];



