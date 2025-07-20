import { z } from 'zod';
import { addBlogPost, getBlogContents, getBlogCategories, getUserByEmail } from '@ryuring/basercms-js-sdk';
import { ToolDefinition } from '../../types/tool';
import { createApiClient } from '../../utils/api-client';
import { OpenAIService } from '../../utils/openai';

/**
 * ブログ投稿ツール
 * baserCMSのブログ記事を作成するためのMCPツール
 */
export const addBlogPostTool: ToolDefinition = {
  name: 'addBlogPost',
  description: 'ブログ記事を追加します',
  inputSchema: {
    title: z.string().describe('記事タイトル（必須）'),
    detail: z.string().optional().describe('記事詳細（省略時はAIで生成）'),
    email: z.string().email().optional().describe('ユーザーのメールアドレス（省略時はデフォルトユーザー）'),
    category: z.string().optional().describe('カテゴリ名（省略時はカテゴリなし）'),
    blog_content: z.string().optional().describe('ブログコンテンツ名（省略時はデフォルト）')
  },
  
  /**
   * ブログ記事を追加するハンドラー
   * @param input 入力パラメータ
   * @param input.title 記事タイトル（必須）
   * @param input.detail 記事詳細（省略時はAIで生成）
   * @param input.email ユーザーのメールアドレス（省略時はデフォルトユーザー）
   * @param input.category カテゴリ名（省略時はカテゴリなし）
   * @param input.blog_content ブログコンテンツ名（省略時はデフォルト）
   * @returns 作成されたブログ記事の情報
   */
  handler: async function(input: { title: string; detail?: string; email?: string; category?: string; blog_content?: string }) {
    const { title, detail: inputDetail, email, category, blog_content } = input;
    
    if (!title) {
      throw new Error('titleが指定されていません');
    }

    const openaiService = new OpenAIService();
    let detail = inputDetail;
    
    if (!detail) {
      detail = await openaiService.generateDetail(title);
    }
    
    const content = await openaiService.generateSummary(detail);
    const apiClient = await createApiClient();
    
    const userId = await addBlogPostTool.getUserId(apiClient, email);
    const blogContentId = await addBlogPostTool.getBlogContentId(apiClient, blog_content);
    
    const categoryId = await addBlogPostTool.getCategoryId(apiClient, blogContentId, category);
    
    const posted = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
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
  },
  /**
   * ユーザーIDを取得するメソッド
   * @param apiClient baserCMS APIクライアント
   * @param email ユーザーのメールアドレス
   * @returns ユーザーID（見つからない場合は1）
   */
  async getUserId(apiClient: any, email?: string): Promise<number> {
    if (!email) return 1;
    
    try {
      const user = await getUserByEmail(apiClient, email);
      return user?.id || 1;
    } catch (error) {
      return 1;
    }
  },

  /**
   * ブログコンテンツIDを取得するメソッド
   * @param apiClient baserCMS APIクライアント
   * @param blogContent ブログコンテンツ名
   * @returns ブログコンテンツID（見つからない場合は1）
   */
  async getBlogContentId(apiClient: any, blogContent?: string): Promise<number> {
    if (!blogContent) return 1;
    
    try {
      const blogContents = await getBlogContents(apiClient, { admin: true, title: blogContent });
      if (blogContents && Array.isArray(blogContents) && blogContents.length > 0) {
        return blogContents[0].id;
      }
      return 1;
    } catch (error) {
      return 1;
    }
  },

  /**
   * カテゴリIDを取得するメソッド
   * @param apiClient baserCMS APIクライアント
   * @param blogContentId ブログコンテンツID
   * @param category カテゴリ名
   * @returns カテゴリID（見つからない場合はnull）
   */
  async getCategoryId(apiClient: any, blogContentId: number, category?: string): Promise<number | null> {
    if (!category) return null;
    
    try {
      const categories = await getBlogCategories(apiClient, blogContentId, { admin: true, title: category });
      if (categories && Array.isArray(categories)) {
        const foundCategory = categories.find((cat: any) => 
          cat.name === category || cat.title === category
        );
        return foundCategory?.id || null;
      }
      return null;
    } catch (error) {
      return null;
    }
  }
};
