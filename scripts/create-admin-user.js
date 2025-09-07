// Firebase Admin SDKを使用してシステム管理者ユーザーを作成
// 使用方法: node scripts/create-admin-user.js

const admin = require('firebase-admin');

// Firebase Admin SDKの初期化
// 注意: 実際の使用時は、サービスアカウントキーファイルが必要です
const serviceAccount = {
  // ここにFirebase Consoleからダウンロードしたサービスアカウントキーを貼り付け
  // または、環境変数から読み込み
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'fieldms-production'
  });
}

const db = admin.firestore();

async function createAdminUser() {
  try {
    console.log('🚀 Creating system admin user...');
    
    // システム管理者ユーザーのデータ
    const adminUser = {
      id: 'q53pveJFcxVEuBaIIMEjYovQvZF2',
      email: 'system@fieldms.com',
      name: 'システム管理者',
      systemRole: 'system_admin',
      companyId: 'default-company',
      departmentId: 'default-department',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    // Firestoreにユーザーを作成
    await db.collection('users').doc(adminUser.id).set(adminUser);
    
    console.log('✅ System admin user created successfully!');
    console.log('📋 User details:', adminUser);
    
    return true;
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    return false;
  }
}

// スクリプト実行
createAdminUser()
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
