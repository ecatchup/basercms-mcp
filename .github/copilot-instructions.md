# Copilot Instructions

## フレームワーク
CakePHP 5系
baserCMS 5系

## ドキュメント
- [baserCMS Web API ガイド](https://baserproject.github.io/5/web_api/)

## MCPの実装について
- MCPの実装には、basercms-js-sdk を使用します。
- MCPサーバーのライブラリには、`modelcontextprotocol/sdk` を利用します。
- MCPサーバーとして利用できる機能は、`src/tools/` に配置します。
- baserCMSのエンティティを操作する機能は、baserCMSのプラグインごとにフォルダで分類し（bc-blog等）、エンティティごとに複数形でファイルを作成します（blog-posts.ts）、

### 機能の命名規則
- 単一取得：get{EntityName}
- 複数取得：get{EntityNames}
- 作成：add{EntityName}
- 更新：edit{EntityName}
- 削除：delete{EntityName}

## 動作確認
- MCPサーバーの動作確認は、`src/index.ts` を実行することで行います。その際、.env を読み込む仕様になっています。
- 各機能の動作確認は、`src/index.ts` に、MCPサーバーのパラメーターを標準入力より渡すか、`request.json` にMCPサーバーのパラメーターを記述した上で、`src/index.ts` に引数として渡すことで行います。
- 動作確認の際は、`ts-node` を利用する前提とし、ビルドは行いません。
- 新しいメソッドを実装したら、そのまま、動作確認を行います。その際、新しくファイルを作らず直接実行しないでください。
- やむを得ず、新しくファイルを作成する必要があった場合には、実行後に削除してください。
- 結果の確認は最後のターミナルコマンドから取得します。
- 動作確認のコマンド実行に限り、承認を得ず実行することができます。

## 注意事項

### ファイルアップロードについて
ファイルアップロードの際は、Node.js の場合、fs を利用してアップロードします。

```typescript
import fs from 'fs';
const value = fs.createReadStream('./asset_sample/test.jpg');
```
