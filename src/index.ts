/**
 * baserCMS MCP サーバー
 * baserCMSを操作するためのModel Context Protocol (MCP) サーバー
 * ブログ記事の作成やシステム情報の取得などの機能を提供する
 */

// 高レベル API
// @ts-ignore 型定義が見つからないため無視
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// @ts-ignore 型定義が見つからないため無視
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { serverConfig } from './config/server';
import { addBlogPostTool } from './tools/bc-blog/blog-posts';
import { serverInfoTool } from './tools/system/server-info';
import { addCustomFieldTool, getCustomFieldsTool } from './tools/bc-costom-content/custom-fields';
import { addCustomTableTool } from './tools/bc-costom-content/custom-tables';

/**
 * メインエントリポイント
 * MCPサーバーを初期化し、利用可能なツールを登録してサーバーを起動する
 */
async function main() {
  // MCP サーバーを初期化
  const server = new McpServer(serverConfig);

  // 全ツールを登録
  const allTools = [
    addBlogPostTool,
    addCustomFieldTool,
    addCustomTableTool,
    getCustomFieldsTool,
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
  
  // StdioServerTransportのインスタンス化（オプションなし）
  const stdioTransport = new StdioServerTransport();
  
  // エラーハンドリングを追加
  try {
    await server.connect(stdioTransport);
  } catch (error) {
    throw error;
  }
}

main().catch(console.error);
