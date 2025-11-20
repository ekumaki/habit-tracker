# 習慣トラッカー (Habit Tracker)

シンプルで美しい、PWA対応の習慣トラッカーアプリです。
React, TypeScript, Vite, Tailwind CSS で構築されています。

## 機能

*   **習慣の管理**: 習慣の追加、編集、削除、並び替え（ドラッグ＆ドロップ対応）
*   **記録**: 毎日の達成状況をワンタップで記録
*   **カレンダー表示**: 月表示と週表示の切り替え、達成状況の視覚化（◎、△、×）
*   **継続日数**: 継続日数の自動計算と表示
*   **PWA対応**: スマートフォンにインストールしてアプリとして使用可能
*   **データ保存**: ブラウザのIndexedDBにデータを保存（オフライン動作可能）

## デプロイについて

このプロジェクトは **GitHub Actions** を使用して GitHub Pages に自動デプロイされるように設定されています。

### 手順

1.  `main` ブランチに変更をプッシュします。
2.  GitHub Actions が自動的に起動し、ビルドとデプロイが行われます。
3.  `https://<ユーザー名>.github.io/habit-tracker/` で最新版が公開されます。

**注意**: GitHubリポジトリの `Settings` -> `Pages` -> `Build and deployment` の `Source` が **`GitHub Actions`** に設定されていることを確認してください。

## 開発環境のセットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

## 技術スタック

*   React 18
*   TypeScript
*   Vite
*   Tailwind CSS
*   idb (IndexedDB wrapper)
*   date-fns
*   @hello-pangea/dnd (Drag and Drop)
