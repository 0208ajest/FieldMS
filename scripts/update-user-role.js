// 既存ユーザーのロールを更新するスクリプト
// 使用方法: node scripts/update-user-role.js

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, getDoc } = require('firebase/firestore');

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

async function updateUserRole(email, newRole) {
  try {
    console.log(`🔍 Looking for user with email: ${email}`);
    
    // ユーザーを検索（実際の実装では、emailでクエリする必要があります）
    // ここでは手動でユーザーIDを指定する必要があります
    console.log('⚠️  Note: You need to provide the user ID manually');
    console.log('   You can find the user ID in Firebase Console > Authentication > Users');
    
    return false;
  } catch (error) {
    console.error('❌ Error updating user role:', error);
    return false;
  }
}

async function updateUserRoleById(userId, newRole) {
  try {
    console.log(`🔄 Updating user role for ID: ${userId} to: ${newRole}`);
    
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.log('❌ User not found in Firestore');
      return false;
    }
    
    const userData = userDoc.data();
    console.log('📋 Current user data:', userData);
    
    await updateDoc(userRef, {
      systemRole: newRole
    });
    
    console.log('✅ User role updated successfully');
    return true;
  } catch (error) {
    console.error('❌ Error updating user role:', error);
    return false;
  }
}

// コマンドライン引数の処理
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('📖 Usage: node scripts/update-user-role.js <userId> <newRole>');
  console.log('📖 Example: node scripts/update-user-role.js abc123 system_admin');
  console.log('📖 Available roles: system_admin, admin, dispatcher, engineer_manager, engineer');
  process.exit(1);
}

const [userId, newRole] = args;
const validRoles = ['system_admin', 'admin', 'dispatcher', 'engineer_manager', 'engineer'];

if (!validRoles.includes(newRole)) {
  console.log('❌ Invalid role. Available roles:', validRoles.join(', '));
  process.exit(1);
}

// スクリプト実行
updateUserRoleById(userId, newRole)
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
