/**
 * baserCMS MCP サーバー
 * baserCMSを操作するためのModel Context Protocol (MCP) サーバー
 * ブログ記事の作成やシステム情報の取得などの機能を提供する
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { serverConfig } from './config/server';
import { addBlogPostTool, editBlogPostTool, getBlogPostTool, getBlogPostsTool, deleteBlogPostTool } from './tools/bc-blog/blog-posts';
import { getBlogCategoryTool, getBlogCategoriesTool, addBlogCategoryTool, editBlogCategoryTool, deleteBlogCategoryTool } from './tools/bc-blog/blog-categories';
import { getBlogTagTool, getBlogTagsTool, addBlogTagTool, editBlogTagTool, deleteBlogTagTool } from './tools/bc-blog/blog-tags';
import { getBlogContentTool, getBlogContentsTool, addBlogContentTool, editBlogContentTool, deleteBlogContentTool } from './tools/bc-blog/blog-contents';
import { serverInfoTool } from './tools/system/server-info';
import { addCustomFieldTool, getCustomFieldsTool, getCustomFieldTool, editCustomFieldTool, deleteCustomFieldTool } from './tools/bc-costom-content/custom-fields';
import { addCustomTableTool, getCustomTableTool, getCustomTablesTool, editCustomTableTool, deleteCustomTableTool } from './tools/bc-costom-content/custom-tables';
import { addCustomContentTool, getCustomContentTool, getCustomContentsTool, editCustomContentTool, deleteCustomContentTool } from './tools/bc-costom-content/custom-contents';
import { addCustomEntryTool, getCustomEntriesTool, getCustomEntryTool, editCustomEntryTool, deleteCustomEntryTool } from './tools/bc-costom-content/custom-entries';
import { getCustomLinkTool, getCustomLinksTool, addCustomLinkTool, editCustomLinkTool, deleteCustomLinkTool } from './tools/bc-costom-content/custom-links';
import fs from 'fs';
import { Readable } from 'stream';

/**
 * 標準出力をフックしてデバッグコンソールにも出力する
 */
function setupStdoutHook() {
  const originalWrite = process.stdout.write;

  process.stdout.write = function (chunk: any, encoding?: any, callback?: any): boolean {
    // 元の標準出力への書き込みを実行
    const result = originalWrite.call(process.stdout, chunk, encoding, callback);

    // デバッグコンソールにも出力（MCPプロトコルのJSONを整形して表示）
    try {
      const content = chunk.toString();
      if (content.trim()) {
        // JSONかどうかを判定して整形
        try {
          const jsonData = JSON.parse(content);
          console.error(JSON.stringify(jsonData, null, 2));
        } catch {
          // JSONでない場合はそのまま表示
          console.error(content);
        }
      }
    } catch (error) {
      console.error('標準出力のフック処理でエラー:', error);
    }

    return result;
  };
}

/**
 * メインエントリポイント
 * MCPサーバーを初期化し、利用可能なツールを登録してサーバーを起動する
 */
async function main() {
  // 標準出力フックを設定（デバッグ時にツールの戻り値を確認するため）
  setupStdoutHook();

  // MCP サーバーを初期化
  const server = new McpServer(serverConfig);

  // 全ツールを登録
  const allTools = [
    // ブログ記事関連ツール
    addBlogPostTool,
    editBlogPostTool,
    getBlogPostTool,
    getBlogPostsTool,
    deleteBlogPostTool,
    // ブログカテゴリ関連ツール
    getBlogCategoryTool,
    getBlogCategoriesTool,
    addBlogCategoryTool,
    editBlogCategoryTool,
    deleteBlogCategoryTool,
    // ブログタグ関連ツール
    getBlogTagTool,
    getBlogTagsTool,
    addBlogTagTool,
    editBlogTagTool,
    deleteBlogTagTool,
    // ブログコンテンツ関連ツール
    getBlogContentTool,
    getBlogContentsTool,
    addBlogContentTool,
    editBlogContentTool,
    deleteBlogContentTool,
    // カスタムフィールド関連ツール
    addCustomFieldTool,
    getCustomFieldsTool,
    getCustomFieldTool,
    editCustomFieldTool,
    deleteCustomFieldTool,
    // カスタムテーブル関連ツール
    addCustomTableTool,
    getCustomTableTool,
    getCustomTablesTool,
    editCustomTableTool,
    deleteCustomTableTool,
    // カスタムコンテンツ関連ツール
    addCustomContentTool,
    getCustomContentTool,
    getCustomContentsTool,
    editCustomContentTool,
    deleteCustomContentTool,
    // カスタムエントリー関連ツール
    addCustomEntryTool,
    getCustomEntriesTool,
    getCustomEntryTool,
    editCustomEntryTool,
    deleteCustomEntryTool,
    // カスタムリンク関連ツール
    getCustomLinkTool,
    getCustomLinksTool,
    addCustomLinkTool,
    editCustomLinkTool,
    deleteCustomLinkTool,
    // システム情報ツール
    serverInfoTool
  ];

  allTools.forEach(tool => {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema
      },
      tool.handler
    );
  });

  // コマンドライン引数があれば（＝launch.jsonのargsでrequest.jsonが渡されたら）ファイル入力、なければstdin
  let stdioTransport;
  const requestFile = process.argv[2];  // launch.jsonの"args"でファイル名が入る

  if (requestFile) {
    let requestJson = fs.readFileSync(requestFile, 'utf8');
    if (requestJson !== undefined || requestJson !== null) {
      // ファイルから読み込んだJSONを整形して、複数行に分かれたそれぞれの行の末尾の改行とタブを削除
      requestJson = requestJson
        .split('\n')
        .map(line => line.replace(/^\t+/g, ''))
        .join('');
      const fakeStdin = Readable.from([Buffer.from(requestJson + '\n')]);
      stdioTransport = new StdioServerTransport(fakeStdin, process.stdout);
    }
  }

  if (!stdioTransport) {
    stdioTransport = new StdioServerTransport();
  }

  try {
    await server.connect(stdioTransport);
  } catch (error) {
    throw error;
  }
}

main().catch((error) => {
  console.error('🔴 メインプロセスで致命的なエラーが発生しました:', error);
  process.exit(1);
});
