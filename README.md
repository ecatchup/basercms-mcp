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
- `OPENAI_API_KEY`: OpenAIのAPIキー（省略可能 - 未設定時はAI生成をスキップ）
- `API_BASE_URL`: baserCMS APIのベースURL
- `API_USER`: baserCMS APIのユーザー名（メールアドレス）
- `API_PASSWORD`: baserCMS APIのパスワード

オプション環境変数（AI機能のカスタマイズ）:
- `OPENAI_MODEL`: 使用するOpenAIモデル（デフォルト: gpt-3.5-turbo）
- `DETAIL_MAX_AI_TOKENS`: 詳細説明生成の最大トークン数（デフォルト: 1000）
- `SUMMARY_MAX_AI_TOKENS`: 要約生成の最大トークン数（デフォルト: 200）

※ トークン数から文字数は自動計算されます（日本語: 1トークン ≈ 1.5文字）

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
