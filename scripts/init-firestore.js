// Firestoreデータベースの初期化スクリプト
// 使用方法: node scripts/init-firestore.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');

// Firebase設定（環境変数から取得）
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase初期化
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function initFirestore() {
  try {
    console.log('🚀 Initializing Firestore database...');
    
    // システム管理者ユーザーの作成
    const adminUser = {
      id: 'q53pveJFcxVEuBaIIMEjYovQvZF2',
      email: 'system@fieldms.com',
      name: 'システム管理者',
      systemRole: 'system_admin',
      companyId: 'default-company',
      departmentId: 'default-department',
      isActive: true,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };
    
    console.log('📝 Creating admin user...');
    await setDoc(doc(db, 'users', adminUser.id), adminUser);
    console.log('✅ Admin user created successfully');
    
    // テスト用エンジニアユーザーの作成
    const engineerUser = {
      id: 'test-engineer-001',
      email: 'engineer@fieldms.com',
      name: 'テストエンジニア',
      systemRole: 'engineer',
      companyId: 'default-company',
      departmentId: 'default-department',
      isActive: true,
      createdAt: new Date(),
      lastLoginAt: new Date(),
    };
    
    console.log('📝 Creating test engineer user...');
    await setDoc(doc(db, 'users', engineerUser.id), engineerUser);
    console.log('✅ Test engineer user created successfully');
    
    console.log('🎉 Firestore initialization completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error initializing Firestore:', error);
    return false;
  }
}

// スクリプト実行
initFirestore()
  .then((success) => {
    if (success) {
      console.log('🎉 Script completed successfully');
    } else {
      console.log('💥 Script failed');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Script error:', error);
    process.exit(1);
  });
