import { Engineer, Schedule, User } from '@/types';

export const canAccessUserManagement = (user: User): boolean => {
  return ['system_admin', 'admin'].includes(user.systemRole);
};

export const canEditEngineer = (user: User, engineer: Engineer): boolean => {
  if (user.systemRole === 'system_admin') return true;
  if (user.systemRole === 'admin') return true;
  if (user.systemRole === 'engineer_manager' && user.departmentId === engineer.departmentId) return true;
  return false;
};

export const canViewSchedule = (user: User, schedule: Schedule): boolean => {
  if (user.systemRole === 'system_admin') return true;
  if (user.systemRole === 'admin' || user.systemRole === 'dispatcher') return true;
  if (user.systemRole === 'engineer_manager') return true;
  if (user.systemRole === 'engineer' && schedule.engineerId === user.id) return true;
  return false;
};

export const canCreateWorkOrder = (user: User): boolean => {
  return ['system_admin', 'admin', 'dispatcher'].includes(user.systemRole);
};

export const canAssignWorkOrder = (user: User): boolean => {
  return ['system_admin', 'admin', 'dispatcher', 'engineer_manager'].includes(user.systemRole);
};



