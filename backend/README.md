# Memory Glass — Backend

Memory Glass のバックエンドAPI（サーバーサイド処理）を担当するパッケージです。
本番環境では **Cloud Functions for Firebase v2**（内部的にはGCP Cloud Run）上でサーバーレスに動作します。

## 🛠 技術スタック

| 項目 | 技術 |
|---|---|
| ランタイム | Node.js 22 |
| フレームワーク | Express |
| AIエンジン | Google Gemini API (`@google/genai`) — `gemini-3.1-pro-preview` |
| データベース | Firebase Admin SDK → Cloud Firestore |
| 認証検証 | Firebase Admin SDK (`verifyIdToken`) |
| シークレット管理 | GCP Secret Manager |
| ホスティング | Cloud Functions for Firebase v2 (Cloud Run ベース) |

## 📂 ディレクトリ構成

```
backend/
├── index.js                  # Expressアプリ本体 & Cloud Functions エクスポート
├── middleware/
│   └── authMiddleware.js     # IDトークン検証ミドルウェア
├── services/
│   ├── firebaseAdmin.js      # Firebase Admin SDK 初期化
│   ├── geminiService.js      # Gemini API連携（フラッシュカード生成）
│   └── chatService.js        # Gemini API連携（AIチャットアシスタント）
├── .env.example              # 環境変数テンプレート
└── package.json
```

## 🔐 セキュリティ設計

### 認証フロー
すべてのAPIエンドポイントは `authMiddleware` で保護されています。

1. フロントエンドが Firebase Auth の IDトークンを `Authorization: Bearer <token>` ヘッダーで送信
2. `authMiddleware` が Firebase Admin SDK の `verifyIdToken()` でトークンを検証
3. 検証に成功した場合のみ、リクエストを処理

### シークレット管理
- **ローカル開発**: `.env` ファイルに `GEMINI_API_KEY` を記載
- **本番環境**: GCP Secret Manager に暗号化して保管し、Cloud Functions の `secrets` オプションで自動的に環境変数として注入

```javascript
// index.js での Secret Manager バインド設定例
exports.api = onRequest({
  region: 'asia-northeast1',
  secrets: ["GEMINI_API_KEY"],
}, app);
```

### CORS 設定
本番環境では、許可するオリジン（ドメイン）を明示的に制限しています。

```
https://memory-glass-2026.web.app
https://memory-glass-2026.firebaseapp.com
```

## 📡 APIエンドポイント

### `POST /api/generate-cards`
テキストまたは画像を受け取り、Gemini APIでフラッシュカードを自動生成してFirestoreに保存します。

| パラメータ | 型 | 説明 |
|---|---|---|
| `text` | string | 学習したいテキスト |
| `image` | file | ノート等の写真（multipart/form-data） |

### `POST /api/chat`
AIチャットアシスタントとの会話を処理します。会話履歴を受け取り、Geminiが文脈に基づいて応答を返します。

| パラメータ | 型 | 説明 |
|---|---|---|
| `messages` | array | `{ role, content }` 形式の会話履歴 |

## 🚀 開発コマンド

```bash
# 依存パッケージのインストール
npm install

# ローカル開発サーバーの起動（ポート3000）
node index.js

# 本番環境へのデプロイ（プロジェクトルートから実行）
npx firebase-tools deploy --only functions
```

## 🗄️ Firestore データモデル

```
users/
  └── {userId}/           # Firebase Auth の UID
        └── cards/        # フラッシュカード コレクション
              └── {cardId}/
                    ├── front: string        # カードの表面（質問）
                    ├── back: string         # カードの裏面（答え）
                    ├── createdAt: timestamp # 作成日時
                    ├── interval: number     # 復習間隔（日数）
                    ├── repetitions: number  # 正答した連続回数
                    ├── easeFactor: number   # SM-2 の難易度係数
                    └── nextReviewDate: timestamp # 次回復習予定日
```
