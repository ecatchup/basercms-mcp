import { z } from 'zod';
import { getBlogCategories, getBlogCategory, addBlogCategory, editBlogCategory, deleteBlogCategory } from '@ryuring/basercms-js-sdk';
import { ToolDefinition } from '../../types/tool';
import { createApiClient } from '../../utils/api-client';

/**
 * ブログカテゴリ単一取得ツール
 * baserCMSの単一ブログカテゴリを取得するためのMCPツール
 */
export const getBlogCategoryTool: ToolDefinition = {
  name: 'getBlogCategory',
  description: '指定されたIDのブログカテゴリを取得します',
  inputSchema: {
    id: z.number().describe('カテゴリID（必須）'),
    blog_content_id: z.number().optional().describe('ブログコンテンツID（省略時はデフォルト）')
  },

  /**
   * ブログカテゴリを取得するハンドラー
   * @param input 入力パラメータ
   * @param input.id カテゴリID（必須）
   * @param input.blog_content_id ブログコンテンツID（省略時はデフォルト）
   * @returns 取得されたブログカテゴリの情報
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

      // ブログカテゴリを取得（SDKのgetBlogCategoryを使用）
      const result = await getBlogCategory(apiClient, id);

      if (!result) {
        throw new Error(`ID ${id} のブログカテゴリが見つかりません`);
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'ブログカテゴリの取得に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  }
};

/**
 * ブログカテゴリ一覧取得ツール
 * baserCMSのブログカテゴリ一覧を取得するためのMCPツール
 */
export const getBlogCategoriesTool: ToolDefinition = {
  name: 'getBlogCategories',
  description: 'ブログカテゴリの一覧を取得します',
  inputSchema: {
    blog_content_id: z.number().optional().describe('ブログコンテンツID（省略時はデフォルト）'),
    limit: z.number().optional().describe('取得件数（省略時は制限なし）'),
    page: z.number().optional().describe('ページ番号（省略時は1ページ目）'),
    keyword: z.string().optional().describe('検索キーワード'),
    status: z.number().optional().describe('公開ステータス（0: 非公開, 1: 公開）')
  },

  /**
   * ブログカテゴリ一覧を取得するハンドラー
   * @param input 入力パラメータ
   * @param input.blog_content_id ブログコンテンツID（省略時はデフォルト）
   * @param input.limit 取得件数（省略時は制限なし）
   * @param input.page ページ番号（省略時は1ページ目）
   * @param input.keyword 検索キーワード
   * @param input.status 公開ステータス
   * @returns 取得されたブログカテゴリ一覧の情報
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

      // ブログカテゴリ一覧を取得（SDKのgetBlogCategoriesを使用）
      const result = await getBlogCategories(apiClient, resolvedBlogContentId, options);

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'ブログカテゴリ一覧の取得に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  }
};

/**
 * ブログカテゴリ追加ツール
 * baserCMSのブログカテゴリを追加するためのMCPツール
 */
export const addBlogCategoryTool: ToolDefinition = {
  name: 'addBlogCategory',
  description: 'ブログカテゴリを追加します',
  inputSchema: {
    title: z.string().describe('カテゴリタイトル（必須）'),
    name: z.string().optional().describe('カテゴリ名（省略時はタイトルから自動生成）'),
    blog_content_id: z.number().optional().describe('ブログコンテンツID（省略時はデフォルト）'),
    parent_id: z.number().optional().describe('親カテゴリID（省略時はルートカテゴリ）'),
    status: z.number().optional().default(1).describe('公開ステータス（0: 非公開, 1: 公開）'),
    lft: z.number().optional().describe('左値（省略時は自動設定）'),
    rght: z.number().optional().describe('右値（省略時は自動設定）')
  },

  /**
   * ブログカテゴリを追加するハンドラー
   * @param input 入力パラメータ
   * @param input.title カテゴリタイトル（必須）
   * @param input.name カテゴリ名（省略時はタイトルから自動生成）
   * @param input.blog_content_id ブログコンテンツID（省略時はデフォルト）
   * @param input.parent_id 親カテゴリID（省略時はルートカテゴリ）
   * @param input.status 公開ステータス
   * @param input.lft 左値（省略時は自動設定）
   * @param input.rght 右値（省略時は自動設定）
   * @returns 作成されたブログカテゴリの情報
   */
  handler: async function (input: {
    title: string;
    name?: string;
    blog_content_id?: number;
    parent_id?: number;
    status?: number;
    lft?: number;
    rght?: number;
  }) {
    const { title, name, blog_content_id, parent_id, status, lft, rght } = input;

    if (!title) {
      throw new Error('titleが指定されていません');
    }

    const apiClient = await createApiClient();

    try {
      // ブログコンテンツIDの解決
      const resolvedBlogContentId = blog_content_id || 1;

      // カテゴリ名の自動生成（指定されていない場合）
      const categoryName = name || title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');

      const categoryData = {
        blog_content_id: resolvedBlogContentId,
        no: null,
        name: categoryName,
        title,
        status: status ?? 1,
        parent_id: parent_id || null,
        lft: lft || null,
        rght: rght || null
      };

      // ブログカテゴリを追加（SDKのaddBlogCategoryを使用）
      const result = await addBlogCategory(apiClient, categoryData);

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'ブログカテゴリの追加に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  }
};

/**
 * ブログカテゴリ編集ツール
 * baserCMSのブログカテゴリを編集するためのMCPツール
 */
export const editBlogCategoryTool: ToolDefinition = {
  name: 'editBlogCategory',
  description: '指定されたIDのブログカテゴリを編集します',
  inputSchema: {
    id: z.number().describe('カテゴリID（必須）'),
    title: z.string().optional().describe('カテゴリタイトル'),
    name: z.string().optional().describe('カテゴリ名'),
    blog_content_id: z.number().optional().describe('ブログコンテンツID（省略時はデフォルト）'),
    parent_id: z.number().optional().describe('親カテゴリID'),
    status: z.number().optional().describe('公開ステータス（0: 非公開, 1: 公開）'),
    lft: z.number().optional().describe('左値'),
    rght: z.number().optional().describe('右値')
  },

  /**
   * ブログカテゴリを編集するハンドラー
   * @param input 入力パラメータ
   * @param input.id カテゴリID（必須）
   * @param input.title カテゴリタイトル
   * @param input.name カテゴリ名
   * @param input.blog_content_id ブログコンテンツID（省略時はデフォルト）
   * @param input.parent_id 親カテゴリID
   * @param input.status 公開ステータス
   * @param input.lft 左値
   * @param input.rght 右値
   * @returns 編集されたブログカテゴリの情報
   */
  handler: async function (input: {
    id: number;
    title?: string;
    name?: string;
    blog_content_id?: number;
    parent_id?: number;
    status?: number;
    lft?: number;
    rght?: number;
  }) {
    const { id, title, name, blog_content_id, parent_id, status, lft, rght } = input;

    if (!id) {
      throw new Error('idが指定されていません');
    }

    const apiClient = await createApiClient();

    try {
      // ブログコンテンツIDの解決
      const resolvedBlogContentId = blog_content_id || 1;

      // 更新データを構築
      const updateData: any = {};

      if (title !== undefined) updateData.title = title;
      if (name !== undefined) updateData.name = name;
      if (blog_content_id !== undefined) updateData.blog_content_id = resolvedBlogContentId;
      if (parent_id !== undefined) updateData.parent_id = parent_id;
      if (status !== undefined) updateData.status = status;
      if (lft !== undefined) updateData.lft = lft;
      if (rght !== undefined) updateData.rght = rght;

      // ブログカテゴリを編集（SDKのeditBlogCategoryを使用）
      const result = await editBlogCategory(apiClient, String(id), updateData);

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'ブログカテゴリの編集に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  }
};

/**
 * ブログカテゴリ削除ツール
 * baserCMSのブログカテゴリを削除するためのMCPツール
 */
export const deleteBlogCategoryTool: ToolDefinition = {
  name: 'deleteBlogCategory',
  description: '指定されたIDのブログカテゴリを削除します',
  inputSchema: {
    id: z.number().describe('カテゴリID（必須）'),
    blog_content_id: z.number().optional().describe('ブログコンテンツID（省略時はデフォルト）')
  },

  /**
   * ブログカテゴリを削除するハンドラー
   * @param input 入力パラメータ
   * @param input.id カテゴリID（必須）
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

      // ブログカテゴリを削除（SDKのdeleteBlogCategoryを使用）
      const result = await deleteBlogCategory(apiClient, String(id));

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            message: `ブログカテゴリ ID ${id} を削除しました`,
            data: result
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'ブログカテゴリの削除に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  }
};
