import { z } from 'zod';
import { addBlogPost, getBlogContents, getBlogCategories, getUserByEmail, getBlogPost, getBlogPosts, deleteBlogPost } from '@ryuring/basercms-js-sdk';
import { ToolDefinition } from '../../types/tool';
import { createApiClient } from '../../utils/api-client';

/**
 * ブログ投稿ツール
 * baserCMSのブログ記事を作成するためのMCPツール
 */
export const addBlogPostTool: ToolDefinition = {
  name: 'addBlogPost',
  description: 'ブログ記事を追加します',
  inputSchema: {
    title: z.string().describe('記事タイトル（必須）'),
    detail: z.string().describe('記事詳細（必須）'),
    email: z.string().email().optional().describe('ユーザーのメールアドレス（省略時はデフォルトユーザー）'),
    category: z.string().optional().describe('カテゴリ名（省略時はカテゴリなし）'),
    blog_content: z.string().optional().describe('ブログコンテンツ名（省略時はデフォルト）')
  },

  /**
   * ブログ記事を追加するハンドラー
   * @param input 入力パラメータ
   * @param input.title 記事タイトル（必須）
   * @param input.detail 記事詳細（必須）
   * @param input.email ユーザーのメールアドレス（省略時はデフォルトユーザー）
   * @param input.category カテゴリ名（省略時はカテゴリなし）
   * @param input.blog_content ブログコンテンツ名（省略時はデフォルト）
   * @returns 作成されたブログ記事の情報
   */
  handler: async function (input: { title: string; detail: string; email?: string; category?: string; blog_content?: string }) {
    const { title, detail, email, category, blog_content } = input;

    if (!title) {
      throw new Error('titleが指定されていません');
    }

    if (!detail) {
      throw new Error('detailが指定されていません');
    }

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
      content: '',
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

/**
 * ブログ記事取得ツール
 * baserCMSの単一ブログ記事を取得するためのMCPツール
 */
export const getBlogPostTool: ToolDefinition = {
  name: 'getBlogPost',
  description: '指定されたIDのブログ記事を取得します',
  inputSchema: {
    id: z.number().describe('記事ID（必須）'),
    blog_content_id: z.number().optional().describe('ブログコンテンツID（省略時はデフォルト）')
  },

  /**
   * ブログ記事を取得するハンドラー
   * @param input 入力パラメータ
   * @param input.id 記事ID（必須）
   * @param input.blog_content_id ブログコンテンツID（省略時はデフォルト）
   * @returns 取得されたブログ記事の情報
   */
  handler: async function (input: {
    id: number;
    blog_content_id?: number;
  }) {
    const { id, blog_content_id } = input;

    if (!id) {
      throw new Error('idが指定されていません');
    }

    const apiClient = await createApiClient();

    try {
      // ブログコンテンツIDの解決
      const resolvedBlogContentId = blog_content_id || 1;

      // ブログ記事を取得（SDKのgetBlogPostを使用）
      const result = await getBlogPost(apiClient, String(id));

      if (!result) {
        throw new Error(`ID ${id} のブログ記事が見つかりません`);
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'ブログ記事の取得に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  }
};

/**
 * ブログ記事一覧取得ツール
 * baserCMSのブログ記事一覧を取得するためのMCPツール
 */
export const getBlogPostsTool: ToolDefinition = {
  name: 'getBlogPosts',
  description: 'ブログ記事の一覧を取得します',
  inputSchema: {
    blog_content_id: z.number().optional().describe('ブログコンテンツID（省略時はデフォルト）'),
    limit: z.number().optional().describe('取得件数（省略時は10件）'),
    page: z.number().optional().describe('ページ番号（省略時は1ページ目）'),
    keyword: z.string().optional().describe('検索キーワード'),
    status: z.number().optional().describe('公開ステータス（0: 非公開, 1: 公開）')
  },

  /**
   * ブログ記事一覧を取得するハンドラー
   * @param input 入力パラメータ
   * @param input.blog_content_id ブログコンテンツID（省略時はデフォルト）
   * @param input.limit 取得件数（省略時は10件）
   * @param input.page ページ番号（省略時は1ページ目）
   * @param input.keyword 検索キーワード
   * @param input.status 公開ステータス
   * @returns 取得されたブログ記事一覧の情報
   */
  handler: async function (input: {
    blog_content_id?: number;
    limit?: number;
    page?: number;
    keyword?: string;
    status?: number;
  }) {
    const { blog_content_id, limit, page, keyword, status } = input;

    const apiClient = await createApiClient();

    try {
      // ブログコンテンツIDの解決
      const resolvedBlogContentId = blog_content_id || 1;

      // 検索オプションを構築
      const options: any = {
        admin: true
      };

      if (limit !== undefined) options.limit = limit;
      if (page !== undefined) options.page = page;
      if (keyword !== undefined) options.keyword = keyword;
      if (status !== undefined) options.status = status;

      // ブログ記事一覧を取得（SDKのgetBlogPostsを使用）
      const result = await getBlogPosts(apiClient, options);

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'ブログ記事一覧の取得に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  }
};

/**
 * ブログ記事削除ツール
 * baserCMSのブログ記事を削除するためのMCPツール
 */
export const deleteBlogPostTool: ToolDefinition = {
  name: 'deleteBlogPost',
  description: '指定されたIDのブログ記事を削除します',
  inputSchema: {
    id: z.number().describe('記事ID（必須）'),
    blog_content_id: z.number().optional().describe('ブログコンテンツID（省略時はデフォルト）')
  },

  /**
   * ブログ記事を削除するハンドラー
   * @param input 入力パラメータ
   * @param input.id 記事ID（必須）
   * @param input.blog_content_id ブログコンテンツID（省略時はデフォルト）
   * @returns 削除結果の情報
   */
  handler: async function (input: {
    id: number;
    blog_content_id?: number;
  }) {
    const { id, blog_content_id } = input;

    if (!id) {
      throw new Error('idが指定されていません');
    }

    const apiClient = await createApiClient();

    try {
      // ブログコンテンツIDの解決
      const resolvedBlogContentId = blog_content_id || 1;

      // ブログ記事を削除（SDKのdeleteBlogPostを使用）
      const result = await deleteBlogPost(apiClient, String(id));

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            message: `記事ID ${id} のブログ記事を削除しました。`,
            deletedId: id,
            result: result
          })
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'ブログ記事の削除に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  }
};

/**
 * ブログ記事編集ツール
 * baserCMSのブログ記事を編集するためのMCPツール
 */
export const editBlogPostTool: ToolDefinition = {
  name: 'editBlogPost',
  description: 'ブログ記事を編集します',
  inputSchema: {
    id: z.number().describe('記事ID（必須）'),
    title: z.string().optional().describe('記事タイトル'),
    detail: z.string().optional().describe('記事詳細'),
    content: z.string().optional().describe('記事概要'),
    email: z.string().email().optional().describe('ユーザーのメールアドレス'),
    category: z.string().optional().describe('カテゴリ名'),
    blog_content: z.string().optional().describe('ブログコンテンツ名'),
    status: z.number().optional().describe('公開ステータス（0: 非公開, 1: 公開）'),
    name: z.string().optional().describe('記事のスラッグ'),
    eye_catch: z.string().optional().describe('アイキャッチ画像（URL）'),
    blog_category_id: z.number().optional().describe('カテゴリID（categoryと併用不可）'),
    user_id: z.number().optional().describe('ユーザーID（emailと併用不可）'),
    blog_content_id: z.number().optional().describe('ブログコンテンツID（省略時はデフォルト）')
  },

  /**
   * ブログ記事を編集するハンドラー
   * @param input 入力パラメータ
   * @param input.id 記事ID（必須）
   * @param input.title 記事タイトル
   * @param input.detail 記事詳細
   * @param input.content 記事概要
   * @param input.email ユーザーのメールアドレス
   * @param input.category カテゴリ名
   * @param input.blog_content ブログコンテンツ名
   * @param input.status 公開ステータス
   * @param input.name 記事のスラッグ
   * @param input.eye_catch アイキャッチ画像（URL）
   * @param input.blog_category_id カテゴリID（categoryと併用不可）
   * @param input.user_id ユーザーID（emailと併用不可）
   * @param input.blog_content_id ブログコンテンツID（blog_contentと併用不可）
   * @returns 編集されたブログ記事の情報
   */
  handler: async function (input: {
    id: number;
    title?: string;
    detail?: string;
    content?: string;
    email?: string;
    category?: string;
    blog_content?: string;
    status?: number;
    name?: string;
    eye_catch?: string;
    blog_category_id?: number;
    user_id?: number;
    blog_content_id?: number;
  }) {
    const {
      id,
      title,
      detail,
      content,
      email,
      category,
      blog_content,
      status,
      name,
      eye_catch,
      blog_category_id,
      user_id,
      blog_content_id
    } = input;

    if (!id) {
      throw new Error('idが指定されていません');
    }

    const apiClient = await createApiClient();

    // 編集データを構築
    const updateData: any = {};

    // 基本フィールドの設定
    if (title !== undefined) updateData.title = title;
    if (detail !== undefined) updateData.detail = detail;
    if (content !== undefined) updateData.content = content;
    if (status !== undefined) updateData.status = status;
    if (name !== undefined) updateData.name = name;
    if (eye_catch !== undefined) updateData.eye_catch = eye_catch;

    // ユーザーIDの解決（直接指定がない場合はemailから取得）
    if (user_id !== undefined) {
      updateData.user_id = user_id;
    } else if (email) {
      updateData.user_id = await addBlogPostTool.getUserId(apiClient, email);
    }

    // ブログコンテンツIDの解決（必須フィールド）
    let resolvedBlogContentId: number;
    if (blog_content_id !== undefined) {
      resolvedBlogContentId = blog_content_id;
    } else if (blog_content) {
      resolvedBlogContentId = await addBlogPostTool.getBlogContentId(apiClient, blog_content);
    } else {
      // どちらも指定されていない場合はデフォルト値（1）を使用
      resolvedBlogContentId = 1;
    }
    updateData.blog_content_id = resolvedBlogContentId;

    // カテゴリIDの解決（直接指定がない場合はcategoryから取得）
    if (blog_category_id !== undefined) {
      updateData.blog_category_id = blog_category_id;
    } else if (category && resolvedBlogContentId) {
      updateData.blog_category_id = await addBlogPostTool.getCategoryId(apiClient, resolvedBlogContentId, category);
    }

    // 編集実行（admin権限を明示的に指定、idは文字列に変換）
    const result = await apiClient.edit({
      endpoint: "blogPosts",
      id: String(id),
      data: updateData,
      options: { admin: true }
    });

    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result) }]
    };
  }
};
