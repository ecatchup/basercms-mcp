import { z } from 'zod';
import { ToolDefinition } from '../../types/tool';
import { createApiClient } from '../../utils/api-client';
import { ApiClient, addCustomContent, getCustomContents, getCustomContent, editCustomContent, deleteCustomContent } from '@ryuring/basercms-js-sdk';

/**
 * カスタムコンテンツ追加ツール
 * baserCMSのカスタムコンテンツを作成するためのMCPツール
 */
export const addCustomContentTool: ToolDefinition = {
  name: 'addCustomContent',
  description: 'カスタムコンテンツを追加します',
  inputSchema: {
    name: z.string().describe('カスタムコンテンツ名、URLに影響します（必須）'),
    title: z.string().describe('カスタムコンテンツのタイトル（必須）'),
    custom_table_id: z.number().describe('カスタムテーブルID（必須）'),
    description: z.string().optional().describe('説明文'),
    template: z.string().optional().default('default').describe('テンプレート名（初期値: default）'),
    list_count: z.number().optional().default(10).describe('リスト表示件数（初期値: 10）'),
    list_order: z.string().optional().default('id').describe('リスト表示順序（初期値: id）'),
    list_direction: z.enum(['ASC', 'DESC']).optional().default('DESC').describe('リスト表示方向（ASC|DESC、初期値: DESC）'),
    site_id: z.number().optional().default(1).describe('サイトID（初期値: 1）'),
    parent_id: z.number().optional().default(1).describe('親フォルダID（初期値: 1）'),
    status: z.number().optional().describe('公開状態（0: 非公開状態, 1: 公開状態）')
  },

  /**
   * カスタムコンテンツを追加するハンドラー
   * @param input ユーザーからの入力データ
   * @param input.name カスタムコンテンツ名
   * @returns 作成されたカスタムコンテンツの情報またはエラ
   */
  handler: async function (input: {
    name: string;
    title: string;
    custom_table_id: number;
    description?: string;
    template?: string;
    list_count?: number;
    list_order?: string;
    list_direction?: 'ASC' | 'DESC';
    site_id?: number;
    parent_id?: number;
    status?: number;
  }) {
    try {
      const {
        name,
        title,
        custom_table_id,
        description,
        template = 'default',
        list_count = 10,
        list_order = 'id',
        list_direction = 'DESC',
        site_id = 1,
        parent_id = 1,
        status = 0
      } = input;

      if (!custom_table_id) {
        throw new Error('custom_table_idは必須です');
      }

      const apiClient = await createApiClient();

      // カスタムコンテンツのデータを構築
      const customContentData = {
        custom_table_id,
        description: description || '',
        template,
        widget_area: null,
        list_count,
        list_order,
        list_direction,
        content: {
          site_id,
          parent_id,
          name,
          title,
          status
        }
      };

      // カスタムコンテンツを追加
      const customContent = await addCustomContent(apiClient, customContentData);

      // エラーチェック
      if (!customContent || (customContent as any).errors) {
        throw new Error('カスタムコンテンツの作成に失敗しました: ' + JSON.stringify((customContent as any)?.errors || 'Unknown error'));
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(customContent, null, 2) }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'カスタムコンテンツの作成に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  },

  /**
   * カスタムコンテンツを追加するメソッド
   * @param apiClient baserCMS APIクライアント
   * @param customContentData カスタムコンテンツデータ
   * @returns 作成されたカスタムコンテンツの情報
   */
  async addCustomContent(apiClient: ApiClient, customContentData: any): Promise<any> {
    // basercms-js-sdkのaddCustomContent関数を使用
    return await addCustomContent(apiClient, customContentData);
  }
};

/**
 * カスタムコンテンツ単一取得ツール
 * baserCMSの単一カスタムコンテンツを取得するためのMCPツール
 */
export const getCustomContentTool: ToolDefinition = {
  name: 'getCustomContent',
  description: '指定されたIDのカスタムコンテンツを取得します',
  inputSchema: {
    id: z.number().describe('カスタムコンテンツID（必須）')
  },

  /**
   * カスタムコンテンツを取得するハンドラー
   * @param input 入力パラメータ
   * @param input.id カスタムコンテンツID（必須）
   * @returns 取得されたカスタムコンテンツの情報
   */
  handler: async function (input: { id: number }) {
    const { id } = input;

    if (!id) {
      throw new Error('idが指定されていません');
    }

    const apiClient = await createApiClient();

    try {
      // カスタムコンテンツを取得（SDKのgetCustomContentを使用）
      const result = await getCustomContent(apiClient, String(id));

      if (!result) {
        throw new Error(`ID ${id} のカスタムコンテンツが見つかりません`);
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'カスタムコンテンツの取得に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  }
};

/**
 * カスタムコンテンツ一覧取得ツール
 * baserCMSのカスタムコンテンツ一覧を取得するためのMCPツール
 */
export const getCustomContentsTool: ToolDefinition = {
  name: 'getCustomContents',
  description: 'カスタムコンテンツの一覧を取得します',
  inputSchema: {
    limit: z.number().optional().describe('取得件数（省略時は制限なし）'),
    page: z.number().optional().describe('ページ番号（省略時は1ページ目）'),
    keyword: z.string().optional().describe('検索キーワード'),
    status: z.number().optional().describe('公開ステータス（0: 非公開, 1: 公開）'),
    site_id: z.number().optional().describe('サイトID'),
    custom_table_id: z.number().optional().describe('カスタムテーブルID')
  },

  /**
   * カスタムコンテンツ一覧を取得するハンドラー
   * @param input 入力パラメータ
   * @param input.limit 取得件数（省略時は制限なし）
   * @param input.page ページ番号（省略時は1ページ目）
   * @param input.keyword 検索キーワード
   * @param input.status 公開ステータス
   * @param input.site_id サイトID
   * @param input.custom_table_id カスタムテーブルID
   * @returns 取得されたカスタムコンテンツ一覧の情報
   */
  handler: async function (input: {
    limit?: number;
    page?: number;
    keyword?: string;
    status?: number;
    site_id?: number;
    custom_table_id?: number;
  }) {
    const { limit, page, keyword, status, site_id, custom_table_id } = input;

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
      if (site_id !== undefined) options.site_id = site_id;
      if (custom_table_id !== undefined) options.custom_table_id = custom_table_id;

      // カスタムコンテンツ一覧を取得（SDKのgetCustomContentsを使用）
      const result = await getCustomContents(apiClient, options);

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'カスタムコンテンツ一覧の取得に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  }
};

/**
 * カスタムコンテンツ編集ツール
 * baserCMSのカスタムコンテンツを編集するためのMCPツール
 */
export const editCustomContentTool: ToolDefinition = {
  name: 'editCustomContent',
  description: '指定されたIDのカスタムコンテンツを編集します',
  inputSchema: {
    id: z.number().describe('カスタムコンテンツID（必須）'),
    name: z.string().optional().describe('カスタムコンテンツ名'),
    title: z.string().optional().describe('カスタムコンテンツのタイトル'),
    description: z.string().optional().describe('説明文'),
    template: z.string().optional().describe('テンプレート名'),
    list_count: z.number().optional().describe('リスト表示件数'),
    list_order: z.string().optional().describe('リスト表示順序'),
    list_direction: z.enum(['ASC', 'DESC']).optional().describe('リスト表示方向（ASC|DESC）'),
    status: z.number().optional().describe('公開状態（0: 非公開状態, 1: 公開状態）')
  },

  /**
   * カスタムコンテンツを編集するハンドラー
   * @param input 入力パラメータ
   * @param input.id カスタムコンテンツID（必須）
   * @param input.name カスタムコンテンツ名
   * @param input.title カスタムコンテンツのタイトル
   * @param input.description 説明文
   * @param input.template テンプレート名
   * @param input.list_count リスト表示件数
   * @param input.list_order リスト表示順序
   * @param input.list_direction リスト表示方向
   * @param input.status 公開状態
   * @returns 編集されたカスタムコンテンツの情報
   */
  handler: async function (input: {
    id: number;
    name?: string;
    title?: string;
    description?: string;
    template?: string;
    list_count?: number;
    list_order?: string;
    list_direction?: 'ASC' | 'DESC';
    status?: number;
  }) {
    const { id, name, title, description, template, list_count, list_order, list_direction, status } = input;

    if (!id) {
      throw new Error('idが指定されていません');
    }

    const apiClient = await createApiClient();

    try {
      // 更新データを構築
      const updateData: any = {};

      if (name !== undefined) updateData.name = name;
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (template !== undefined) updateData.template = template;
      if (list_count !== undefined) updateData.list_count = list_count;
      if (list_order !== undefined) updateData.list_order = list_order;
      if (list_direction !== undefined) updateData.list_direction = list_direction;
      if (status !== undefined) updateData.status = status;

      updateData.modified = new Date().toISOString();

      // カスタムコンテンツを編集（SDKのeditCustomContentを使用）
      const result = await editCustomContent(apiClient, String(id), updateData);

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'カスタムコンテンツの編集に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  }
};

/**
 * カスタムコンテンツ削除ツール
 * baserCMSのカスタムコンテンツを削除するためのMCPツール
 */
export const deleteCustomContentTool: ToolDefinition = {
  name: 'deleteCustomContent',
  description: '指定されたIDのカスタムコンテンツを削除します',
  inputSchema: {
    id: z.number().describe('カスタムコンテンツID（必須）')
  },

  /**
   * カスタムコンテンツを削除するハンドラー
   * @param input 入力パラメータ
   * @param input.id カスタムコンテンツID（必須）
   * @returns 削除結果の情報
   */
  handler: async function (input: { id: number }) {
    const { id } = input;

    if (!id) {
      throw new Error('idが指定されていません');
    }

    const apiClient = await createApiClient();

    try {
      // カスタムコンテンツを削除（SDKのdeleteCustomContentを使用）
      const result = await deleteCustomContent(apiClient, String(id));

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            message: `カスタムコンテンツ ID ${id} を削除しました`,
            data: result
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'カスタムコンテンツの削除に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  }
};
