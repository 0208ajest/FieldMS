// Firebase認証ロジック
// UIに影響を与えない独立した認証ロジック

import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { auth } from './firebase';
import { FirestoreUser } from '@/types';
import { addUser, getUser } from './firestore';

// メール・パスワードでログイン
export const loginWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// ユーザー登録
export const registerWithEmail = async (email: string, password: string, name: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    
    // 管理者メールアドレスのリスト
    const adminEmails = [
      'admin@fieldms.com',
      'system@fieldms.com',
      'manager@fieldms.com'
    ];
    
    // メールアドレスに基づいてロールを決定
    const userEmail = userCredential.user.email || '';
    const isAdmin = adminEmails.includes(userEmail.toLowerCase());
    
    console.log('🔍 Registration Debug Info:');
    console.log('- User Email:', userEmail);
    console.log('- Admin Emails List:', adminEmails);
    console.log('- Is Admin:', isAdmin);
    console.log('- Email Lowercase:', userEmail.toLowerCase());
    
    // Firestoreにユーザー情報を保存
    const firestoreUser: FirestoreUser = {
      id: userCredential.user.uid,
      email: userCredential.user.email || '',
      name: name,
      systemRole: isAdmin ? 'system_admin' : 'engineer', // 管理者メールの場合はsystem_admin
      companyId: 'default-company',
      departmentId: 'default-department',
      isActive: true,
      avatar: userCredential.user.photoURL || undefined,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };
    
    console.log('📝 Firestore User Data:', firestoreUser);
    await addUser(firestoreUser);
    console.log('✅ User added to Firestore successfully');
    
    return userCredential.user;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// ログアウト
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

// 認証状態の監視
export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// 現在のユーザーを取得
export const getCurrentUser = () => {
  return auth.currentUser;
};

// ユーザーのロールを更新（管理者用）
export const updateUserRole = async (userId: string, newRole: 'system_admin' | 'admin' | 'dispatcher' | 'engineer_manager' | 'engineer') => {
  try {
    await updateUser(userId, { systemRole: newRole });
    console.log(`User role updated to ${newRole} for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

// FirebaseユーザーをFirestoreUserに変換（Firestoreから実際のデータを取得）
export const convertFirebaseUserToFirestoreUser = async (firebaseUser: FirebaseUser): Promise<FirestoreUser> => {
  try {
    // Firestoreからユーザー情報を取得（タイムアウト付き）
    const firestoreUser = await Promise.race([
      getUser(firebaseUser.uid),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Firestore timeout')), 2000)
      )
    ]);
    
    if (firestoreUser) {
      console.log('Found user in Firestore:', firestoreUser);
      return firestoreUser as FirestoreUser;
    }
  } catch (error) {
    console.warn('Could not fetch user from Firestore, using default values:', error);
  }
  
  // Firestoreにデータがない場合はデフォルト値を返す
  const defaultUser: FirestoreUser = {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: firebaseUser.displayName || '',
    systemRole: 'engineer', // デフォルトロール
    companyId: 'default-company',
    departmentId: 'default-department',
    isActive: true,
    avatar: firebaseUser.photoURL || undefined,
    createdAt: new Date(),
    lastLoginAt: new Date(),
  };
  
  console.log('Using default user data:', defaultUser);
  return defaultUser;
};
