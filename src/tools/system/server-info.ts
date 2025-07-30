import { z } from 'zod';
import { ToolDefinition } from '../../types/tool';

/**
 * サーバー情報ツール
 * Node.jsのバージョンや環境情報を取得するためのMCPツール
 */
export const serverInfoTool: ToolDefinition = {
  name: 'serverInfo',
  description: 'サーバーのバージョンや環境情報を返します',
  inputSchema: {},

  /**
   * サーバー情報を取得するハンドラー
   * @returns Node.jsバージョンと環境情報
   */
  handler: async () => {
    const serverInfo = {
      node: process.version,
      env: process.env.NODE_ENV ?? 'development'
    };
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(serverInfo) }]
    };
  }
};
