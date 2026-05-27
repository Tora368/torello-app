---
name: start-servers
description: torello-app のバックエンド（port 3001）とフロントエンド（port 5173）を規定ポートで起動する。ポート競合がある場合は既存プロセスを停止してから起動する。
allowed-tools: Bash
---

torello-app のサーバーを起動する。以下の手順を**必ず順番通り**に実行すること。

## ルール（厳守）

- バックエンドは **port 3001** 固定、フロントエンドは **port 5173** 固定
- 別ポートでの起動は**絶対禁止**（フロントとバックの接続設定がずれて動作しない）
- ポートが使用中の場合は既存プロセスを停止してから規定ポートで起動する

## Step 1 — ポート競合チェックと解消

```powershell
powershell.exe -Command "netstat -ano | Select-String ':3001 |:5173 '"
```

出力に PID が含まれる場合、そのプロセスを停止する：

```powershell
powershell.exe -Command "Stop-Process -Id <PID> -Force"
```

停止できない場合はユーザーに報告して判断を仰ぐこと。

## Step 2 — Docker Desktop 確認

```bash
docker info 2>&1 | head -3
```

エラーが出た場合は Docker Desktop が未起動。ユーザーに Docker Desktop の起動を依頼し、起動完了を確認してから次へ進む。

## Step 3 — PostgreSQL コンテナ起動

```bash
cd /c/Users/masat/.cursor/AI-engineer/trello-app && docker compose up -d
```

`Healthy` または `Running` になるまで待つ。

## Step 4 — バックエンド起動（port 3001）

backend の `.env` が存在しない場合は先に作成する：

```bash
cp /c/Users/masat/.cursor/AI-engineer/trello-app/backend/.env.example \
   /c/Users/masat/.cursor/AI-engineer/trello-app/backend/.env
```

バックエンドを起動する：

```bash
cd /c/Users/masat/.cursor/AI-engineer/trello-app/backend && npm run dev > /tmp/backend.log 2>&1 &
sleep 5 && cat /tmp/backend.log
```

ログに `API listening on http://localhost:3001/api` が表示されれば成功。

## Step 5 — フロントエンド起動（port 5173）

```bash
cd /c/Users/masat/.cursor/AI-engineer/trello-app/frontend && npm run dev > /tmp/frontend.log 2>&1 &
sleep 5 && cat /tmp/frontend.log
```

ログに `http://localhost:5173` が表示されれば成功。

## Step 6 — 疎通確認

```bash
curl -s http://localhost:3001/api/boards/00000000-0000-0000-0000-000000000001 | head -c 100
```

JSON が返れば全サービス正常稼働。ユーザーに以下を報告する：

| サービス | URL | 状態 |
|---------|-----|------|
| フロントエンド | http://localhost:5173 | 起動中 |
| バックエンド API | http://localhost:3001/api | 起動中 |
| PostgreSQL | localhost:5432 | Docker で起動中 |
