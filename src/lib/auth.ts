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

// FirebaseユーザーをFirestoreUserに変換
export const convertFirebaseUserToFirestoreUser = (firebaseUser: FirebaseUser): FirestoreUser => {
  return {
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
};
