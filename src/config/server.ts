import { config } from 'dotenv';
import path from 'path';

/**
 * サーバー設定
 * MCPサーバーの基本設定と環境変数の読み込みを管理する
 */

// CommonJS互換の __filename, __dirname を利用
const _filename: string = (typeof module !== 'undefined' && module.filename ? module.filename : process.argv[1]);
const _customFilename: string = typeof _filename !== 'undefined' ? _filename : process.argv[1];
const _customDirname: string = path.dirname(_customFilename);
const projectRoot = path.resolve(_customDirname, '../..');
const envFilePath = path.join(projectRoot, '.env');

// .envファイルを読み込み
config({ path: envFilePath, debug: false, quiet: true });

/**
 * MCPサーバーの基本設定
 */
export const serverConfig = {
  name: 'basercms-mcp',
  version: '0.1.0',
  description: 'baserCMS を操作するための MCP サーバー'
};
