# API設計 — Trello風タスク管理アプリ（フェーズ2）

> 上位ドキュメント: [要件定義書](./requirements.md)  
> 関連: [データベース設計](./database.md)

ベースURL：`http://localhost:3001/api`

---

## 1. エンドポイント一覧

### ボード

| メソッド | パス | 説明 |
|---------|-----|------|
| GET | `/boards/:id` | ボード情報をリスト・カードごと取得 |
| PATCH | `/boards/:id` | ボードタイトルを更新 |

### リスト

| メソッド | パス | 説明 |
|---------|-----|------|
| POST | `/boards/:id/lists` | リストを追加 |
| PATCH | `/lists/:id` | リストタイトルを更新 |
| PATCH | `/lists/:id/position` | リストの表示順を更新 |
| DELETE | `/lists/:id` | リストを削除（カードも連鎖削除） |

### カード

| メソッド | パス | 説明 |
|---------|-----|------|
| POST | `/lists/:id/cards` | カードを追加 |
| PATCH | `/cards/:id` | カードのタイトル・説明を更新 |
| PATCH | `/cards/:id/position` | カードの所属リストと表示順を更新（移動含む） |
| DELETE | `/cards/:id` | カードを削除 |

---

## 2. レスポンス形式

### GET /boards/:id

```json
{
  "id": "uuid",
  "title": "My Board",
  "lists": [
    {
      "id": "uuid",
      "title": "To Do",
      "position": 0,
      "cards": [
        {
          "id": "uuid",
          "title": "タスク1",
          "description": "説明文",
          "position": 0,
          "createdAt": "2026-05-16T00:00:00Z"
        }
      ]
    }
  ]
}
```
