import { config } from 'dotenv';
import { ApiClient, addBlogPost } from '@ryuring/basercms-js-sdk';
import OpenAI from 'openai';
import { z } from 'zod';
// 高レベル API
// @ts-ignore 型定義が見つからないため無視
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// @ts-ignore 型定義が見つからないため無視
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

config();

/**
 * メインエントリ
 */
async function main() {
  // MCP サーバーを初期化
  const server = new McpServer({
    name: 'basercms-mcp',
    version: '0.1.0',
    description: 'baserCMS を操作するための MCP サーバー'
  });

  // addArticle ツール登録
  server.registerTool(
    'addArticle',
    {
      title: 'ブログ記事を追加',
      description: 'ブログ記事を追加します',
      inputSchema: {
        title: z.string(),
        detail: z.string().optional()
      }
    },
    async ({ title, detail }: { title: string; detail?: string }) => {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      if (!detail) {
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'あなたは日本語で分かりやすく解説するAIです。' },
            { role: 'user', content: `${title} について、200文字程度で詳しく説明してください。` }
          ],
          max_tokens: 1000
        });
        detail = completion.choices[0]?.message?.content ?? '';
      }
      const summaryCompletion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'あなたは日本語で要約するAIです。' },
          { role: 'user', content: `次の内容を100文字以内で要約してください。\n\n${detail}` }
        ],
        max_tokens: 200
      });
      const content = summaryCompletion.choices[0]?.message?.content ?? '';
      const apiClient = new ApiClient();
      await apiClient.login();
      const posted = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const result = await addBlogPost(apiClient, {
        blog_content_id: Number(process.env.BLOG_CONTENT_ID),
        no: null,
        name: '',
        title,
        content,
        detail,
        blog_category_id: 1,
        user_id: 1,
        status: 1,
        eye_catch: '',
        posted
      } as any);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }]
      };
    }
  );

  // serverInfo ツール登録
  server.registerTool(
    'serverInfo',
    {
      title: 'サーバー情報',
      description: 'サーバーのバージョンや環境情報を返します',
      inputSchema: {}
    },
    async () => ({
      content: [{ type: 'text' as const, text: JSON.stringify({
        node: process.version,
        env: process.env.NODE_ENV ?? 'development'
      }) }]
    })
  );

  // tools/list ツール一覧
  server.registerTool(
    'tools/list',
    {
      title: '利用可能なツール一覧',
      description: 'このサーバーで利用できるツール一覧を返します',
      inputSchema: {}
    },
    async () => {
      return {
        content: [{ 
          type: 'text' as const, 
          text: '利用可能なツール:\n1. addArticle - ブログ記事を追加します\n2. serverInfo - サーバー情報を返します\n3. tools/list - このツール一覧を表示します'
        }]
      };
    }
  );

  // Stdio で接続
  await server.connect(new StdioServerTransport());
}

main().catch(console.error);
