import { config } from 'dotenv';
import { ApiClient, addBlogPost, getUserByEmail, getBlogCategories, getBlogContents } from '@ryuring/basercms-js-sdk';
import OpenAI from 'openai';
import path from 'path';
import { z } from 'zod';

// 高レベル API
// @ts-ignore 型定義が見つからないため無視
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
// @ts-ignore 型定義が見つからないため無視
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// CommonJS互換の __filename, __dirname を利用
const _filename: string = (typeof module !== 'undefined' && module.filename ? module.filename : process.argv[1]);
const _customFilename: string = typeof _filename !== 'undefined' ? _filename : process.argv[1];
const _customDirname: string = path.dirname(_customFilename);
const projectRoot = path.resolve(_customDirname, '..');
const envFilePath = path.join(projectRoot, '.env');

// .envファイルを読み込み
config({ path: envFilePath, debug: false, quiet: true });

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
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      if (!detail) {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'あなたは日本語で分かりやすく解説するAIです。出力は必ずHTMLタグを使用してください。マークダウン記法（#、##、**、-など）は一切使用しないでください。' },
            { role: 'user', content: `${title} について、400文字程度で詳しく説明してください。見出しは<h4>、<h5>タグ、強調は<strong>タグ、リストは<ul><li>タグ、段落は<p>タグを使用してHTMLで記述してください。マークダウン記法は絶対に使用しないでください。` }
          ],
          max_tokens: 1000
        });
        detail = completion.choices[0]?.message?.content ?? '';
      }
      const summaryCompletion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'あなたは日本語で要約するAIです。' },
          { role: 'user', content: `次の内容を100文字以内で要約してください。\n\n${detail}` }
        ],
        max_tokens: 200
      });
      const content = summaryCompletion.choices[0]?.message?.content ?? '';
      const apiClient = new ApiClient();
      try {
        await apiClient.login();
      } catch (error) {
        throw error;
      }
      
      // emailが指定されている場合はユーザーIDを取得、そうでなければデフォルト値を使用
      let userId = 1;
      if (email) {
        try {
          const user = await getUserByEmail(apiClient, email);
          if (user && user.id) {
            userId = user.id;
          }
        } catch (error) {
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
          } else {
          }
        } catch (error) {
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
            }
          }
        } catch (error) {
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
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }]
      };
      } catch (error) {
        throw error;
      }
    }
  );

  // serverInfo ツール登録
  server.registerTool(
    'serverInfo',
    {
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
