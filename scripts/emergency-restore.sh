#!/bin/bash

# 🚨 緊急復元スクリプト
# Firebase実装中に問題が発生した場合に実行します

echo "🚨 緊急復元スクリプトを開始します..."

# 最新のバックアップを取得
LATEST_BACKUP=$(ls -t backups/ | head -n1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "❌ バックアップが見つかりません"
    echo "⚠️  手動でGitから復元してください:"
    echo "   git reset --hard HEAD"
    echo "   git clean -f -d"
    exit 1
fi

echo "📁 最新のバックアップ: $LATEST_BACKUP"

# 現在の変更を破棄
echo "🗑️ 現在の変更を破棄中..."
git reset --hard HEAD
git clean -f -d

# 依存関係を再インストール
echo "📦 依存関係を再インストール中..."
rm -rf node_modules package-lock.json
npm install

# バックアップから復元（必要に応じて）
read -p "🔄 バックアップから設定ファイルを復元しますか？ (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📋 設定ファイルを復元中..."
    cp backups/$LATEST_BACKUP/package.json .
    cp backups/$LATEST_BACKUP/next.config.js .
    cp backups/$LATEST_BACKUP/tailwind.config.js .
    cp backups/$LATEST_BACKUP/postcss.config.mjs .
    
    echo "📦 依存関係を再インストール中..."
    npm install
fi

# 復元テスト
echo "🧪 復元テストを実行中..."

# ビルドテスト
echo "📦 ビルドテストを実行中..."
if npm run build; then
    echo "✅ ビルドテスト: 成功"
else
    echo "❌ ビルドテスト: 失敗"
    echo "⚠️  手動で問題を修正してください"
    exit 1
fi

# リンターテスト
echo "🔍 リンターテストを実行中..."
if npm run lint; then
    echo "✅ リンターテスト: 成功"
else
    echo "❌ リンターテスト: 失敗"
    echo "⚠️  手動で問題を修正してください"
    exit 1
fi

echo ""
echo "🎉 緊急復元が完了しました！"
echo "📁 復元元バックアップ: $LATEST_BACKUP"
echo ""
echo "✅ アプリケーションが正常に復元されました"
echo "🚀 開発サーバーを起動してください: npm run dev"
echo ""
echo "⚠️  次回のFirebase実装時は、より慎重に段階的に実装してください"
