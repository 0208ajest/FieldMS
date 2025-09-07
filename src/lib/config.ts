// アプリケーション設定
// Firebase統合の有効/無効を制御

export const APP_CONFIG = {
  // Firebase統合を有効にするかどうか
  // 環境変数で制御可能
  ENABLE_FIREBASE: process.env.NEXT_PUBLIC_ENABLE_FIREBASE === 'true',
  
  // デフォルトは無効（既存のモック認証を使用）
  // 有効にする場合は .env.local に NEXT_PUBLIC_ENABLE_FIREBASE=true を追加
  USE_MOCK_AUTH: !process.env.NEXT_PUBLIC_ENABLE_FIREBASE || process.env.NEXT_PUBLIC_ENABLE_FIREBASE !== 'true',
} as const;

// 設定の検証
if (APP_CONFIG.ENABLE_FIREBASE) {
  console.log('🔥 Firebase統合が有効です');
} else {
  console.log('📝 モック認証を使用しています');
}
