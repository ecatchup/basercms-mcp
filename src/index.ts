import { config } from 'dotenv';
import { ApiClient, addBlogPost, getUserByEmail, getBlogCategories, getBlogContents } from '@ryuring/basercms-js-sdk';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

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
  const requiredEnvVars = ['OPENAI_API_KEY', 'API_BASE_URL', 'API_USER', 'API_PASSWORD'];
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
      description: 'ブログ記事を追加します',
      inputSchema: {
        title:        z.string(),
        detail:       z.string().optional(),
        email:        z.string().email().optional(),
        category:     z.string().optional(),
        blog_content: z.string().optional()
      }
    },
    async (input: { title?: string; detail?: string; name?: string; email?: string; category?: string; blog_content?: string } = {}) => {
      const title = input.title;
      let detail = input.detail;
      const email = input.email;
      const category = input.category;
      const blogContent = input.blog_content;
      
      if (!title) {
        throw new Error('titleが指定されていません');
      }
      console.log(`記事追加リクエスト受信: タイトル "${title}"`);
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      if (!detail) {
        console.log('本文が空のため、AIで生成します');
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
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
        model: 'gpt-4o-mini',
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
      
      // emailが指定されている場合はユーザーIDを取得、そうでなければデフォルト値を使用
      let userId = 1;
      if (email) {
        try {
          console.log(`ユーザー情報を取得中: ${email}`);
          const user = await getUserByEmail(apiClient, email);
          if (user && user.id) {
            console.log(`ユーザーが見つかりました: ID=${user.id}, Name=${user.name || 'N/A'}`);
            userId = user.id;
          } else {
            console.warn(`指定されたemail (${email}) のユーザーが見つかりませんでした。デフォルトのuser_id=1を使用します。`);
          }
        } catch (error) {
          console.error('ユーザー情報の取得に失敗しました:', error);
          console.warn('デフォルトのuser_id=1を使用します。');
        }
      }

      // blog_contentが指定されている場合はブログコンテンツIDを取得、そうでなければデフォルト値1を使用
      let blogContentId = 1;
      if (blogContent) {
        try {
          let blogContents = null;
          try {
            blogContents = await getBlogContents(apiClient, {admin: true, title: blogContent});
          } catch (getIndexError) {
            blogContents = null;
          }
        
          if (blogContents && Array.isArray(blogContents) && blogContents.length > 0) {
              blogContentId = blogContents[0].id;
              console.log(`指定されたblog_content (${blogContent}) が見つかりました: ID=${blogContentId}`);
          } else {
            console.warn('ブログコンテンツ情報が取得できませんでした。デフォルトのblog_content_id=1を使用します。');
          }
        } catch (error) {
          console.error('ブログコンテンツ情報の取得に失敗しました:', error);
          console.warn('デフォルトのblog_content_id=1を使用します。');
        }
      }

      // categoryが指定されている場合はカテゴリIDを取得、そうでなければデフォルト値を使用
      let categoryId = 0;
      if (category) {
        try {
          const categories = await getBlogCategories(apiClient, blogContentId, { admin: true, title: category });
          if (categories && Array.isArray(categories)) {
            const foundCategory = categories.find((cat: any) => 
              cat.name === category || cat.title === category
            );
            if (foundCategory) {
              categoryId = foundCategory.id;
            } else {
              console.warn(`指定されたcategory (${category}) が見つかりませんでした。デフォルトのcategory_id=1を使用します。`);
            }
          }
        } catch (error) {
          console.error('カテゴリ情報の取得に失敗しました:', error);
          console.warn('デフォルトのcategory_id=1を使用します。');
        }
      }
      
      const posted = new Date().toISOString().slice(0, 19).replace('T', ' ');
      try {
        const result = await addBlogPost(apiClient, {
        blog_content_id: blogContentId,
        no: null,
        name: '',
        title,
        content,
        detail,
        blog_category_id: categoryId,
        user_id: userId,
        status: 0,
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
      description: 'サーバーのバージョンや環境情報を返します',
      inputSchema: {
        type: 'object',
        properties: {}
      } as any
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
      description: 'このサーバーで利用できるツール一覧を返します',
      inputSchema: {
        type: 'object',
        properties: {}
      } as any
    },
    async () => {
      return {
        content: [{ 
          type: 'text' as const, 
          text: '利用可能なツール:\n1. addBlogPost - ブログ記事を追加します\n2. serverInfo - サーバー情報を返します\n3. tools/list - このツール一覧を表示します'
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
