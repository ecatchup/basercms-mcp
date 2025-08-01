import { z } from 'zod';
import { getBlogTags, getBlogTag, addBlogTag, editBlogTag, deleteBlogTag } from '@ryuring/basercms-js-sdk';
import { ToolDefinition } from '../../types/tool';
import { createApiClient } from '../../utils/api-client';

/**
 * ブログタグ単一取得ツール
 * baserCMSの単一ブログタグを取得するためのMCPツール
 */
export const getBlogTagTool: ToolDefinition = {
  name: 'getBlogTag',
  description: '指定されたIDのブログタグを取得します',
  inputSchema: {
    id: z.number().describe('ブログタグID（必須）')
  },

  /**
   * ブログタグを取得するハンドラー
   * @param input 入力パラメータ
   * @param input.id ブログタグID（必須）
   * @returns 取得されたブログタグの情報
   */
  handler: async function (input: { id: number }) {
    const { id } = input;

    if (!id) {
      throw new Error('idが指定されていません');
    }

    const apiClient = await createApiClient();

    try {
      // ブログタグを取得（SDKのgetBlogTagを使用）
      const result = await getBlogTag(apiClient, id);

      if (!result) {
        throw new Error(`ID ${id} のブログタグが見つかりません`);
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'ブログタグの取得に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  }
};

/**
 * ブログタグ一覧取得ツール
 * baserCMSのブログタグ一覧を取得するためのMCPツール
 */
export const getBlogTagsTool: ToolDefinition = {
  name: 'getBlogTags',
  description: 'ブログタグの一覧を取得します',
  inputSchema: {
    limit: z.number().optional().describe('取得件数（省略時は制限なし）'),
    page: z.number().optional().describe('ページ番号（省略時は1ページ目）'),
    keyword: z.string().optional().describe('検索キーワード'),
    name: z.string().optional().describe('タグ名での検索')
  },

  /**
   * ブログタグ一覧を取得するハンドラー
   * @param input 入力パラメータ
   * @param input.limit 取得件数（省略時は制限なし）
   * @param input.page ページ番号（省略時は1ページ目）
   * @param input.keyword 検索キーワード
   * @param input.name タグ名での検索
   * @returns 取得されたブログタグ一覧の情報
   */
  handler: async function (input: {
    limit?: number;
    page?: number;
    keyword?: string;
    name?: string;
  }) {
    const { limit, page, keyword, name } = input;

    const apiClient = await createApiClient();

    try {
      // 検索オプションを構築
      const options: any = {
        admin: true
      };

      if (limit !== undefined) options.limit = limit;
      if (page !== undefined) options.page = page;
      if (keyword !== undefined) options.keyword = keyword;
      if (name !== undefined) options.name = name;

      // ブログタグ一覧を取得（SDKのgetBlogTagsを使用）
      const result = await getBlogTags(apiClient, options);

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'ブログタグ一覧の取得に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  }
};

/**
 * ブログタグ追加ツール
 * baserCMSのブログタグを追加するためのMCPツール
 */
export const addBlogTagTool: ToolDefinition = {
  name: 'addBlogTag',
  description: 'ブログタグを追加します',
  inputSchema: {
    name: z.string().describe('タグ名（必須）')
  },

  /**
   * ブログタグを追加するハンドラー
   * @param input 入力パラメータ
   * @param input.name タグ名（必須）
   * @returns 作成されたブログタグの情報
   */
  handler: async function (input: { name: string }) {
    const { name } = input;

    if (!name) {
      throw new Error('nameが指定されていません');
    }

    const apiClient = await createApiClient();

    try {
      const tagData = {
        name: name.trim(),
        created: new Date().toISOString().slice(0, 19).replace('T', ' '),
        modified: new Date().toISOString().slice(0, 19).replace('T', ' ')
      };

      // ブログタグを追加（SDKのaddBlogTagを使用）
      const result = await addBlogTag(apiClient, tagData);

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'ブログタグの追加に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  }
};

/**
 * ブログタグ編集ツール
 * baserCMSのブログタグを編集するためのMCPツール
 */
export const editBlogTagTool: ToolDefinition = {
  name: 'editBlogTag',
  description: '指定されたIDのブログタグを編集します',
  inputSchema: {
    id: z.number().describe('ブログタグID（必須）'),
    name: z.string().describe('タグ名（必須）')
  },

  /**
   * ブログタグを編集するハンドラー
   * @param input 入力パラメータ
   * @param input.id ブログタグID（必須）
   * @param input.name タグ名（必須）
   * @returns 編集されたブログタグの情報
   */
  handler: async function (input: {
    id: number;
    name: string;
  }) {
    const { id, name } = input;

    if (!id) {
      throw new Error('idが指定されていません');
    }

    if (!name) {
      throw new Error('nameが指定されていません');
    }

    const apiClient = await createApiClient();

    try {
      // 更新データを構築
      const updateData = {
        name: name.trim(),
        modified: new Date().toISOString().slice(0, 19).replace('T', ' ')
      };

      // ブログタグを編集（SDKのeditBlogTagを使用）
      const result = await editBlogTag(apiClient, String(id), updateData);

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'ブログタグの編集に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  }
};

/**
 * ブログタグ削除ツール
 * baserCMSのブログタグを削除するためのMCPツール
 */
export const deleteBlogTagTool: ToolDefinition = {
  name: 'deleteBlogTag',
  description: '指定されたIDのブログタグを削除します',
  inputSchema: {
    id: z.number().describe('ブログタグID（必須）')
  },

  /**
   * ブログタグを削除するハンドラー
   * @param input 入力パラメータ
   * @param input.id ブログタグID（必須）
   * @returns 削除結果の情報
   */
  handler: async function (input: { id: number }) {
    const { id } = input;

    if (!id) {
      throw new Error('idが指定されていません');
    }

    const apiClient = await createApiClient();

    try {
      // ブログタグを削除（SDKのdeleteBlogTagを使用）
      const result = await deleteBlogTag(apiClient, String(id));

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            message: `ブログタグ ID ${id} を削除しました`,
            data: result
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'ブログタグの削除に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  }
};
