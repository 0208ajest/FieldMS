// Firestore操作ロジック
// UIに影響を与えない独立したデータベース操作

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

// コレクション参照
export const usersCollection = collection(db, 'users');
export const engineersCollection = collection(db, 'engineers');
export const schedulesCollection = collection(db, 'schedules');
export const workOrdersCollection = collection(db, 'workOrders');

// ユーザー操作
export const getUser = async (userId: string) => {
  const userDoc = await getDoc(doc(usersCollection, userId));
  return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
};

export const getUsers = async () => {
  const snapshot = await getDocs(usersCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// エンジニア操作
export const getEngineer = async (engineerId: string) => {
  const engineerDoc = await getDoc(doc(engineersCollection, engineerId));
  return engineerDoc.exists() ? { id: engineerDoc.id, ...engineerDoc.data() } : null;
};

export const getEngineers = async () => {
  const snapshot = await getDocs(engineersCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// スケジュール操作
export const getSchedule = async (scheduleId: string) => {
  const scheduleDoc = await getDoc(doc(schedulesCollection, scheduleId));
  return scheduleDoc.exists() ? { id: scheduleDoc.id, ...scheduleDoc.data() } : null;
};

export const getSchedules = async () => {
  const snapshot = await getDocs(schedulesCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// 作業指示書操作
export const getWorkOrder = async (workOrderId: string) => {
  const workOrderDoc = await getDoc(doc(workOrdersCollection, workOrderId));
  return workOrderDoc.exists() ? { id: workOrderDoc.id, ...workOrderDoc.data() } : null;
};

export const getWorkOrders = async () => {
  const snapshot = await getDocs(workOrdersCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
