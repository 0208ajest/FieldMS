import { Engineer, Schedule, WorkOrder } from '@/types';

export const engineers: Engineer[] = [
  {
    id: 101,
    name: '田中 太郎',
    email: 'tanaka@example.com',
    phone: '090-1234-5678',
    skills: ['ネットワーク', 'サーバー', 'Linux'],
    certifications: ['CCNA'],
    status: 'available',
    location: '東京',
    departmentId: 2,
    companyId: 1,
    hireDate: new Date('2022-04-01'),
    emergencyContact: { name: '田中 花子', phone: '090-9876-5432', relationship: '妻' },
  },
  {
    id: 102,
    name: '山田 花子',
    email: 'yamada@example.com',
    phone: '090-2222-3333',
    skills: ['クラウド', 'AWS', 'Infra as Code'],
    certifications: ['AWS SAA'],
    status: 'busy',
    location: '神奈川',
    departmentId: 2,
    companyId: 1,
    hireDate: new Date('2021-10-01'),
    emergencyContact: { name: '山田 太郎', phone: '080-1111-2222', relationship: '父' },
    currentTask: { title: 'VPN更改', location: '横浜' },
  },
];

export const schedules: Schedule[] = [
  {
    id: 1001,
    engineerId: 101,
    title: 'サーバー保守',
    description: '定期メンテナンス',
    startDate: new Date(),
    endDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
    status: 'scheduled',
    location: '千代田区',
    createdBy: 2,
  },
  {
    id: 1002,
    engineerId: 102,
    title: 'ネットワーク更改',
    description: 'ルータ交換',
    startDate: new Date(),
    endDate: new Date(Date.now() + 3 * 60 * 60 * 1000),
    status: 'in_progress',
    location: '横浜市',
    createdBy: 3,
  },
];

export const workOrders: WorkOrder[] = [
  {
    id: 5001,
    title: '急ぎ: オフィスVPN障害',
    description: '社内VPNが断続的に切れる',
    priority: 'urgent',
    status: 'pending',
    createdBy: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    location: '港区',
    estimatedDuration: 120,
    customerInfo: { name: 'ABC商事', contact: '担当 佐藤', address: '港区1-2-3', email: 'support@abc.co.jp' },
  },
  {
    id: 5002,
    title: '拠点間回線増速',
    description: '拠点A-B間の回線増速工事',
    priority: 'high',
    status: 'assigned',
    assignedEngineerId: 102,
    createdBy: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    dueDate: new Date(Date.now() + 72 * 60 * 60 * 1000),
    location: '川崎市',
    estimatedDuration: 240,
    customerInfo: { name: 'XYZ通信', contact: '情シス', address: '川崎市1-2-3' },
    progress: 10,
  },
];



