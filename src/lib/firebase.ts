// Firebase設定ファイル
// UIに影響を与えない独立した設定ファイル

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase設定
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebaseアプリの初期化
const app = initializeApp(firebaseConfig);

// 認証とFirestoreの初期化
export const auth = getAuth(app);
export const db = getFirestore(app);

// デフォルトエクスポート
export default app;

// 設定の検証
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.warn('Firebase設定が不完全です。環境変数を確認してください。');
}
