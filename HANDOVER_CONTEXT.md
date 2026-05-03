# Memory Glass プロジェクト引継ぎ資料 (Handover Context)

このファイルは、以前のワークスペースからの文脈を引き継ぐために作成されたものです。
新しいワークスペースでAntigravityエージェントがコンテキストを理解するための資料として活用してください。

---

## 1. 実装計画 (Implementation Plan)

### 🎯 アプリの目的と主要機能 (Goal Description)
テキストやノートの写真を放り込むだけで、AIが内容を理解・整理し、記憶への定着（短期記憶から長期記憶へ）を全自動でサポートするアプリケーションです。

#### コア機能
1. **シームレスなインプット (入力の自動化)**
   *   **テキスト入力**: 長文テキストをペーストするだけ。
   *   **写真アップロード**: ノートやホワイトボードの写真をアップロードするだけで、AI (Gemini Vision) が文字と文脈を読み取ります。
2. **AIによる記憶の構造化 (短期記憶サポート)**
   *   入力された情報から「重要なキーワード」「概念の要約」をAIが自動抽出し、フラッシュカードやQA形式（一問一答）の「記憶アイテム」を自動生成します。
3. **忘却曲線を意識した復習 (長期記憶サポート)**
   *   Spaced Repetition（間隔反復）アルゴリズムに基づき、「いつ復習すべきか」をアプリが管理します。
   *   ユーザーは「覚えた」「少し忘れていた」「全く思い出せない」などのフィードバックを返すだけで、次回の復習タイミングが自動計算されます。

### 🎨 デザイン方針 (UI/UX)
*   **Glassmorphism (グラスモーフィズム)**: すりガラスのような半透明のパネル、背景のぼかし (`backdrop-filter: blur()`)。背景には淡いブルーからパープルのグラデーションカラー。

### 🏗 アーキテクチャと使用技術 (Architecture)
*   **フロントエンド**: React (Vite) + Vanilla CSS
*   **データベース・ストレージ**: Firebase (Authentication, Cloud Firestore, Cloud Storage) -> プロジェクトID: `memory-glass-2026`
*   **AI・バックエンド**: Node.js (Express) + Gemini API (`@google/genai`)
*   **エージェントスキル基盤**: Google Cloud Skills (`firebase-basics`, `gemini-api` などを `.agents/skills` に導入済)

---

## 2. タスク進捗 (Task Tracking)

- `[x]` Firebase ツールの準備と認証
  - `[x]` `firebase-tools` のインストール
  - `[x]` Googleアカウントでの `firebase login`
  - `[x]` Firebase プロジェクトの作成と初期設定 (`memory-glass-2026`)
- `[/]` フロントエンド (React) の構築
  - `[x]` Vite での React プロジェクト初期化
  - `[ ]` Glassmorphism CSS デザインシステムの構築
  - `[ ]` 写真アップロード / テキスト入力コンポーネントの実装
  - `[ ]` 復習（フラッシュカード）コンポーネントの実装
- `[/]` バックエンド (Node.js/Express) の構築
  - `[x]` Express サーバーの初期化
  - `[ ]` Gemini Vision API 連携エンドポイントの実装
  - `[ ]` テキスト構造化（フラッシュカード生成）ロジックの実装
- `[ ]` 統合とデータベース連携
  - `[ ]` Firebase Firestore との通信処理
  - `[ ]` Spaced Repetition (間隔反復) アルゴリズムの実装
  - `[ ]` フロントとバックエンドの結合テスト
