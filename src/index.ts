import { config } from 'dotenv';
import { ApiClient, addBlogPost } from '@ryuring/basercms-js-sdk';
import OpenAI from 'openai';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
// 高レベル API
// @ts-ignore 型定義が見つからないため無視
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// @ts-ignore 型定義が見つからないため無視
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

config();

/**
 * 環境変数の検証
 */
function validateEnv() {
  const requiredEnvVars = ['OPENAI_API_KEY', 'BLOG_CONTENT_ID', 'API_BASE_URL', 'API_USER', 'API_PASSWORD'];
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingEnvVars.length > 0) {
    console.error('必須の環境変数が設定されていません:', missingEnvVars.join(', '));
    console.error('.env ファイルを確認してください');
    
    // .env ファイルが存在しない場合はサンプルを作成
    const envFilePath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envFilePath)) {
      const envSample = 
`# 必須の環境変数
OPENAI_API_KEY=your_openai_api_key_here
BLOG_CONTENT_ID=1

# baserCMS API設定
API_BASE_URL=https://localhost/
API_USER=user@example.com
API_PASSWORD=yourpassword
`;
      try {
        fs.writeFileSync(envFilePath + '.example', envSample);
        console.log('.env.example ファイルを作成しました。このファイルを .env にリネームして値を設定してください。');
      } catch (error) {
        console.error('.env.example ファイルの作成に失敗しました:', error);
      }
    }
    
    return false;
  }
  
  return true;
}

/**
 * メインエントリ
 */
async function main() {
  // 環境変数の検証
  if (!validateEnv()) {
    console.error('環境変数の設定エラーにより、プログラムを終了します。');
    process.exit(1);
  }
  
  console.log('MCPサーバーを初期化しています...');
  
  // MCP サーバーを初期化
  const server = new McpServer({
    name: 'basercms-mcp',
    version: '0.1.0',
    description: 'baserCMS を操作するための MCP サーバー'
  });

  // addBlogPost ツール登録
  server.registerTool(
    'addBlogPost',
    {
      title: 'ブログ記事を追加',
      description: 'ブログ記事を追加します',
      inputSchema: z.object({
        title: z.string(),
        detail: z.string().optional(),
        name: z.string().optional().default('')
      }) as any
    },
    async (input: { title?: string; detail?: string; name?: string } = {}, params?: any) => {
      // 柔軟にtitleを取得（input.title優先、なければparams.title）
      const title = input.title ?? (params && params.title);
      let detail = input.detail ?? (params && params.detail);
      // params.nameがundefinedの場合は空文字に初期化
      if (params && typeof params.name === 'undefined') params.name = '';
      if (!title) {
        throw new Error('titleが指定されていません');
      }
      console.log(`記事追加リクエスト受信: タイトル "${title}"`);
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      if (!detail) {
        console.log('本文が空のため、AIで生成します');
        const completion = await openai.chat.completions.create({
          model: 'gpt-4.1',
          messages: [
            { role: 'system', content: 'あなたは日本語で分かりやすく解説するAIです。出力は必ずHTMLタグを使用してください。マークダウン記法（#、##、**、-など）は一切使用しないでください。' },
            { role: 'user', content: `${title} について、400文字程度で詳しく説明してください。見出しは<h4>、<h5>タグ、強調は<strong>タグ、リストは<ul><li>タグ、段落は<p>タグを使用してHTMLで記述してください。マークダウン記法は絶対に使用しないでください。` }
          ],
          max_tokens: 1000
        });
        detail = completion.choices[0]?.message?.content ?? '';
        console.log('AI生成された本文:', detail.substring(0, 50) + '...');
      }
      console.log('本文の要約を生成中...');
      const summaryCompletion = await openai.chat.completions.create({
        model: 'gpt-4.1',
        messages: [
          { role: 'system', content: 'あなたは日本語で要約するAIです。' },
          { role: 'user', content: `次の内容を100文字以内で要約してください。\n\n${detail}` }
        ],
        max_tokens: 200
      });
      const content = summaryCompletion.choices[0]?.message?.content ?? '';
      console.log('生成された要約:', content);
      
      console.log('baserCMS APIへログイン中...');
      const apiClient = new ApiClient();
      try {
        await apiClient.login();
        console.log('APIログイン成功');
      } catch (error) {
        console.error('APIログイン失敗:', error);
        throw error;
      }
      
      const posted = new Date().toISOString().slice(0, 19).replace('T', ' ');
      console.log('記事を投稿中...');
      try {
        const result = await addBlogPost(apiClient, {
        blog_content_id: Number(process.env.BLOG_CONTENT_ID),
        no: null,
        name: params && typeof params.name === 'string' ? params.name : '',
        title,
        content,
        detail,
        blog_category_id: 1,
        user_id: 1,
        status: 1,
        eye_catch: '',
        posted
      } as any);
      console.log('記事投稿成功:', JSON.stringify(result));
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }]
      };
      } catch (error) {
        console.error('記事投稿エラー:', error);
        throw error;
      }
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
  // 接続前にログ出力
  console.log('MCPサーバー接続を開始します...');
  
  // StdioServerTransportのインスタンス化（オプションなし）
  const stdioTransport = new StdioServerTransport();
  
  // エラーハンドリングを追加
  try {
    await server.connect(stdioTransport);
    console.log('MCPサーバー接続完了');
  } catch (error) {
    console.error('MCPサーバー接続エラー:', error);
    throw error;
  }
}

main().catch(console.error);
