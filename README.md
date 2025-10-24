# basercms-mcp

baserCMSを操作するためのModel Context Protocol (MCP) サーバー実装です。Cline や GitHub Copilotのエージェントモードで利用できます。

## Installation

```bash
npm install @ecatchup/basercms-mcp
```

`.env` ファイルを作成して必要な環境変数を設定
```bash
cp .env.example .env
# エディタで.envファイルを開き、必要な値を設定
```

必要な環境変数:
- `API_BASE_URL`: baserCMS APIのベースURL
- `API_USER`: baserCMS APIのユーザー名（メールアドレス）
- `API_PASSWORD`: baserCMS APIのパスワード

### GitHub Copilotの場合

MCPサーバーの設定ファイルに設定を記載します。

```
~/Library/Application Support/Code/User/mcp.json
```

```json
{
  "servers": {
    "basercms-mcp": {
      "type": "stdio",
      "command": "node",
      "args": [
        "dist/index.js"
      ]
    }
  }
}
```

### Clineの場合

MCPサーバーの設定ファイルに設定を記載します。

```
# MacOSの場合
~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json
```

```json
{
  "mcpServers": {
    "basercms-mcp": {
      "disabled": false,
      "timeout": 60,
      "type": "stdio",
      "command": "node",
      "args": [
        "dist/index.js"
      ],
      "cwd": "{プロジェクトのフルパス}"
    }
  }
}
```

### Claude Desktopの場合
MCPサーバーの設定ファイルに設定を記載します。  
開発プロジェクト内での利用ではないため、環境変数を記載します。

```
# MacOSの場合
~/Library/Application Support/Claude/claude_desktop_config.json
```

```json
{
  "mcpServers": {
    "basercms-mcp-for-claude": {
      "command": "node",
      "args": [
        "{basercms-mcpの設置フォルダ}/dist/index.js"
      ],
      "cwd": "{basercms-mcpの設置フォルダ}",
      "env": {
        "API_BASE_URL": "{操作対象のサーバーのURL（例：https://localhost/）",
        "API_USER": "{baserCMSのログインユーザー名（メールアドレス）}",
        "API_PASSWORD": "{baserCMSのログインパスワード}"
      }
    }
  }
}
```


## Usage

baserCMS MCPサーバーは、baserCMSのWeb APIを通じて様々な機能を提供します。Cline や GitHub Copilotのエージェントモードから自然言語で操作できます。

### 使用例

```
# ブログ記事を作成する
「baserCMSの『News』コンテンツに『AI活用の新時代』というタイトルでブログ記事を作成してください」

# ブログ記事を検索する
「『AI』というキーワードでブログ記事を検索してください」

# 家具情報コンテンツを作成する
「新しく家具情報コンテンツをカスタムコンテンツで作ってください。フィールドの定義はお任せします。」
※ 事前にカスタムコンテンツプラグインを有効化してください。

# カスタムエントリーを作成する
「家具情報のカスタムコンテンツに新しい商品を追加してください」
```

### ブログ機能（bc-blog）

**ブログ記事（Blog Posts）**
- `getBlogPost` - 指定IDのブログ記事を取得
- `getBlogPosts` - ブログ記事一覧を取得（検索、ページング対応）
- `addBlogPost` - ブログ記事を追加
- `editBlogPost` - ブログ記事を編集
- `deleteBlogPost` - ブログ記事を削除

**ブログカテゴリ（Blog Categories）**
- `getBlogCategory` - 指定IDのブログカテゴリを取得
- `getBlogCategories` - ブログカテゴリ一覧を取得
- `addBlogCategory` - ブログカテゴリを追加
- `editBlogCategory` - ブログカテゴリを編集
- `deleteBlogCategory` - ブログカテゴリを削除

**ブログコンテンツ（Blog Contents）**
- `getBlogContent` - 指定IDのブログコンテンツを取得
- `getBlogContents` - ブログコンテンツ一覧を取得
- `addBlogContent` - ブログコンテンツを追加
- `editBlogContent` - ブログコンテンツを編集
- `deleteBlogContent` - ブログコンテンツを削除

**ブログタグ（Blog Tags）**
- `getBlogTag` - 指定IDのブログタグを取得
- `getBlogTags` - ブログタグ一覧を取得
- `addBlogTag` - ブログタグを追加
- `editBlogTag` - ブログタグを編集
- `deleteBlogTag` - ブログタグを削除

### カスタムコンテンツ機能（bc-custom-content）

**カスタムテーブル（Custom Tables）**
- `getCustomTable` - 指定IDのカスタムテーブルを取得
- `getCustomTables` - カスタムテーブル一覧を取得
- `addCustomTable` - カスタムテーブルを追加（カスタムフィールド関連付け）
- `editCustomTable` - カスタムテーブルを編集
- `deleteCustomTable` - カスタムテーブルを削除

**カスタムフィールド（Custom Fields）**
- `getCustomField` - 指定IDのカスタムフィールドを取得
- `getCustomFields` - カスタムフィールド一覧を取得
- `getIndexCustomFields` - インデックス用カスタムフィールドを取得
- `addCustomField` - カスタムフィールドを追加
- `editCustomField` - カスタムフィールドを編集
- `deleteCustomField` - カスタムフィールドを削除

**カスタムエントリー（Custom Entries）**
- `getCustomEntry` - 指定IDのカスタムエントリーを取得
- `getCustomEntries` - カスタムエントリー一覧を取得
- `addCustomEntry` - カスタムエントリーを追加（ファイルアップロード対応）
- `editCustomEntry` - カスタムエントリーを編集
- `deleteCustomEntry` - カスタムエントリーを削除

**カスタムコンテンツ（Custom Contents）**
- `getCustomContent` - 指定IDのカスタムコンテンツを取得
- `getCustomContents` - カスタムコンテンツ一覧を取得
- `addCustomContent` - カスタムコンテンツを追加
- `editCustomContent` - カスタムコンテンツを編集
- `deleteCustomContent` - カスタムコンテンツを削除

**カスタムリンク（Custom Links）**
- `getCustomLink` - 指定IDのカスタムリンクを取得
- `getCustomLinks` - カスタムリンク一覧を取得
- `addCustomLink` - カスタムリンクを追加
- `editCustomLink` - カスタムリンクを編集
- `deleteCustomLink` - カスタムリンクを削除

### システム機能（system）

**サーバー情報（Server Info）**
- `serverInfo` - サーバーのバージョンや環境情報を取得

## Debugging

`.vscode/launch.json` を以下のように設定します。

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug ts-node",
      "runtimeArgs": [
        "-r",
        "ts-node/register"
      ],
      "program": "${workspaceFolder}/src/index.ts",
      "cwd": "${workspaceFolder}",
      "env": {
        "TS_NODE_PROJECT": "${workspaceFolder}/tsconfig.json"
      },
      "skipFiles": [
        "<node_internals>/**"
      ],
      "args": [
        "${workspaceFolder}/request.json"
      ]
    }
  ]
}
```

request.json ファイルを作成し、以下のように記述します。

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "{メソッド名}",
    "arguments": {
      "引数1": "引数1の値",
      "引数2": "引数2の値",
    }
  }
}
```

ブレークポイントを設定してデバッグを実行します。
