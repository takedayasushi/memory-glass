# Memory Glass 🧠✨

**Public URL (本番環境):** [https://memory-glass-2026.web.app](https://memory-glass-2026.web.app)

Memory Glass は、テキストやノートの写真を放り込むだけで、AIが内容を理解・整理し、記憶への定着（短期記憶から長期記憶へ）を全自動でサポートするフルスタック・ウェブアプリケーションです。

## 🎯 アプリの目的と主要機能

### 1. シームレスなインプット (入力の自動化)
*   **テキスト入力**: 長文テキストをペーストするだけで、重要なキーワードを抽出します。
*   **写真アップロード**: ノートやホワイトボードの写真をアップロードするだけで、AI (Google Gemini Vision) が文字と文脈を読み取ります。

### 2. AIによる記憶の構造化 (短期記憶サポート)
入力された情報から「一番覚えるべきポイント」をAIが自動抽出し、フラッシュカードやQA形式（一問一答）の「記憶アイテム」を自動生成します。

### 3. 忘却曲線を意識した復習 (長期記憶サポート)
SuperMemo-2 (SM-2) に基づく **Spaced Repetition（間隔反復）アルゴリズム** を採用しています。
ユーザーはフラッシュカードの裏側にある「Forgot」「Hard」「Good」「Easy」の4つのボタンを押してフィードバックを返すだけで、システムが「忘れかける絶妙なタイミング」を計算し、次回の出題日時を決定します。

## 🎨 デザイン方針 (UI/UX)
**Glassmorphism (グラスモーフィズム)**
すりガラスのような半透明のパネル、背景のぼかし (`backdrop-filter: blur()`) を採用し、直感的で美しいインターフェースを提供します。
PCでは広大な画面を活かした2カラム（アプリとDBのリアルタイムビューア）構成、モバイルではタブ切り替え式のレスポンシブデザインに対応しています。

---

## 🏗 システムアーキテクチャ (GCP & Firebase)

本プロジェクトは、Google Cloud Platform (GCP) と Firebase の各種サービスを組み合わせ、スケーラブルかつセキュアに構築されています。

### 📱 フロントエンド (React)
* **技術**: React (Vite) + Vanilla CSS
* **ホスティング**: **Firebase Hosting**
* グローバルCDNを通じて高速に配信され、GlassmorphismのモダンなUIを描画します。

### ⚙️ バックエンドAPI (Node.js)
* **技術**: Node.js + Express
* **ホスティング**: **Cloud Functions for Firebase v2 (GCP Cloud Runベース)**
* サーバーレスアーキテクチャを採用し、アクセス時のみコンテナが起動するため、コスト効率と耐障害性に優れています。

### 🤖 AIエンジン (Google Gemini)
* **モデル**: `gemini-3.1-pro-preview`
* バックエンド内で Google Gen AI SDK (`@google/genai`) を用いてテキストや画像を解析します。
* AIアシスタントチャット機能も搭載しており、アプリの利用方法やアーキテクチャについて質問することが可能です。

### 🗄️ データベース (Cloud Firestore)
* **技術**: Cloud Firestore (NoSQL)
* フラッシュカードのデータやユーザーの学習履歴を保存します。
* `onSnapshot` 機能を利用し、バックエンドがAIで生成したデータがデータベースに保存された瞬間、WebSocket経由で画面（フロントエンド）に **リアルタイム同期（自動更新）** されます。

### 🔐 セキュリティと認証
* **認証**: Firebase Authentication (Google OAuth)
* **DB保護**: Firestore Security Rules により、「ログインしているユーザー自身のデータしか読み書きできない」よう強力に保護されています。
* **鍵管理**: Gemini APIのシークレットキーなどは、**GCP Secret Manager** によって暗号化され、安全に保管・連携されています。

### 🔄 CI/CD (GitHub Actions)
GitHubの `main` ブランチにコードがPushされると、GitHub Actions が自動的にフロントエンドのビルド（最適化）と、Firebase Hosting / Cloud Functions へのデプロイ（公開）を実行します。

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

# 3. バックエンドの起動 (別のターミナルで実行)
cd backend
npm install
# .env ファイルに GEMINI_API_KEY を設定してください
node index.js
```
