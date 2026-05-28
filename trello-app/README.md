# Torello — Trello風タスク管理アプリ

React + TypeScript + Spring Boot + PostgreSQL で構築したフルスタックのカンバンボードアプリ。

---

## 機能一覧

| カテゴリ | 機能 |
|---------|------|
| ボード | タイトル表示・インライン編集 |
| リスト | 追加・タイトル編集・削除（カード連鎖削除） |
| カード | 追加・タイトル/説明編集・削除 |
| 並び替え | ドラッグ&ドロップで同リスト内の並び替え・リスト間移動 |
| 検索 | カードタイトルのリアルタイム絞り込み |
| データ永続化 | REST API 経由で PostgreSQL に保存（リロード後も復元） |

---

## 技術スタック

| レイヤー | 技術 | バージョン |
|---------|------|----------|
| フロントエンド | React | 19.2.6 |
| | TypeScript | 6.0.2 |
| | Vite | 8.0.12 |
| | @dnd-kit | 6.x / 10.x |
| | axios | 1.7.9 |
| バックエンド | Java | 21 |
| | Spring Boot | 3.3.5 |
| | Spring Data JPA / Hibernate | Spring Boot 管理 |
| | Flyway | Spring Boot 管理 |
| データベース | PostgreSQL | 15以上 |
| インフラ | Docker / Docker Compose | 任意 |

詳細は [技術スタックドキュメント](./docs/tech-stack.md) を参照。

---

## アーキテクチャ

```
ブラウザ (localhost:5173)
    │  HTTP / JSON
    ▼
Spring Boot API (localhost:3001/api)
    │  JPA / JDBC
    ▼
PostgreSQL (localhost:5432)
```

---

## ローカル開発手順

### 前提条件

- Java 21
- Maven 3.x
- Node.js 18以上
- Docker（PostgreSQL をコンテナで起動する場合）

### 1. PostgreSQL を起動する

```bash
cd trello-app
docker compose up -d
```

`docker-compose.yml` が PostgreSQL コンテナを起動し、Flyway マイグレーションがスキーマとシードデータを自動適用します。

### 2. バックエンドを起動する

```bash
cd trello-app/backend
cp .env.example .env   # Windows: copy .env.example .env
# .env に DATABASE_URL を設定（デフォルト値はそのまま使用可）
./mvnw spring-boot:run
```

API は `http://localhost:3001/api` で起動します。

### 3. フロントエンドを起動する

```bash
cd trello-app/frontend
npm install
npm run dev
```

ブラウザで `http://localhost:5173` を開きます。

> **注意:** サーバー起動には `/start-servers` スキル（Claude Code）も利用できます。ポート競合時も自動処理されます。

---

## 環境変数

### バックエンド (`trello-app/backend/.env`)

| 変数名 | 例 | 説明 |
|-------|-----|------|
| `DATABASE_URL` | `jdbc:postgresql://localhost:5432/torello` | DB接続URL |
| `DB_USERNAME` | `torello` | DBユーザー名 |
| `DB_PASSWORD` | `torello` | DBパスワード |
| `PORT` | `3001` | APIサーバーのポート |

### フロントエンド (`trello-app/frontend/.env`)

| 変数名 | 例 | 説明 |
|-------|-----|------|
| `VITE_API_BASE_URL` | `http://localhost:3001/api` | バックエンドAPIのベースURL |

---

## 利用可能なコマンド

### フロントエンド

```bash
npm run dev      # 開発サーバー起動 (port 5173)
npm run build    # 本番ビルド
npm run lint     # ESLint 実行
npx tsc          # 型チェック
```

### バックエンド

```bash
./mvnw spring-boot:run   # 開発サーバー起動 (port 3001)
./mvnw test              # テスト実行
./mvnw package           # JARビルド
```

---

## ドキュメント

| ドキュメント | 内容 |
|------------|------|
| [要件定義書](./docs/requirements.md) | プロジェクト概要・スコープ・非機能要件 |
| [機能要件・ユースケース](./docs/features.md) | 機能一覧・ユースケース定義 |
| [画面設計](./docs/screen-design.md) | 画面レイアウト・コンポーネント仕様 |
| [データベース設計](./docs/database.md) | ER図・テーブル定義・リレーション |
| [API設計](./docs/api-design.md) | REST エンドポイント一覧・レスポンス形式 |
| [技術スタック](./docs/tech-stack.md) | 技術選定理由・バージョン一覧 |

---

## API エンドポイント概要

ベースURL: `http://localhost:3001/api`

| メソッド | パス | 説明 |
|---------|-----|------|
| GET | `/boards/:id` | ボード情報をリスト・カードごと取得 |
| PATCH | `/boards/:id` | ボードタイトルを更新 |
| POST | `/boards/:id/lists` | リストを追加 |
| PATCH | `/lists/:id` | リストタイトルを更新 |
| DELETE | `/lists/:id` | リストを削除（カード連鎖削除） |
| POST | `/lists/:id/cards` | カードを追加 |
| PATCH | `/cards/:id` | カードのタイトル・説明を更新 |
| PATCH | `/cards/:id/position` | カードの位置・所属リストを更新 |
| DELETE | `/cards/:id` | カードを削除 |

詳細は [API設計ドキュメント](./docs/api-design.md) を参照。

---

## データモデル

```
boards
  └── lists (1対多, CASCADE削除)
        └── cards (1対多, CASCADE削除)
```

詳細は [データベース設計ドキュメント](./docs/database.md) を参照。
