# Trello 風タスク管理アプリ（フロント + API + PostgreSQL）

## ローカル開発手順

1. **PostgreSQL（Docker）** — リポジトリの `trello-app` で起動します。
   ```bash
   cd trello-app
   docker compose up -d
   ```
   初回起動時に `backend/db/init.sql` が実行され、テーブルと既定ボード（ID `00000000-0000-0000-0000-000000000001`）が作成されます。

2. **バックエンド** — 接続文字列は `backend/.env` で指定します（`.env.example` をコピー）。
   ```bash
   cd trello-app/backend
   cp .env.example .env   # Windows: copy .env.example .env
   npm install
   npm run dev
   ```
   既定では API は `http://localhost:3001/api`（[要件定義書](./要件定義書.md) 12章）。

3. **フロントエンド** — 任意で `frontend/.env` に API の URL を設定できます（未設定時は上記と同じ既定値）。
   ```bash
   cd trello-app/frontend
   cp .env.example .env   # 任意
   npm install
   npm run dev
   ```

### Docker Compose の環境変数（任意）

`docker-compose.yml` は `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` / `POSTGRES_PORT` を上書きできます。その場合は `backend/.env` の `DATABASE_URL` も同じ認証情報に合わせてください。

---

# React + TypeScript + Vite（テンプレート由来の説明）

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
