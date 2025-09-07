# Firestore REST API クエリ集

## システム管理者ユーザーの作成

### 1. システム管理者ユーザーを作成

```bash
curl -X POST \
  "https://firestore.googleapis.com/v1/projects/fieldms-production/databases/(default)/documents/users" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "id": {"stringValue": "q53pveJFcxVEuBaIIMEjYovQvZF2"},
      "email": {"stringValue": "system@fieldms.com"},
      "name": {"stringValue": "システム管理者"},
      "systemRole": {"stringValue": "system_admin"},
      "companyId": {"stringValue": "default-company"},
      "departmentId": {"stringValue": "default-department"},
      "isActive": {"booleanValue": true},
      "createdAt": {"timestampValue": "2025-09-06T13:00:00Z"},
      "lastLoginAt": {"timestampValue": "2025-09-06T13:00:00Z"}
    }
  }'
```

### 2. テスト用エンジニアユーザーを作成

```bash
curl -X POST \
  "https://firestore.googleapis.com/v1/projects/fieldms-production/databases/(default)/documents/users" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "id": {"stringValue": "test-engineer-001"},
      "email": {"stringValue": "engineer@fieldms.com"},
      "name": {"stringValue": "テストエンジニア"},
      "systemRole": {"stringValue": "engineer"},
      "companyId": {"stringValue": "default-company"},
      "departmentId": {"stringValue": "default-department"},
      "isActive": {"booleanValue": true},
      "createdAt": {"timestampValue": "2025-09-06T13:00:00Z"},
      "lastLoginAt": {"timestampValue": "2025-09-06T13:00:00Z"}
    }
  }'
```

### 3. 既存ユーザーのロールを更新

```bash
curl -X PATCH \
  "https://firestore.googleapis.com/v1/projects/fieldms-production/databases/(default)/documents/users/q53pveJFcxVEuBaIIMEjYovQvZF2" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "systemRole": {"stringValue": "system_admin"}
    }
  }'
```

## 使用方法

1. **アクセストークンを取得**:
   - Firebase Console → プロジェクト設定 → サービスアカウント
   - 新しい秘密鍵を生成してダウンロード

2. **アクセストークンを取得**:
   ```bash
   gcloud auth application-default print-access-token
   ```

3. **クエリを実行**:
   - 上記のクエリの `YOUR_ACCESS_TOKEN` を実際のトークンに置き換え
   - ターミナルで実行

## 注意事項

- プロジェクトID: `fieldms-production`
- データベースID: `(default)`
- コレクションID: `users`
- ドキュメントID: ユーザーのUID
