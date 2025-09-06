#!/bin/bash

# 🛡️ UI保護スクリプト
# Firebase実装前に実行してUIを保護します

echo "🛡️ UI保護スクリプトを開始します..."

# 現在の日時を取得
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# バックアップディレクトリの作成
echo "📁 バックアップディレクトリを作成中..."
mkdir -p backups/$TIMESTAMP

# 重要なファイルのバックアップ
echo "💾 重要なファイルをバックアップ中..."

# 設定ファイル
cp package.json backups/$TIMESTAMP/package.json
cp next.config.js backups/$TIMESTAMP/next.config.js
cp tailwind.config.js backups/$TIMESTAMP/tailwind.config.js
cp postcss.config.mjs backups/$TIMESTAMP/postcss.config.mjs

# レイアウトファイル
cp -r src/app backups/$TIMESTAMP/src_app
cp -r src/components backups/$TIMESTAMP/src_components
cp -r src/types backups/$TIMESTAMP/src_types

# 現在の状態をGitにコミット
echo "📝 現在の状態をGitにコミット中..."
git add .
git commit -m "UI完全復元状態 - Firebase実装前のバックアップ ($TIMESTAMP)"

# 保護対象ファイルのリストを作成
echo "📋 保護対象ファイルのリストを作成中..."
cat > backups/$TIMESTAMP/protected-files.txt << EOF
# 🚫 絶対に変更してはいけないファイル

## レイアウト関連ファイル
- src/app/page.tsx
- src/app/layout.tsx
- src/app/globals.css
- src/components/ui/sidebar.tsx

## 設定ファイル
- next.config.js
- tailwind.config.js
- postcss.config.mjs

## UIコンポーネント
- src/components/LoginScreen.tsx
- src/components/Dashboard.tsx
- src/components/EngineerManagement.tsx
- src/components/ScheduleCalendar.tsx
- src/components/DispatchBoard.tsx
- src/components/UserManagement.tsx
- src/components/SettingsPage.tsx
- src/components/NotificationSystem.tsx
- src/components/ProfileDialog.tsx

## バックアップ作成日時: $TIMESTAMP
EOF

# 現在の状態をテスト
echo "🧪 現在の状態をテスト中..."

# ビルドテスト
echo "📦 ビルドテストを実行中..."
if npm run build; then
    echo "✅ ビルドテスト: 成功"
else
    echo "❌ ビルドテスト: 失敗"
    echo "⚠️  Firebase実装を開始する前にビルドエラーを修正してください"
    exit 1
fi

# リンターテスト
echo "🔍 リンターテストを実行中..."
if npm run lint; then
    echo "✅ リンターテスト: 成功"
else
    echo "❌ リンターテスト: 失敗"
    echo "⚠️  Firebase実装を開始する前にリンターエラーを修正してください"
    exit 1
fi

echo ""
echo "🎉 UI保護が完了しました！"
echo "📁 バックアップ場所: backups/$TIMESTAMP/"
echo "📋 保護対象ファイル: backups/$TIMESTAMP/protected-files.txt"
echo ""
echo "⚠️  重要: 保護対象ファイルは絶対に変更しないでください"
echo "📖 実装ガイド: FIREBASE_IMPLEMENTATION_GUIDE.md を参照してください"
echo ""
echo "🚀 Firebase実装を開始する準備が整いました！"
