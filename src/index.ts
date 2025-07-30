/**
 * baserCMS MCP サーバー
 * baserCMSを操作するためのModel Context Protocol (MCP) サーバー
 * ブログ記事の作成やシステム情報の取得などの機能を提供する
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { serverConfig } from './config/server';
import { addBlogPostTool } from './tools/bc-blog/blog-posts';
import { serverInfoTool } from './tools/system/server-info';
import { addCustomFieldTool, getCustomFieldsTool } from './tools/bc-costom-content/custom-fields';
import { addCustomTableTool } from './tools/bc-costom-content/custom-tables';
import { addCustomContentTool } from './tools/bc-costom-content/custom-contents';
import { addCustomEntryTool, getCustomEntriesTool } from './tools/bc-costom-content/custom-entries';
import fs from 'fs';
import { Readable } from 'stream';

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
    addCustomContentTool,
    addCustomEntryTool,
    getCustomFieldsTool,
    getCustomEntriesTool,
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
    if(requestJson !== undefined || requestJson !== null) {
      // ファイルから読み込んだJSONを整形して、複数行に分かれたそれぞれの行の末尾の改行とタブを削除
      requestJson = requestJson
        .split('\n')
        .map(line => line.replace(/^\t+/g, ''))
        .join('');
      const fakeStdin = Readable.from([Buffer.from(requestJson + '\n')]);
      stdioTransport = new StdioServerTransport(fakeStdin, process.stdout);
      console.log(`🟢 デバッグ（ファイル渡し）モード: ${requestFile} を流し込みます`);
    }
  }

  if(!stdioTransport) {
    stdioTransport = new StdioServerTransport();
  }

  try {
    await server.connect(stdioTransport);
  } catch (error) {
    throw error;
  }
}

main().catch(console.error);
