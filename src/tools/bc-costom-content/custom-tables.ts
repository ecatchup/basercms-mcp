import { z } from 'zod';
import { ToolDefinition } from '../../types/tool';
import { createApiClient } from '../../utils/api-client';
import { addCustomTable, editCustomTable, getCustomFields, getCustomTables, getCustomTable, deleteCustomTable } from '@ryuring/basercms-js-sdk';
import { ApiClient } from '@ryuring/basercms-js-sdk';

export const addCustomTableTool: ToolDefinition = {
  name: 'addCustomTable',
  description: 'カスタムテーブルを追加し、指定されたカスタムフィールドを関連付けます。フィールドを関連付けるためには、事前にカスタムフィールドが作成されている必要があります。',
  inputSchema: {
    name: z.string().describe('テーブル名（必須）'),
    title: z.string().describe('テーブルタイトル（必須）'),
    custom_field_names: z.array(z.string()).optional().describe('関連付けるカスタムフィールドの名前配列')
  },

  /**
   * カスタムテーブルを追加するハンドラー
   * @param input 入力パラメータ
   * @param input.name テーブル名（必須）
   * @param input.title テーブルタイトル（必須）
   * @param input.custom_field_names 関連付けるカスタムフィールドの名前配列
   * @returns 作成されたカスタムテーブルの情報
   * @throws エラーが発生した場合は例外をスロー
   */
  handler: async function (input: { name: string; title: string; custom_field_names?: string[]; }) {
    try {
      const { name, title, custom_field_names } = input;

      if (!name || !title) {
        throw new Error('name, titleは必須です');
      }

      const apiClient = await createApiClient();

      // カスタムテーブルを追加
      const customTableData = {
        type: '1',
        name,
        title,
        display_field: 'title',
        has_child: 0,
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      };

      const customTable = await addCustomTable(apiClient, customTableData);

      // エラーチェック
      if (!customTable || (customTable as any).errors) {
        throw new Error('カスタムテーブルの作成に失敗しました: ' + JSON.stringify((customTable as any)?.errors || 'Unknown error'));
      }

      const table = customTable as any;

      // カスタムフィールドが指定されている場合は関連付けを行う
      if (custom_field_names && custom_field_names.length > 0) {
        try {
          const customLinks = await addCustomTableTool.createCustomLinks(apiClient, custom_field_names);

          if (Object.keys(customLinks).length > 0) {
            // カスタムテーブルを更新してカスタムリンクを追加
            // PHPサーバー側でオブジェクトとして正しく解釈されるように明示的に変換
            const customLinksObject = JSON.parse(JSON.stringify(customLinks));

            const updateData = {
              custom_links: customLinksObject
            };

            try {
              const updatedCustomTable = await editCustomTable(apiClient, table.id.toString(), updateData);
              return {
                content: [{ type: 'text' as const, text: JSON.stringify(updatedCustomTable, null, 2) }]
              };
            } catch (editError) {
              // editCustomTable が失敗した場合でも、カスタムテーブル自体は返す
              return {
                content: [{
                  type: 'text' as const,
                  text: JSON.stringify({
                    ...customTable,
                    warning: 'カスタムリンクの更新に失敗しました: ' + (editError as Error).message,
                    attempted_custom_links: customLinks
                  }, null, 2)
                }]
              };
            }
          } else {
            return {
              content: [{
                type: 'text' as const,
                text: JSON.stringify({
                  ...customTable,
                  warning: 'カスタムリンクが作成されませんでした'
                }, null, 2)
              }]
            };
          }
        } catch (error) {
          // カスタムリンクの作成に失敗した場合でも、カスタムテーブル自体は返す
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify({
                ...customTable,
                warning: 'カスタムフィールドの関連付けに失敗しました: ' + (error as Error).message
              }, null, 2)
            }]
          };
        }
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(customTable, null, 2) }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'カスタムテーブルの作成に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  },

  /**
   * カスタムフィールド名からカスタムリンクデータを作成する
   * @param apiClient baserCMS APIクライアント
   * @param customFieldNames カスタムフィールド名の配列
   * @returns カスタムリンクデータのオブジェクト
   */
  async createCustomLinks(apiClient: ApiClient, customFieldNames: string[]): Promise<any> {
    const customLinks: any = {};

    try {
      // 指定された名前のフィールドを検索
      for (let i = 0; i < customFieldNames.length; i++) {
        const fieldName = customFieldNames[i];
        const customFields = await getCustomFields(apiClient, { name: fieldName, status: 1 });

        if (customFields && customFields.length > 0) {
          const customField = customFields[0];

          // カスタムリンクデータを作成（オブジェクト形式）
          customLinks[`new_${i + 1}`] = {
            name: customField.name,
            custom_field_id: customField.id,
            type: customField.type,
            display_front: true,
            use_api: true,
            status: true,
            title: customField.title,
            search_target_admin: true,
            search_target_front: true,
          };
        }
      }
    } catch (error) {
      // カスタムフィールドの取得に失敗した場合はスキップ
    }
    return customLinks;
  }
};

/**
 * カスタムテーブル単一取得ツール
 * baserCMSの単一カスタムテーブルを取得するためのMCPツール
 */
export const getCustomTableTool: ToolDefinition = {
  name: 'getCustomTable',
  description: '指定されたIDのカスタムテーブルを取得します',
  inputSchema: {
    id: z.number().describe('カスタムテーブルID（必須）')
  },

  /**
   * カスタムテーブルを取得するハンドラー
   * @param input 入力パラメータ
   * @param input.id カスタムテーブルID（必須）
   * @returns 取得されたカスタムテーブルの情報
   */
  handler: async function (input: { id: number }) {
    const { id } = input;

    if (!id) {
      throw new Error('idが指定されていません');
    }

    const apiClient = await createApiClient();

    try {
      // カスタムテーブルを取得（SDKのgetCustomTableを使用）
      const result = await getCustomTable(apiClient, String(id));

      if (!result) {
        throw new Error(`ID ${id} のカスタムテーブルが見つかりません`);
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'カスタムテーブルの取得に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  }
};

/**
 * カスタムテーブル一覧取得ツール
 * baserCMSのカスタムテーブル一覧を取得するためのMCPツール
 */
export const getCustomTablesTool: ToolDefinition = {
  name: 'getCustomTables',
  description: 'カスタムテーブルの一覧を取得します',
  inputSchema: {
    limit: z.number().optional().describe('取得件数（省略時は制限なし）'),
    page: z.number().optional().describe('ページ番号（省略時は1ページ目）'),
    keyword: z.string().optional().describe('検索キーワード'),
    status: z.number().optional().describe('公開ステータス（0: 非公開, 1: 公開）'),
    type: z.string().optional().describe('テーブルタイプ')
  },

  /**
   * カスタムテーブル一覧を取得するハンドラー
   * @param input 入力パラメータ
   * @param input.limit 取得件数（省略時は制限なし）
   * @param input.page ページ番号（省略時は1ページ目）
   * @param input.keyword 検索キーワード
   * @param input.status 公開ステータス
   * @param input.type テーブルタイプ
   * @returns 取得されたカスタムテーブル一覧の情報
   */
  handler: async function (input: {
    limit?: number;
    page?: number;
    keyword?: string;
    status?: number;
    type?: string;
  }) {
    const { limit, page, keyword, status, type } = input;

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
      if (type !== undefined) options.type = type;

      // カスタムテーブル一覧を取得（SDKのgetCustomTablesを使用）
      const result = await getCustomTables(apiClient, options);

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'カスタムテーブル一覧の取得に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  }
};

/**
 * カスタムテーブル編集ツール
 * baserCMSのカスタムテーブルを編集するためのMCPツール
 */
export const editCustomTableTool: ToolDefinition = {
  name: 'editCustomTable',
  description: '指定されたIDのカスタムテーブルを編集します',
  inputSchema: {
    id: z.number().describe('カスタムテーブルID（必須）'),
    name: z.string().optional().describe('テーブル名'),
    title: z.string().optional().describe('テーブルタイトル'),
    type: z.string().optional().describe('テーブルタイプ'),
    display_field: z.string().optional().describe('表示フィールド'),
    has_child: z.number().optional().describe('子テーブルを持つかどうか（0: 持たない, 1: 持つ）'),
    custom_field_names: z.array(z.string()).optional().describe('関連付けるカスタムフィールドの名前配列')
  },

  /**
   * カスタムテーブルを編集するハンドラー
   * @param input 入力パラメータ
   * @param input.id カスタムテーブルID（必須）
   * @param input.name テーブル名
   * @param input.title テーブルタイトル
   * @param input.type テーブルタイプ
   * @param input.display_field 表示フィールド
   * @param input.has_child 子テーブルを持つかどうか
   * @param input.custom_field_names 関連付けるカスタムフィールドの名前配列
   * @returns 編集されたカスタムテーブルの情報
   */
  handler: async function (input: {
    id: number;
    name?: string;
    title?: string;
    type?: string;
    display_field?: string;
    has_child?: number;
    custom_field_names?: string[];
  }) {
    const { id, name, title, type, display_field, has_child, custom_field_names } = input;

    if (!id) {
      throw new Error('idが指定されていません');
    }

    const apiClient = await createApiClient();

    try {
      // 更新データを構築
      const updateData: any = {};

      if (name !== undefined) updateData.name = name;
      if (title !== undefined) updateData.title = title;
      if (type !== undefined) updateData.type = type;
      if (display_field !== undefined) updateData.display_field = display_field;
      if (has_child !== undefined) updateData.has_child = has_child;

      // カスタムフィールドが指定されている場合は関連付けを行う
      if (custom_field_names && custom_field_names.length > 0) {
        try {
          const customLinks = await addCustomTableTool.createCustomLinks(apiClient, custom_field_names);
          if (Object.keys(customLinks).length > 0) {
            updateData.custom_links = JSON.parse(JSON.stringify(customLinks));
          }
        } catch (error) {
          // カスタムリンクの作成に失敗してもエラーにしない
        }
      }

      updateData.modified = new Date().toISOString();

      // カスタムテーブルを編集（SDKのeditCustomTableを使用）
      const result = await editCustomTable(apiClient, String(id), updateData);

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'カスタムテーブルの編集に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  }
};

/**
 * カスタムテーブル削除ツール
 * baserCMSのカスタムテーブルを削除するためのMCPツール
 */
export const deleteCustomTableTool: ToolDefinition = {
  name: 'deleteCustomTable',
  description: '指定されたIDのカスタムテーブルを削除します',
  inputSchema: {
    id: z.number().describe('カスタムテーブルID（必須）')
  },

  /**
   * カスタムテーブルを削除するハンドラー
   * @param input 入力パラメータ
   * @param input.id カスタムテーブルID（必須）
   * @returns 削除結果の情報
   */
  handler: async function (input: { id: number }) {
    const { id } = input;

    if (!id) {
      throw new Error('idが指定されていません');
    }

    const apiClient = await createApiClient();

    try {
      // カスタムテーブルを削除（SDKのdeleteCustomTableを使用）
      const result = await deleteCustomTable(apiClient, String(id));

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            message: `カスタムテーブル ID ${id} を削除しました`,
            data: result
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'カスタムテーブルの削除に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  }
};
