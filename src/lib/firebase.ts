// Firebase設定ファイル
// UIに影響を与えない独立した設定ファイル

import { initializeApp, getApps } from 'firebase/app';
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

// Firebaseアプリの初期化（既存のアプリがある場合は使用）
let app;
if (getApps().length === 0) {
  // 設定が完全な場合のみ初期化
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
  } else {
    console.warn('Firebase設定が不完全です。環境変数を確認してください。');
    // ダミーの設定で初期化（エラーを防ぐため）
    app = initializeApp({
      apiKey: 'dummy-key',
      authDomain: 'dummy.firebaseapp.com',
      projectId: 'dummy-project',
      storageBucket: 'dummy.appspot.com',
      messagingSenderId: '123456789',
      appId: 'dummy-app-id',
    });
  }
} else {
  app = getApps()[0];
}

// 認証とFirestoreの初期化
export const auth = getAuth(app);
export const db = getFirestore(app);

// デフォルトエクスポート
export default app;
