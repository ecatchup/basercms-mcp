# Copilot Instructions

## フレームワーク
CakePHP 5系
baserCMS 5系

## ドキュメント
- [baserCMS Web API ガイド](https://baserproject.github.io/5/web_api/)

## 動作確認
- 新しいメソッドを実装したら、そのまま、ts-node を使用して動作確認を行います。その際、新しくファイルを作らず直接実行しないでください。
- やむを得ず、新しくファイルを作成する必要があった場合には、実行後に削除してください。
- 結果の確認は最後のターミナルコマンドから取得します。

## 注意事項

### ファイルアップロードについて
ファイルアップロードの際は、Node.js の場合、fs を利用してアップロードします。

```typescript
import fs from 'fs';
const value = fs.createReadStream('./asset_sample/test.jpg');
```
