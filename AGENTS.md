# AGENTS.md — Memory Glass プロジェクト ルール

このファイルはAIエージェント向けの開発ルール定義書です。
Memory Glassプロジェクトに関する作業を開始する前に必ず読み込んでください。

## プロジェクト概要

- **アプリ名**: Memory Glass
- **目的**: テキストまたは写真をアップロードするだけで、AIが短期記憶・長期記憶の定着をサポートするアプリ
- **Firebase プロジェクトID**: `memory-glass-2026`
- **デザイン**: Glassmorphism（すりガラス風の半透明UI、背景はブルー〜パープルのグラデーション）

## 実装ルール

### Google Cloud Skills
- Google Cloud / Firebase / Gemini API に関連する実装を行う前に、必ず以下を実行すること:
  ```bash
  npx skills add google/skills
  ```
- `.agents/skills/` に取得したSkillsの内容を実装のベースとして使用すること

### セキュリティ
- APIキー・サービスアカウントのJSONは **絶対にフロントエンドコードに直接記述しない**
- Gemini APIへのリクエストは必ずバックエンド（`/backend`）経由で行うこと
- Firebase Firestoreのセキュリティルール（`firestore.rules`）は必ず設定・確認すること

### ディレクトリ構成
```
/memory-glass
├── /frontend       (React Vite アプリケーション)
├── /backend        (Node.js Express サーバー)
├── firebase.json
├── firestore.rules
├── AGENTS.md       (このファイル)
└── HANDOVER_CONTEXT.md
```

### フロントエンド (frontend/)
- React (Vite) + Vanilla CSS を使用すること（TailwindCSSは使わない）
- Google Fonts の `Inter` を使用すること
- すべてのコンポーネントはGlassmorphismデザインに統一すること

### バックエンド (backend/)
- Node.js (Express) を使用すること
- 環境変数は `.env` ファイルで管理し、`.gitignore` に追加すること

## 作業再開時のチェックリスト
1. `HANDOVER_CONTEXT.md` のタスク進捗を確認する
2. `firebase projects:list` でFirebaseプロジェクトの接続を確認する
3. 最新のGoogle Cloud Skillsを取得する
