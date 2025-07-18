# basercms-mcp

baserCMSを操作するためのModel Context Protocol (MCP) サーバー実装です。GitHub Copilotなどのエージェントモードで利用できます。

## セットアップ

1. リポジトリをクローン
```bash
git clone https://github.com/ryuring/basercms-mcp.git
cd basercms-mcp
```

2. 依存パッケージをインストール
```bash
npm install
```

3. `.env` ファイルを作成して必要な環境変数を設定
```bash
cp .env.example .env
# エディタで.envファイルを開き、必要な値を設定
```

必要な環境変数:
- `OPENAI_API_KEY`: OpenAIのAPIキー
- `API_BASE_URL`: baserCMS APIのベースURL
- `API_USER`: baserCMS APIのユーザー名（メールアドレス）
- `API_PASSWORD`: baserCMS APIのパスワード

4. TypeScriptをコンパイル
```bash
npm run build
```

## 使い方

### スタンドアロンでの実行
```bash
npm start
```

### Copilotのエージェントモードでの利用
1. サーバーを起動
```bash
npm start
```

2. Copilotのエージェント設定で、「カスタムMCPサーバー」としてこのサーバーを指定します。

## トラブルシューティング

サーバーが正常に動作しない場合は、以下を確認してください：

- 環境変数が正しく設定されているか
- TypeScriptが正しくコンパイルされているか
- ネットワーク接続が正常か（OpenAI APIとbaserCMS API）