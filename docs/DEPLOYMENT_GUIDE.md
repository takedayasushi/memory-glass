# Memory Glass — デプロイメントガイド

ローカル開発環境のセットアップから、GCP/Firebase への本番デプロイまでの手順を解説します。

---

## 1. 前提条件

| ツール | バージョン | 用途 |
|---|---|---|
| Node.js | 22.x | ランタイム |
| npm | 10.x | パッケージ管理 |
| Firebase CLI | latest | デプロイ・設定 |
| Git | 2.x | バージョン管理 |
| Google アカウント | — | Firebase / GCP へのアクセス |

---

## 2. ローカル開発環境のセットアップ

### 2.1 リポジトリのクローン

```bash
git clone https://github.com/takedayasushi/memory-glass.git
cd memory-glass
```

### 2.2 フロントエンドの準備

```bash
cd frontend
npm install
```

### 2.3 バックエンドの準備

```bash
cd backend
npm install
cp .env.example .env
```

`.env` ファイルを編集し、Gemini API キーを設定:

```
GEMINI_API_KEY="your-api-key-here"
```

> API キーは [Google AI Studio](https://aistudio.google.com/) から取得できます。

### 2.4 ローカルサーバーの起動

**ターミナル 1 (バックエンド):**
```bash
cd backend && node index.js
# → http://localhost:3000
```

**ターミナル 2 (フロントエンド):**
```bash
cd frontend && npm run dev
# → http://localhost:5173
```

> ⚠️ ローカル開発時は `App.jsx` と `AiChat.jsx` の API URL を `http://localhost:3000` に変更する必要があります。

---

## 3. Firebase プロジェクトのセットアップ

### 3.1 Firebase CLI のインストールとログイン

```bash
npx -y firebase-tools@latest login
```

### 3.2 プロジェクトの選択

```bash
npx -y firebase-tools@latest use memory-glass-2026
```

### 3.3 Gemini API キーの Secret Manager 登録

```bash
npx -y firebase-tools@latest functions:secrets:set GEMINI_API_KEY
# プロンプトが表示されたら API キーを入力
```

---

## 4. 本番環境へのデプロイ

### 4.1 手動デプロイ

```bash
# フロントエンドのビルド
cd frontend && npm run build && cd ..

# Firestore ルール + Functions + Hosting を一括デプロイ
npx -y firebase-tools@latest deploy
```

### 4.2 個別デプロイ

```bash
# Firestore セキュリティルールのみ
npx -y firebase-tools@latest deploy --only firestore:rules

# Cloud Functions（バックエンド）のみ
npx -y firebase-tools@latest deploy --only functions

# Firebase Hosting（フロントエンド）のみ
npx -y firebase-tools@latest deploy --only hosting
```

### 4.3 自動デプロイ（GitHub Actions）

`main` ブランチへの Push で自動実行されます。

**初回セットアップ:**

1. Firebase CI トークンを発行:
```bash
npx -y firebase-tools@latest login:ci
# 表示される長いトークンをコピー
```

2. GitHub リポジトリの Settings → Secrets → Actions に登録:
   - **Name**: `FIREBASE_TOKEN`
   - **Secret**: コピーしたトークン

以降は `git push origin main` で自動デプロイが実行されます。

---

## 5. デプロイ後の確認

| 確認項目 | URL / コマンド |
|---|---|
| フロントエンド | https://memory-glass-2026.web.app |
| バックエンドAPI | https://asia-northeast1-memory-glass-2026.cloudfunctions.net/api |
| Firebase Console | https://console.firebase.google.com/project/memory-glass-2026 |
| GitHub Actions | https://github.com/takedayasushi/memory-glass/actions |

### 動作確認チェックリスト

- [ ] Google アカウントでログインできる
- [ ] テキストからフラッシュカードが生成される
- [ ] カードの復習ボタン（Good等）で DB が更新される
- [ ] DB ビューアにリアルタイムでデータが反映される
- [ ] AI チャットが応答する（About ページ・DB ビューア）
- [ ] 別ブラウザ/スマホからもアクセスできる
