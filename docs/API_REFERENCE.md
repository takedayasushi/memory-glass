# Memory Glass — API リファレンス

本ドキュメントでは、Memory Glass バックエンドが提供するすべての REST API エンドポイントの仕様を、リクエスト・レスポンスの具体例とともに詳細に解説します。

---

## 共通仕様

### ベースURL

| 環境 | URL |
|---|---|
| 本番 | `https://asia-northeast1-memory-glass-2026.cloudfunctions.net/api` |
| ローカル | `http://localhost:3000` |

### 認証

すべてのエンドポイントは **Firebase Authentication の IDトークン (JWT)** による認証が必須です。

```
Authorization: Bearer <IDトークン>
```

トークンが無い、または不正な場合は以下のエラーが返されます：

| ステータス | 条件 |
|---|---|
| `401 Unauthorized` | トークンが未提供 (`No token provided`) |
| `403 Forbidden` | トークンが無効または期限切れ (`Invalid token`) |

### IDトークンの取得方法（フロントエンド）

```javascript
const user = auth.currentUser;
const idToken = await user.getIdToken();
```

Firebase Auth SDK が自動的にトークンの有効期限を管理し、必要に応じて更新します。トークンの有効期限は通常 **1時間** です。

---

## エンドポイント一覧

| メソッド | パス | 概要 |
|---|---|---|
| `POST` | `/api/generate-cards` | テキスト/画像からフラッシュカードを生成・保存 |
| `POST` | `/api/chat` | AIチャットアシスタントとの会話 |

---

## POST `/api/generate-cards`

テキストまたは画像を受け取り、Gemini API でフラッシュカードを自動生成し、Firestore に保存します。

### リクエスト

**Content-Type:** `multipart/form-data`

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `text` | string | △ | 学習したいテキスト。`text` か `image` のいずれかが必須 |
| `image` | file | △ | ノート・ホワイトボード等の画像ファイル。JPEG, PNG, WebP に対応 |

> ⚠️ `text` と `image` の両方を同時に送信することも可能です。その場合、AIは両方の情報を統合して解析します。

### リクエスト例（curl）

```bash
# テキストからカードを生成
curl -X POST \
  https://asia-northeast1-memory-glass-2026.cloudfunctions.net/api/api/generate-cards \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -F "text=Reactは仮想DOMを使ってUIを効率的に更新するJavaScriptライブラリです。コンポーネントベースの設計により再利用性が高まります。"

# 画像からカードを生成
curl -X POST \
  https://asia-northeast1-memory-glass-2026.cloudfunctions.net/api/api/generate-cards \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -F "image=@/path/to/notes.jpg"
```

### レスポンス（成功: 200）

```json
{
  "success": true,
  "cards": [
    {
      "id": "abc123def456",
      "front": "Reactが使用する、UIの効率的な更新技術とは何か？",
      "back": "仮想DOM（Virtual DOM）。実際のDOMとの差分だけを計算し、最小限の更新で画面を再描画する仕組み。",
      "createdAt": "2026-05-03T07:30:00.000Z",
      "nextReviewDate": "2026-05-03T07:30:00.000Z",
      "interval": 0,
      "easeFactor": 2.5
    },
    {
      "id": "ghi789jkl012",
      "front": "Reactの設計手法で、コードの再利用性を高めるアプローチとは？",
      "back": "コンポーネントベース設計。UIを独立した再利用可能な部品（コンポーネント）に分割して構築する。",
      "createdAt": "2026-05-03T07:30:00.000Z",
      "nextReviewDate": "2026-05-03T07:30:00.000Z",
      "interval": 0,
      "easeFactor": 2.5
    }
  ]
}
```

### レスポンス（エラー: 400）

```json
{
  "error": "Please provide text or an image."
}
```

### レスポンス（エラー: 500）

```json
{
  "error": "Failed to process request."
}
```

### 処理の内部フロー

1. `authMiddleware` で IDトークンを検証 → `req.user.uid` を取得
2. `multer` でアップロードされた画像をメモリ上のバッファに読み込み
3. `geminiService.generateFlashcards()` で Gemini API に解析を依頼
   - `responseMimeType: "application/json"` を指定し、構造化された JSON を直接取得
4. `db.batch()` で Firestore に一括書き込み（パス: `users/{uid}/cards/{autoId}`）
5. 各カードに SM-2 の初期パラメータを付与（`interval: 0`, `easeFactor: 2.5`）

---

## POST `/api/chat`

AIチャットアシスタントとの会話を処理します。会話履歴全体を受け取り、Gemini が文脈を理解した応答を返します。

### リクエスト

**Content-Type:** `application/json`

```json
{
  "messages": [
    { "role": "assistant", "content": "こんにちは！何でも聞いてください。" },
    { "role": "user", "content": "Firestoreのセキュリティルールについて教えて" }
  ]
}
```

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `messages` | array | ○ | `{ role, content }` 形式の会話履歴配列 |
| `messages[].role` | string | ○ | `"user"` または `"assistant"` |
| `messages[].content` | string | ○ | メッセージ本文 |

### レスポンス（成功: 200）

```json
{
  "success": true,
  "reply": "Firestoreのセキュリティルールは、データベースへのアクセスを制御する仕組みです。Memory Glassでは..."
}
```

### レスポンス（エラー: 400）

```json
{
  "success": false,
  "error": "Invalid messages format"
}
```

### 処理の内部フロー

1. `authMiddleware` で IDトークンを検証
2. `chatService.handleChat()` で会話履歴を Gemini API に転送
   - `systemInstruction` に Memory Glass の技術詳細を含むプロンプトを設定
   - フロントエンドの `role: "assistant"` を Gemini の `role: "model"` に変換
3. Gemini が文脈を考慮した日本語の応答を生成して返却

---

## エラーハンドリング

すべてのエンドポイントで共通のエラーレスポンス形式：

| ステータスコード | 意味 | 原因 |
|---|---|---|
| `400` | Bad Request | リクエストパラメータ不足・不正 |
| `401` | Unauthorized | IDトークン未提供 |
| `403` | Forbidden | IDトークンが無効・期限切れ |
| `500` | Internal Server Error | Gemini API エラー、Firestore 書き込みエラーなど |
