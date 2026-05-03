# Memory Glass — セキュリティ設計書

本ドキュメントでは、Memory Glass の多層防御セキュリティアーキテクチャを解説します。

---

## 1. セキュリティレイヤー全体像

5つの独立したレイヤーで保護しています。

```
Layer 5: CORS ホワイトリスト — 許可ドメイン以外をブロック
Layer 4: GCP Secret Manager — APIキーの暗号化保管
Layer 3: Firestore Security Rules — 自分のUIDのデータのみ許可
Layer 2: authMiddleware — JWT署名・有効期限を検証
Layer 1: Firebase Authentication — Google OAuth認証・トークン発行
```

---

## 2. 脅威モデルと対策

### 2.1 なりすまし攻撃
- **Layer 1**: Firebase Auth が Google OAuth でユーザーを認証し JWT を発行
- **Layer 2**: `authMiddleware` が `admin.auth().verifyIdToken()` で署名・発行元・有効期限を検証

### 2.2 他人のデータへの不正アクセス
- **Layer 3**: Firestore Rules が `request.auth.uid == userId` を強制

```
match /users/{userId}/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

- バックエンドも認証済み UID のパスにのみ書き込む実装

### 2.3 APIキーの漏洩
- **Layer 4**: 本番は GCP Secret Manager で暗号化保管、`secrets` オプションで自動注入
- `.gitignore` で `.env`, `serviceAccountKey.json` を除外

### 2.4 不正オリジンからのリクエスト
- **Layer 5**: CORS ホワイトリストで本番ドメインのみ許可

```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'https://memory-glass-2026.web.app',
  'https://memory-glass-2026.firebaseapp.com'
];
```

### 2.5 サービスアカウントキーの漏洩
- `.gitignore` で完全除外
- 本番は Application Default Credentials でキーファイル不要

---

## 3. データ保護

| 項目 | 対策 |
|---|---|
| 通信の暗号化 | HTTPS (TLS 1.3) をデフォルト強制 |
| 保存時暗号化 | Firestore / Secret Manager が自動適用 |
| ユーザーデータ分離 | `users/{uid}/` パスで完全分離 + Rules で遮断 |

---

## 4. Git リポジトリの保護

`.gitignore` で除外されているファイル:

| ファイル | 含まれる秘密情報 |
|---|---|
| `.env` | Gemini API キー |
| `serviceAccountKey.json` | Firebase Admin 全権限キー |
| `.firebase/` | デプロイキャッシュ |

---

## 5. セキュリティチェックリスト

- [ ] Firestore Rules がデフォルト拒否モードであること
- [ ] `.env` と `serviceAccountKey.json` が `.gitignore` に含まれていること
- [ ] API キーが GCP Secret Manager に保管されていること
- [ ] CORS に本番ドメインのみ含まれていること
- [ ] Git 履歴に過去のキー情報が含まれていないこと
