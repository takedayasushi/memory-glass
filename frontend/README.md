# Memory Glass — Frontend

Memory Glass のフロントエンド（ユーザーインターフェース）を担当するパッケージです。

## 🛠 技術スタック

| 項目 | 技術 |
|---|---|
| フレームワーク | [React](https://react.dev/) |
| ビルドツール | [Vite](https://vite.dev/) |
| スタイリング | Vanilla CSS (Glassmorphism デザインシステム) |
| 認証 | Firebase Authentication (Google OAuth) |
| リアルタイムDB | Firebase Cloud Firestore (`onSnapshot`) |
| ホスティング | Firebase Hosting (グローバルCDN) |

## 📂 ディレクトリ構成

```
frontend/
├── public/              # 静的アセット（favicon, アイコン）
├── src/
│   ├── assets/          # 画像ファイル
│   ├── components/      # UIコンポーネント
│   │   ├── AiChat.jsx       # 汎用AIチャットコンポーネント（Gemini連携）
│   │   ├── DbViewer.jsx     # Firestoreリアルタイムビューア
│   │   ├── Flashcard.jsx    # フラッシュカード（SM-2アルゴリズム組込）
│   │   └── UploadSection.jsx # テキスト/画像入力フォーム
│   ├── lib/
│   │   └── firebase.js  # Firebase SDK 初期化設定
│   ├── App.jsx          # メインアプリケーション
│   ├── App.css          # アプリ固有スタイル
│   ├── index.css        # グローバルデザインシステム
│   └── main.jsx         # エントリーポイント
├── index.html           # HTMLテンプレート
├── vite.config.js       # Vite設定
└── package.json
```

## 🎨 デザインシステム

**Glassmorphism（グラスモーフィズム）** を採用しています。

- `backdrop-filter: blur(12px)` によるすりガラス効果
- 半透明の背景（`rgba`）と微細なボーダー
- ダークモード自動対応（`prefers-color-scheme: dark`）
- ブルー〜パープルのグラデーション背景

CSS変数は `index.css` の `:root` で一元管理されており、カラーパレットやフォントを簡単にカスタマイズできます。

## 🔗 バックエンドとの通信

フロントエンドからバックエンドAPIへの通信は、以下のフローで行われます。

1. ユーザーがGoogleアカウントでログイン → Firebase Auth が **IDトークン** を発行
2. フロントエンドがそのIDトークンを `Authorization: Bearer <token>` ヘッダーに付与してバックエンドへリクエスト
3. バックエンドがトークンを検証 → 正当なユーザーのみ処理を実行

## 🚀 開発コマンド

```bash
# 依存パッケージのインストール
npm install

# 開発サーバーの起動（ホットリロード対応）
npm run dev

# 本番用ビルドの生成（dist/ に出力）
npm run build

# ビルド結果のプレビュー
npm run preview
```

## 📱 レスポンシブ対応

- **PC（900px以上）**: 2カラムレイアウト（左: アプリ操作、右: DBビューア）
- **モバイル（900px以下）**: タブ切り替え式（「📱 アプリ画面」「🗄️ データベース」）
