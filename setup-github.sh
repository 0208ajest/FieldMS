#!/bin/bash

# FieldMS GitHub連携自動化スクリプト

echo "🚀 FieldMS GitHub連携を開始します..."

# 1. GitHub CLI認証確認
if ! gh auth status &> /dev/null; then
    echo "❌ GitHub CLI認証が必要です"
    echo "以下のコマンドを実行してください:"
    echo "gh auth login"
    echo ""
    echo "認証完了後、このスクリプトを再実行してください"
    exit 1
fi

echo "✅ GitHub CLI認証確認完了"

# 2. リポジトリ作成
echo "📦 GitHubリポジトリを作成中..."
gh repo create FieldMS \
    --public \
    --description "フィールドマネジメントシステム - エンジニアを軸とした現場管理Webアプリケーション" \
    --source=. \
    --remote=origin \
    --push

if [ $? -eq 0 ]; then
    echo "✅ GitHubリポジトリ作成・プッシュ完了！"
    echo ""
    echo "🎉 リポジトリURL: https://github.com/$(gh api user --jq .login)/FieldMS"
    echo ""
    echo "📋 次のステップ:"
    echo "1. Vercelでデプロイ: https://vercel.com/new"
    echo "2. GitHubリポジトリを選択"
    echo "3. 自動デプロイ完了"
else
    echo "❌ リポジトリ作成に失敗しました"
    echo "手動でGitHubリポジトリを作成してください"
    echo ""
    echo "手動手順:"
    echo "1. https://github.com/new でリポジトリ作成"
    echo "2. リポジトリ名: FieldMS"
    echo "3. 以下のコマンドを実行:"
    echo "   git remote add origin https://github.com/[ユーザー名]/FieldMS.git"
    echo "   git push -u origin main"
fi
