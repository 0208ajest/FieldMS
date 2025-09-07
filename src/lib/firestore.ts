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
} from 'firebase/firestore';
import { db } from './firebase';
import { FirestoreUser, FirestoreEngineer, FirestoreSchedule, FirestoreWorkOrder } from '@/types';

// コレクション参照
export const usersCollection = collection(db, 'users');
export const engineersCollection = collection(db, 'engineers');
export const schedulesCollection = collection(db, 'schedules');
export const workOrdersCollection = collection(db, 'workOrders');
export const companiesCollection = collection(db, 'companies');

// ユーザー操作
export const addUser = async (userData: Omit<FirestoreUser, 'id'>) => {
  const docRef = await addDoc(usersCollection, userData);
  return docRef.id; // 実際のドキュメントIDを返す
};
export const getUser = async (userId: string) => {
  const userDoc = await getDoc(doc(usersCollection, userId));
  return userDoc.exists() ? { id: userDoc.id, ...userDoc.data() } : null;
};
export const getUsers = async () => {
  const snapshot = await getDocs(usersCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
export const updateUser = async (userId: string, data: Partial<Omit<FirestoreUser, 'id'>>) => {
  console.log('🔄 updateUser called with:', { userId, data });
  
  // ドキュメントの存在確認
  const docRef = doc(usersCollection, userId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error(`Document with ID ${userId} does not exist`);
  }
  
  console.log('✅ Document exists, proceeding with update');
  return updateDoc(docRef, data);
};
export const deleteUser = async (userId: string) => {
  console.log('🔥 deleteUser called with userId:', userId);
  console.log('🔥 Document path:', `users/${userId}`);
  
  try {
    const docRef = doc(usersCollection, userId);
    console.log('🔥 Document reference created:', docRef.path);
    
    await deleteDoc(docRef);
    console.log('✅ Document deleted successfully from Firestore');
    return true;
  } catch (error) {
    console.error('❌ Error deleting document from Firestore:', error);
    throw error;
  }
};

// エンジニア操作
export const addEngineer = async (engineerData: Omit<FirestoreEngineer, 'id'>) => {
  const docRef = await addDoc(engineersCollection, engineerData);
  return docRef.id; // 実際のドキュメントIDを返す
};
export const getEngineer = async (engineerId: string) => {
  const engineerDoc = await getDoc(doc(engineersCollection, engineerId));
  return engineerDoc.exists() ? { id: engineerDoc.id, ...engineerDoc.data() } : null;
};
export const getEngineers = async () => {
  const snapshot = await getDocs(engineersCollection);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
    } as FirestoreEngineer;
  });
};
export const updateEngineer = async (engineerId: string, data: Partial<Omit<FirestoreEngineer, 'id'>>) => {
  console.log('🔄 updateEngineer called with:', { engineerId, data });
  
  // ドキュメントの存在確認
  const docRef = doc(engineersCollection, engineerId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    throw new Error(`Engineer document with ID ${engineerId} does not exist`);
  }
  
  console.log('✅ Engineer document exists, proceeding with update');
  return updateDoc(docRef, data);
};
export const deleteEngineer = async (engineerId: string) => {
  console.log('🔥 deleteEngineer called with engineerId:', engineerId);
  console.log('🔥 Document path:', `engineers/${engineerId}`);
  
  try {
    const docRef = doc(engineersCollection, engineerId);
    console.log('🔥 Document reference created:', docRef.path);
    
    await deleteDoc(docRef);
    console.log('✅ Engineer document deleted successfully from Firestore');
    return true;
  } catch (error) {
    console.error('❌ Error deleting engineer document from Firestore:', error);
    throw error;
  }
};

// スケジュール操作（古い定義は削除、新しい定義を下記で使用）

// 作業指示書操作
export const addWorkOrder = async (workOrderData: Omit<FirestoreWorkOrder, 'id'>) => {
  const docRef = await addDoc(workOrdersCollection, workOrderData);
  return docRef.id; // 実際のドキュメントIDを返す
};
export const getWorkOrder = async (workOrderId: string) => {
  const workOrderDoc = await getDoc(doc(workOrdersCollection, workOrderId));
  return workOrderDoc.exists() ? { id: workOrderDoc.id, ...workOrderDoc.data() } : null;
};
export const getWorkOrders = async () => {
  const snapshot = await getDocs(workOrdersCollection);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
      dueDate: data.dueDate?.toDate ? data.dueDate.toDate() : (data.dueDate ? new Date(data.dueDate) : undefined),
    } as FirestoreWorkOrder;
  });
};
export const updateWorkOrder = (workOrderId: string, data: Partial<FirestoreWorkOrder>) => updateDoc(doc(workOrdersCollection, workOrderId), data);
export const deleteWorkOrder = (workOrderId: string) => deleteDoc(doc(workOrdersCollection, workOrderId));

// エンジニアの案件数計算
export const calculateEngineerProjectCounts = async (engineerId: string) => {
  try {
    // スケジュールから案件数を取得
    const scheduleQuery = query(
      schedulesCollection,
      where('engineerId', '==', engineerId)
    );
    const scheduleSnapshot = await getDocs(scheduleQuery);
    const schedules = scheduleSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // 作業指示から案件数を取得
    const workOrderQuery = query(
      workOrdersCollection,
      where('engineerId', '==', engineerId)
    );
    const workOrderSnapshot = await getDocs(workOrderQuery);
    const workOrders = workOrderSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // 現在時刻を取得
    const now = new Date();

    // 総案件数（スケジュール + 作業指示）
    const totalProjects = schedules.length + workOrders.length;

    // 完了案件数（予定時刻が過ぎているもの）
    const completedSchedules = schedules.filter(schedule => {
      const endTime = schedule.endTime?.toDate ? schedule.endTime.toDate() : new Date(schedule.endTime);
      return endTime < now;
    });

    const completedWorkOrders = workOrders.filter(workOrder => {
      // 作業指示の完了判定（予定完了時刻が過ぎている、または明示的に完了ステータス）
      if (workOrder.status === 'completed') return true;
      
      // 予定完了時刻での判定（estimatedDurationから計算）
      if (workOrder.createdAt && workOrder.estimatedDuration) {
        const createdAt = workOrder.createdAt?.toDate ? workOrder.createdAt.toDate() : new Date(workOrder.createdAt);
        const estimatedEndTime = new Date(createdAt.getTime() + workOrder.estimatedDuration * 60 * 1000); // 分をミリ秒に変換
        return estimatedEndTime < now;
      }
      
      return false;
    });

    const completedProjects = completedSchedules.length + completedWorkOrders.length;

    return {
      totalProjects,
      completedProjects
    };
  } catch (error) {
    console.error('案件数計算エラー:', error);
    return {
      totalProjects: 0,
      completedProjects: 0
    };
  }
};

// スケジュール操作
export const addSchedule = async (scheduleData: Omit<FirestoreSchedule, 'id'>) => {
  const docRef = await addDoc(schedulesCollection, scheduleData);
  return docRef.id; // 実際のドキュメントIDを返す
};

export const getSchedules = async () => {
  const snapshot = await getDocs(schedulesCollection);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startTime: data.startTime?.toDate ? data.startTime.toDate() : new Date(data.startTime),
      endTime: data.endTime?.toDate ? data.endTime.toDate() : new Date(data.endTime),
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
    } as FirestoreSchedule;
  });
};

export const getSchedule = async (scheduleId: string) => {
  const scheduleDoc = await getDoc(doc(schedulesCollection, scheduleId));
  if (!scheduleDoc.exists()) return null;
  
  const data = scheduleDoc.data();
  return {
    id: scheduleDoc.id,
    ...data,
    startTime: data.startTime?.toDate ? data.startTime.toDate() : new Date(data.startTime),
    endTime: data.endTime?.toDate ? data.endTime.toDate() : new Date(data.endTime),
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
  } as FirestoreSchedule;
};

export const updateSchedule = async (scheduleId: string, data: Partial<Omit<FirestoreSchedule, 'id'>>) => {
  console.log('🔄 updateSchedule called with:', { scheduleId, data });
  const docRef = doc(schedulesCollection, scheduleId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    throw new Error(`Schedule document with ID ${scheduleId} does not exist`);
  }
  console.log('✅ Schedule document exists, proceeding with update');
  return updateDoc(docRef, data);
};

export const deleteSchedule = async (scheduleId: string) => {
  console.log('🗑️ deleteSchedule called with:', scheduleId);
  return deleteDoc(doc(schedulesCollection, scheduleId));
};

// エンジニアIDでスケジュールを取得
export const getSchedulesByEngineer = async (engineerId: string) => {
  const scheduleQuery = query(
    schedulesCollection,
    where('engineerId', '==', engineerId)
  );
  const scheduleSnapshot = await getDocs(scheduleQuery);
  return scheduleSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startTime: data.startTime?.toDate ? data.startTime.toDate() : new Date(data.startTime),
      endTime: data.endTime?.toDate ? data.endTime.toDate() : new Date(data.endTime),
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
    } as FirestoreSchedule;
  });
};

// 企業操作
export const getCompany = async (companyId: string) => {
  const companyDoc = await getDoc(doc(companiesCollection, companyId));
  return companyDoc.exists() ? { id: companyDoc.id, ...companyDoc.data() } : null;
};

export const getCompanies = async () => {
  const snapshot = await getDocs(companiesCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const addCompany = async (companyData: Record<string, unknown>) => {
  const docRef = await addDoc(companiesCollection, companyData);
  return docRef.id;
};

export const updateCompany = async (companyId: string, data: Record<string, unknown>) => {
  const docRef = doc(companiesCollection, companyId);
  await updateDoc(docRef, data);
};

export const deleteCompany = async (companyId: string) => {
  const docRef = doc(companiesCollection, companyId);
  await deleteDoc(docRef);
};
