# torello-app — Claude Code 必須ルール

このファイルはすべての Claude Code セッションの開始時に読み込まれる。
以下のルールは**例外なく必須**。違反している状態を発見したら、コードを書く前に必ず修正すること。

---

## 1. セッション開始チェックリスト

コード変更を行うすべてのセッションで、最初に以下を実行すること:

```powershell
git branch --show-current
```

- 結果が `master` の場合 → **STOP**。ユーザーに作業対象のイシュー番号を確認し、正しいブランチを作成してから始めること。
- 結果が正しいブランチ名の場合 → 続行可。

```powershell
gh issue view {N} --repo Tora368/torello-app
```

対象イシューが `open` 状態であることを確認すること。

---

## 2. イシューファースト原則

**コードを書く前に、必ず対応する GitHub イシューが存在しなければならない。**

1. 作業開始前に `gh issue list --repo Tora368/torello-app` でイシューを確認する。
2. 対応するイシューが存在しない場合は**STOP**し、ユーザーにイシューの作成を求める。
   - 新機能 → Feature Request テンプレートを使用
   - バグ修正 → Bug Report テンプレートを使用
3. イシュー番号を記録し、以降のすべてのステップで使用する。

イシューなしで実装を始めることは**禁止**。

---

## 3. ブランチ命名規則

すべてのブランチは以下の形式に**厳密に**従うこと:

```
feature/issue-{N}-short-description   # 新機能
fix/issue-{N}-short-description        # バグ修正
```

**ルール:**
- `{N}` は GitHub イシュー番号（整数、ゼロ埋めなし）
- `short-description` は半角小文字英数字とハイフンのみ（スペース・アンダースコア・大文字禁止）
- タイプは `feature` または `fix` のみ（`hotfix`, `chore` 等は不可）
- 合計 60 文字以内

**有効な例:**
- `feature/issue-12-add-login-page`
- `fix/issue-7-fix-card-drag-bug`

**無効な例（Claude はこれらを使用してはならない）:**
- `feature/add-login` （イシュー番号なし）
- `fix/Issue-7-FixBug` （大文字使用）
- `hotfix/issue-5-patch` （未対応のタイプ）
- `master` （master で作業禁止）

**ブランチ作成コマンド:**
```powershell
git switch -c feature/issue-{N}-short-description
```

コミット前に必ず現在のブランチ名が規則に合致していることを確認すること。

---

## 4. master への直接操作の絶対禁止

Claude は以下を**絶対に行ってはならない**:

- `master` ブランチへの直接コミット
- `git push origin master`（または同等の操作）
- ローカルで feature/fix ブランチを master にマージ
- `git push --force` / `git push -f`（いかなる状況でも）

コミット前に必ず実行:
```powershell
git branch --show-current
```

出力が `master` であれば**即座に STOP**し、正しいブランチに変更すること。

---

## 5. プルリクエストワークフロー

作業完了後:

1. すべてのコミットが正しい `feature/issue-{N}-*` または `fix/issue-{N}-*` ブランチにあることを確認。
2. ブランチを origin へプッシュ:
   ```powershell
   git push -u origin HEAD
   ```
3. PR を作成（タイトルにイシュー参照を含める）:
   ```powershell
   gh pr create --repo Tora368/torello-app `
     --title "feat: 説明 (closes #N)" `
     --body "Closes #N`n`n<!-- PR テンプレートの残りを記入 -->"
   ```
4. PR 本文に `Closes #N` を含める（イシューの自動クローズに必須）。
5. マージはローカルで行わず、必ず GitHub PR 経由で行う:
   ```powershell
   gh pr merge --squash --delete-branch
   ```

---

## 6. プロジェクト構成

- **Frontend:** React + TypeScript, Vite → `trello-app/frontend/`
- **Backend:** Node.js → `trello-app/backend/`
- **ビルド:** `npm run build`
- **開発サーバー:** `npm run dev`
- **Lint:** `npm run lint`
- **型チェック:** `npx tsc`
- **リポジトリ:** `Tora368/torello-app`
