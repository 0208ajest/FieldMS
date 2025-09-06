# Firebase設定手順

## 1. Firebaseプロジェクトの作成

1. [Firebase Console](https://console.firebase.google.com/)にアクセス
2. 「プロジェクトを作成」をクリック
3. プロジェクト名: `fieldms-production` (または任意の名前)
4. Google Analyticsは無効でOK
5. プロジェクトを作成

## 2. Authenticationの設定

1. 左メニューから「Authentication」を選択
2. 「始める」をクリック
3. 「Sign-in method」タブを選択
4. 「メール/パスワード」を有効化
5. 「保存」をクリック

## 3. Firestore Databaseの設定

1. 左メニューから「Firestore Database」を選択
2. 「データベースを作成」をクリック
3. 「本番環境モードで開始」を選択
4. ロケーション: `asia-northeast1` (東京)
5. 「完了」をクリック

## 4. 環境変数の設定

プロジェクトの設定から以下の情報を取得し、`.env.local`ファイルを作成してください：

```bash
# .env.localファイルを作成
touch .env.local
```

以下の内容を`.env.local`に追加（実際の値に置き換えてください）：

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 5. 設定値の取得方法

1. Firebase Consoleの「プロジェクトの設定」（歯車アイコン）をクリック
2. 「全般」タブの「マイアプリ」セクション
3. Webアプリがない場合は「</>」アイコンをクリックして追加
4. アプリ名: `FieldMS Web`
5. 「Firebase Hostingも設定する」はチェックしない
6. 「アプリを登録」をクリック
7. 表示される設定オブジェクトから値をコピー

## 6. セキュリティルールの設定

Firestore Database > ルールタブで以下を設定：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 認証されたユーザーのみアクセス可能
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 7. 設定完了の確認

環境変数設定後、以下を実行して確認：

```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスし、エラーが発生しないことを確認してください。
