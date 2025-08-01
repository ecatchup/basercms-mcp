import { z } from 'zod';
import { ToolDefinition } from '../../types/tool';
import { createApiClient } from '../../utils/api-client';
import { getCustomLink, getCustomLinks, addCustomLink, editCustomLink, deleteCustomLink } from '@ryuring/basercms-js-sdk';

/**
 * カスタムリンク単一取得ツール
 * baserCMSの単一カスタムリンクを取得するためのMCPツール
 */
export const getCustomLinkTool: ToolDefinition = {
  name: 'getCustomLink',
  description: '指定されたIDのカスタムリンクを取得します',
  inputSchema: {
    id: z.number().describe('カスタムリンクID（必須）')
  },

  /**
   * カスタムリンクを取得するハンドラー
   * @param input 入力パラメータ
   * @param input.id カスタムリンクID（必須）
   * @returns 取得されたカスタムリンクの情報
   */
  handler: async function (input: { id: number }) {
    const { id } = input;

    if (!id) {
      throw new Error('idが指定されていません');
    }

    const apiClient = await createApiClient();

    try {
      // カスタムリンクを取得（SDKのgetCustomLinkを使用）
      const result = await getCustomLink(apiClient, String(id));

      if (!result) {
        throw new Error(`ID ${id} のカスタムリンクが見つかりません`);
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'カスタムリンクの取得に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  }
};

/**
 * カスタムリンク一覧取得ツール
 * baserCMSのカスタムリンク一覧を取得するためのMCPツール
 */
export const getCustomLinksTool: ToolDefinition = {
  name: 'getCustomLinks',
  description: 'カスタムリンクの一覧を取得します',
  inputSchema: {
    limit: z.number().optional().describe('取得件数（省略時は制限なし）'),
    page: z.number().optional().describe('ページ番号（省略時は1ページ目）'),
    keyword: z.string().optional().describe('検索キーワード'),
    status: z.number().optional().describe('ステータス（0: 無効, 1: 有効）'),
    custom_table_id: z.number().optional().describe('カスタムテーブルID'),
    custom_field_id: z.number().optional().describe('カスタムフィールドID'),
    type: z.string().optional().describe('タイプでの絞り込み')
  },

  /**
   * カスタムリンク一覧を取得するハンドラー
   * @param input 入力パラメータ
   * @param input.limit 取得件数（省略時は制限なし）
   * @param input.page ページ番号（省略時は1ページ目）
   * @param input.keyword 検索キーワード
   * @param input.status ステータス
   * @param input.custom_table_id カスタムテーブルID
   * @param input.custom_field_id カスタムフィールドID
   * @param input.type タイプでの絞り込み
   * @returns 取得されたカスタムリンク一覧の情報
   */
  handler: async function (input: {
    limit?: number;
    page?: number;
    keyword?: string;
    status?: number;
    custom_table_id?: number;
    custom_field_id?: number;
    type?: string;
  }) {
    const { limit, page, keyword, status, custom_table_id, custom_field_id, type } = input;

    const apiClient = await createApiClient();

    try {
      // 検索オプションを構築
      const options: any = {
        admin: true
      };

      if (limit !== undefined) options.limit = limit;
      if (page !== undefined) options.page = page;
      if (keyword !== undefined) options.keyword = keyword;
      if (status !== undefined) options.status = status;
      if (custom_table_id !== undefined) options.custom_table_id = custom_table_id;
      if (custom_field_id !== undefined) options.custom_field_id = custom_field_id;
      if (type !== undefined) options.type = type;

      // カスタムリンク一覧を取得（SDKのgetCustomLinksを使用）
      const result = await getCustomLinks(apiClient, options);

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'カスタムリンク一覧の取得に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  }
};

/**
 * カスタムリンク追加ツール
 * baserCMSのカスタムリンクを追加するためのMCPツール
 */
export const addCustomLinkTool: ToolDefinition = {
  name: 'addCustomLink',
  description: 'カスタムリンクを追加します',
  inputSchema: {
    name: z.string().describe('カスタムリンク名（必須）'),
    title: z.string().describe('カスタムリンクのタイトル（必須）'),
    custom_table_id: z.number().describe('カスタムテーブルID（必須）'),
    custom_field_id: z.number().describe('カスタムフィールドID（必須）'),
    type: z.string().optional().describe('タイプ'),
    display_front: z.boolean().optional().describe('フロント表示'),
    use_api: z.boolean().optional().describe('API使用'),
    search_target_admin: z.boolean().optional().describe('管理画面検索対象'),
    search_target_front: z.boolean().optional().describe('フロント検索対象'),
    status: z.boolean().optional().describe('公開状態')
  },

  /**
   * カスタムリンクを追加するハンドラー
   * @param input 入力パラメータ
   * @param input.name カスタムリンク名（必須）
   * @param input.title カスタムリンクのタイトル（必須）
   * @param input.custom_table_id カスタムテーブルID（必須）
   * @param input.custom_field_id カスタムフィールドID（必須）
   * @param input.type タイプ
   * @param input.display_front フロント表示
   * @param input.use_api API使用
   * @param input.search_target_admin 管理画面検索対象
   * @param input.search_target_front フロント検索対象
   * @param input.status 公開状態
   * @returns 作成されたカスタムリンクの情報
   */
  handler: async function (input: {
    name: string;
    title: string;
    custom_table_id: number;
    custom_field_id: number;
    type?: string;
    display_front?: boolean;
    use_api?: boolean;
    search_target_admin?: boolean;
    search_target_front?: boolean;
    status?: boolean;
  }) {
    const {
      name,
      title,
      custom_table_id,
      custom_field_id,
      type,
      display_front = true,
      use_api = true,
      search_target_admin = true,
      search_target_front = true,
      status = true
    } = input;

    if (!name) {
      throw new Error('nameが指定されていません');
    }

    if (!title) {
      throw new Error('titleが指定されていません');
    }

    if (!custom_table_id) {
      throw new Error('custom_table_idが指定されていません');
    }

    if (!custom_field_id) {
      throw new Error('custom_field_idが指定されていません');
    }

    const apiClient = await createApiClient();

    try {
      // カスタムリンクデータを構築
      const customLinkData = {
        name,
        title,
        custom_table_id,
        custom_field_id,
        type: type || '',
        display_front,
        use_api,
        search_target_admin,
        search_target_front,
        status
      } as any;

      // カスタムリンクを追加（SDKのaddCustomLinkを使用）
      const result = await addCustomLink(apiClient, customLinkData);

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'カスタムリンクの追加に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  }
};

/**
 * カスタムリンク編集ツール
 * baserCMSのカスタムリンクを編集するためのMCPツール
 */
export const editCustomLinkTool: ToolDefinition = {
  name: 'editCustomLink',
  description: '指定されたIDのカスタムリンクを編集します',
  inputSchema: {
    id: z.number().describe('カスタムリンクID（必須）'),
    name: z.string().optional().describe('カスタムリンク名'),
    title: z.string().optional().describe('カスタムリンクのタイトル'),
    custom_table_id: z.number().optional().describe('カスタムテーブルID'),
    custom_field_id: z.number().optional().describe('カスタムフィールドID'),
    type: z.string().optional().describe('タイプ'),
    display_front: z.boolean().optional().describe('フロント表示'),
    use_api: z.boolean().optional().describe('API使用'),
    search_target_admin: z.boolean().optional().describe('管理画面検索対象'),
    search_target_front: z.boolean().optional().describe('フロント検索対象'),
    status: z.boolean().optional().describe('公開状態')
  },

  /**
   * カスタムリンクを編集するハンドラー
   * @param input 入力パラメータ
   * @param input.id カスタムリンクID（必須）
   * @param input.name カスタムリンク名
   * @param input.title カスタムリンクのタイトル
   * @param input.custom_table_id カスタムテーブルID
   * @param input.custom_field_id カスタムフィールドID
   * @param input.type タイプ
   * @param input.display_front フロント表示
   * @param input.use_api API使用
   * @param input.search_target_admin 管理画面検索対象
   * @param input.search_target_front フロント検索対象
   * @param input.status 公開状態
   * @returns 編集されたカスタムリンクの情報
   */
  handler: async function (input: {
    id: number;
    name?: string;
    title?: string;
    custom_table_id?: number;
    custom_field_id?: number;
    type?: string;
    display_front?: boolean;
    use_api?: boolean;
    search_target_admin?: boolean;
    search_target_front?: boolean;
    status?: boolean;
  }) {
    const {
      id,
      name,
      title,
      custom_table_id,
      custom_field_id,
      type,
      display_front,
      use_api,
      search_target_admin,
      search_target_front,
      status
    } = input;

    if (!id) {
      throw new Error('idが指定されていません');
    }

    const apiClient = await createApiClient();

    try {
      // 更新データを構築
      const updateData: any = {};

      if (name !== undefined) updateData.name = name;
      if (title !== undefined) updateData.title = title;
      if (custom_table_id !== undefined) updateData.custom_table_id = custom_table_id;
      if (custom_field_id !== undefined) updateData.custom_field_id = custom_field_id;
      if (type !== undefined) updateData.type = type;
      if (display_front !== undefined) updateData.display_front = display_front;
      if (use_api !== undefined) updateData.use_api = use_api;
      if (search_target_admin !== undefined) updateData.search_target_admin = search_target_admin;
      if (search_target_front !== undefined) updateData.search_target_front = search_target_front;
      if (status !== undefined) updateData.status = status;

      // カスタムリンクを編集（SDKのeditCustomLinkを使用）
      const result = await editCustomLink(apiClient, String(id), updateData);

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'カスタムリンクの編集に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  }
};

/**
 * カスタムリンク削除ツール
 * baserCMSのカスタムリンクを削除するためのMCPツール
 */
export const deleteCustomLinkTool: ToolDefinition = {
  name: 'deleteCustomLink',
  description: '指定されたIDのカスタムリンクを削除します',
  inputSchema: {
    id: z.number().describe('カスタムリンクID（必須）')
  },

  /**
   * カスタムリンクを削除するハンドラー
   * @param input 入力パラメータ
   * @param input.id カスタムリンクID（必須）
   * @returns 削除結果の情報
   */
  handler: async function (input: { id: number }) {
    const { id } = input;

    if (!id) {
      throw new Error('idが指定されていません');
    }

    const apiClient = await createApiClient();

    try {
      // カスタムリンクを削除（SDKのdeleteCustomLinkを使用）
      const result = await deleteCustomLink(apiClient, String(id));

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            message: `カスタムリンク ID ${id} を削除しました`,
            data: result
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'カスタムリンクの削除に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  }
};
