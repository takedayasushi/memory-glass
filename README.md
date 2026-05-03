# Memory Glass 🧠✨

**🌐 Public URL:** [https://memory-glass-2026.web.app](https://memory-glass-2026.web.app)

Memory Glass は、テキストやノートの写真を放り込むだけで、AIが内容を理解・整理し、記憶への定着（短期記憶から長期記憶へ）を全自動でサポートするフルスタック・ウェブアプリケーションです。

---

## 📂 プロジェクト構成

```
memory-glass/
├── frontend/              # React フロントエンド
├── backend/               # Node.js/Express バックエンドAPI
├── docs/                  # アーキテクチャドキュメント
├── .github/workflows/     # CI/CD (GitHub Actions)
├── firebase.json          # Firebase デプロイ設定
├── firestore.rules        # Firestore セキュリティルール
└── .gitignore             # Git 除外設定（秘密情報保護）
```

各パッケージの詳細は、それぞれの README をご覧ください。

| パッケージ | 説明 | ドキュメント |
|---|---|---|
| **frontend/** | React + Vite によるUI。Glassmorphism デザインシステム、Firebase Auth/Firestore Client SDK を利用 | [frontend/README.md](./frontend/README.md) |
| **backend/** | Node.js + Express によるAPI。Gemini AI連携、Firebase Admin SDK による特権DB操作 | [backend/README.md](./backend/README.md) |

### 📖 技術ドキュメント (`docs/`)

| ドキュメント | 内容 |
|---|---|
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | システム全体の3層アーキテクチャ、GCP/Firebaseサービス一覧、データフロー図（Mermaid）、Firestoreデータモデル |
| [API_REFERENCE.md](./docs/API_REFERENCE.md) | REST APIエンドポイント仕様、リクエスト/レスポンスの具体例（curl付き）、エラーハンドリング |
| [SPACED_REPETITION.md](./docs/SPACED_REPETITION.md) | SM-2アルゴリズムの数式・実装コード解説、パラメータ推移のシミュレーション表 |
| [SECURITY.md](./docs/SECURITY.md) | 多層防御の設計思想、脅威モデルと対策、セキュリティチェックリスト |
| [DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) | ローカル開発環境のセットアップから本番デプロイ（手動/GitHub Actions）までの手順 |

---

## 🎯 主要機能

### 1. シームレスなインプット（入力の自動化）
*   **テキスト入力**: 長文テキストをペーストするだけで、重要なキーワードを抽出します。
*   **写真アップロード**: ノートやホワイトボードの写真をアップロードするだけで、AI (Google Gemini Vision) が文字と文脈を読み取ります。

### 2. AIによる記憶の構造化（短期記憶サポート）
入力された情報から「一番覚えるべきポイント」をAIが自動抽出し、フラッシュカードやQA形式（一問一答）の「記憶アイテム」を自動生成します。

### 3. 忘却曲線を意識した復習（長期記憶サポート）
**SuperMemo-2 (SM-2)** に基づく間隔反復アルゴリズムを採用。ユーザーはフラッシュカードの裏側にある「Forgot」「Hard」「Good」「Easy」の4つのボタンでフィードバックを返すだけで、システムが「忘れかける絶妙なタイミング」を計算し、次回の出題日時を自動決定します。

### 4. 2つの学習モード切り替え（一覧モード ＆ 定着学習モード）
*   **📋 一覧モード**: 登録されている全カードをまとめてスクロール閲覧できる機能。
*   **🧠 定着学習モード**: SM-2アルゴリズムに基づき「復習が必要なカード」から順に1枚ずつ美しいアニメーション（フェードイン・スライドアップ）付きで学習できる機能。学習完了画面やナビゲーション付き。

### 5. 記憶定着度の可視化ダッシュボード
カードに登録された間隔反復データから、各カードの「記憶定着度（%）」を算出し、ダッシュボード上に高・中・低の定着度別枚数と全体の平均定着率を美しいカラーグラフ付きで視覚化します。

### 6. カードの削除機能
各フラッシュカードの表面・裏面の右上に「✕」ボタンを搭載し、不要なカードを1タップで確認ダイアログ付きでリアルタイム削除できます。

### 7. Firestore リアルタイムビューア ＆ 実行クエリログ
DBの中身をリアルタイムに可視化するビューアを搭載。さらに、追加・削除・復習更新時に実際に実行されたクエリが「クエリ履歴ログ」エリアにJavaScriptコード形式でタイムスタンプ付きで自動的に表示されます。AIチャットでデータ構造について質問することも可能です。

---

## 🏗 システムアーキテクチャ概要

> 📖 **詳細なアーキテクチャドキュメント**: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
>
> データフロー図、セキュリティ多層防御の設計、Firestoreデータモデル、CI/CDパイプラインなど、
> システム全体の詳細な技術解説をまとめています。

本プロジェクトは、Google Cloud Platform (GCP) と Firebase の各種サービスを組み合わせた **3層アーキテクチャ** で構築されています。

| レイヤー | 技術 | GCP/Firebase サービス |
|---|---|---|
| **プレゼンテーション層** | React + Vite, Glassmorphism CSS | Firebase Hosting (CDN) |
| **ビジネスロジック層** | Node.js + Express, Gemini API | Cloud Functions v2 (Cloud Run) |
| **データ層** | NoSQL ドキュメントDB | Cloud Firestore |
| **認証** | Google OAuth 2.0 | Firebase Authentication |
| **シークレット管理** | APIキーの暗号化保管 | GCP Secret Manager |
| **CI/CD** | 自動ビルド＆デプロイ | GitHub Actions |

### データフローの概要

```
ユーザーがテキスト/画像を入力
  → フロントエンド: IDトークン(JWT)を取得し、バックエンドAPIへ送信
  → バックエンド: トークンを検証 → Gemini APIでフラッシュカード生成 → Firestoreに保存
  → Firestore: onSnapshot でフロントエンドにリアルタイム通知
  → フロントエンド: 画面リロードなしでカードが自動表示
```

### セキュリティの多層防御

本プロジェクトでは5つの独立したセキュリティレイヤーで保護しています。

1. **Firebase Authentication** — Google OAuth によるユーザー認証と JWT 発行
2. **authMiddleware** — バックエンドでの IDトークン署名検証
3. **Firestore Security Rules** — 「自分の UID のデータのみ」読み書き許可
4. **GCP Secret Manager** — API キーの暗号化保管（ソースコードに一切含まない）
5. **CORS ホワイトリスト** — 許可されたドメインからのリクエストのみ受付

---

## 🎨 デザイン方針 (UI/UX)

**Glassmorphism（グラスモーフィズム）** を採用した、モダンで直感的なインターフェースです。

- すりガラス効果（`backdrop-filter: blur(12px)`）と半透明パネル
- ブルー〜パープルのグラデーション背景
- ダークモード自動対応（`prefers-color-scheme: dark`）
- **PC**: 2カラムレイアウト（左: アプリ操作、右: DBリアルタイムビューア）
- **スマホ**: タブ切り替え式のレスポンシブデザイン

---

## 🔄 CI/CD（GitHub Actions）

`main` ブランチにコードが Push されると、GitHub Actions が以下を自動実行します。

1. フロントエンドの依存関係インストール → 本番ビルド（`npm run build`）
2. バックエンドの依存関係インストール
3. Firebase Hosting と Cloud Functions への同時デプロイ

> **セットアップ**: GitHub リポジトリの Settings → Secrets に `FIREBASE_TOKEN` を登録する必要があります。
> トークンは `npx firebase-tools login:ci` で発行できます。

---

## 🚀 ローカルでの開発手順

```bash
# 1. リポジトリのクローン
git clone https://github.com/takedayasushi/memory-glass.git
cd memory-glass

# 2. フロントエンドの起動
cd frontend
npm install
npm run dev
# → http://localhost:5173 でアクセス可能

# 3. バックエンドの起動 (別のターミナルで実行)
cd backend
npm install
cp .env.example .env
# .env ファイルに GEMINI_API_KEY を設定してください
node index.js
# → http://localhost:3000 でAPIが起動
```

> ⚠️ ローカル開発時は、フロントエンドの API 通信先を `localhost:3000` に変更する必要があります。
