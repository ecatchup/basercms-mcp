# basercms-mcp

baserCMSを操作するためのModel Context Protocol (MCP) サーバー実装です。Cline や GitHub Copilotのエージェントモードで利用できます。

## Installation

```bash
npm install basercms-mcp
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

オプション環境変数（AI機能のカスタマイズ）
- `OPENAI_API_KEY`: OpenAIのAPIキー（省略可能 - 未設定時はAI生成をスキップ）
- `OPENAI_MODEL`: 使用するOpenAIモデル（デフォルト: gpt-3.5-turbo）
- `DETAIL_MAX_AI_TOKENS`: 詳細説明生成の最大トークン数（デフォルト: 1000）
- `SUMMARY_MAX_AI_TOKENS`: 要約生成の最大トークン数（デフォルト: 200）

OpenAIを利用すると、ブログ記事のタイトルから、概要や詳細説明を自動生成できます。
※ トークン数から文字数は自動計算されます（日本語: 1トークン ≈ 1.5文字）

## Usage

### Clineの場合

MCPサーバーの設定ファイルに設定を記載します。

```
# MacOSの場合
/Users/{username}/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json
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

### GitHub Copilotの場合

MCPサーバーの設定ファイルに設定を記載します。

```
.vscode/mcp.json
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
