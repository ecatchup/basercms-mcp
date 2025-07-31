import { z } from 'zod';
import { ToolDefinition } from '../../types/tool';
import { createApiClient } from '../../utils/api-client';
import { addCustomField, getCustomFields, getCustomField, editCustomField, deleteCustomField } from '@ryuring/basercms-js-sdk';
import { ApiClient } from '@ryuring/basercms-js-sdk';

export const getCustomFieldsTool: ToolDefinition = {
  name: 'getCustomFields',
  description: 'カスタムフィールドの一覧を取得します',
  inputSchema: {
    status: z.number().optional().describe('ステータス（0: 無効, 1: 有効）'),
    name: z.string().optional().describe('フィールド名での絞り込み'),
    type: z.string().optional().describe('フィールドタイプでの絞り込み')
  },

  /**
   * カスタムフィールドの一覧を取得するハンドラー
   * @param input 入力パラメータ
   * @param input.status ステータス（0: 無効, 1: 有効）
   * @param input.name フィールド名での絞り込み
   * @param input.type フィールドタイプでの絞り込み
   * @returns カスタムフィールドの一覧
   * @throws エラーが発生した場合は例外をスロー
   */
  handler: async function (input: { status?: number; name?: string; type?: string; }) {
    const { status, name, type } = input;
    const apiClient = await createApiClient();

    // オプションパラメータを構築
    const options: Record<string, any> = {};
    if (status !== undefined) options.status = status;
    if (name) options.name = name;
    if (type) options.type = type;

    const result = await getCustomFields(apiClient, options);
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }]
    };
  }
};

export const addCustomFieldTool: ToolDefinition = {
  name: 'addCustomField',
  description: 'カスタムフィールドを追加します。typeには以下の値が指定可能: BcCcAutoZip, BcCcCheckbox, BcCcDate, BcCcDateTime, BcCcEmail, BcCcFile, BcCcHidden, BcCcMultiple, BcCcPassword, BcCcPref, BcCcRadio, BcCcRelated, BcCcSelect, BcCcTel, BcCcText, BcCcTextarea, BcCcWysiwyg, CuCcBurgerEditor（ブロックエディタ）',
  inputSchema: {
    name: z.string().describe('フィールド名（必須）'),
    title: z.string().describe('フィールドタイトル（必須）'),
    type: z.enum([
      'BcCcAutoZip',
      'BcCcCheckbox',
      'BcCcDate',
      'BcCcDateTime',
      'BcCcEmail',
      'BcCcFile',
      'BcCcHidden',
      'BcCcMultiple',
      'BcCcPassword',
      'BcCcPref',
      'BcCcRadio',
      'BcCcRelated',
      'BcCcSelect',
      'BcCcTel',
      'BcCcText',
      'BcCcTextarea',
      'BcCcWysiwyg',
      'CuCcBurgerEditor'
    ]).describe('フィールドタイプ（必須）'),
    source: z.string().optional().describe('選択肢（ラジオボタンやセレクトボックスの場合、改行で区切って指定する）')
  },

  /**
   * カスタムフィールドを追加するハンドラー
   * @param input 入力パラメータ
   * @param input.name フィールド名（必須）
   * @param input.title フィールドタイトル（必須）
   * @param input.type フィールドタイプ（必須）
   * @param input.source 選択肢（ラジオボタンやセレクトボックスの場合、改行で区切って指定する）
   * @returns 作成されたカスタムフィールドの情報
   * @throws エラーが発生した場合は例外をスロー
   */
  handler: async function (input: { name: string; title: string; type: string; source?: string; }) {
    const { name, title, type, source } = input;
    if (!name || !title || !type) {
      throw new Error('name, typeは必須です');
    }
    const apiClient = await createApiClient();
    const result = await addCustomField(apiClient, {
      name,
      title,
      type,
      status: 1,
      source
    });
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result) }]
    };
  }
};

/**
 * 単一カスタムフィールド取得ツール
 * 指定されたIDのカスタムフィールドを取得します
 */
export const getCustomFieldTool: ToolDefinition = {
  name: 'getCustomField',
  description: '指定されたIDのカスタムフィールドを取得します',
  inputSchema: {
    id: z.number().describe('カスタムフィールドID（必須）')
  },

  /**
   * カスタムフィールドを取得するハンドラー
   * @param input 入力パラメータ
   * @param input.id カスタムフィールドID（必須）
   * @returns 取得されたカスタムフィールドの情報
   */
  handler: async function (input: { id: number }) {
    const { id } = input;

    if (!id) {
      throw new Error('idが指定されていません');
    }

    const apiClient = await createApiClient();

    try {
      const result = await getCustomField(apiClient, String(id));

      if (!result) {
        throw new Error(`ID ${id} のカスタムフィールドが見つかりません`);
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'カスタムフィールドの取得に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  }
};

/**
 * カスタムフィールド一覧取得ツール（インデックス）
 * getCustomFieldsToolの別名として実装
 */
export const getIndexCustomFieldsTool: ToolDefinition = {
  name: 'getIndexCustomFields',
  description: 'カスタムフィールドの一覧を取得します（インデックス用）',
  inputSchema: {
    status: z.number().optional().describe('ステータス（0: 無効, 1: 有効）'),
    name: z.string().optional().describe('フィールド名での絞り込み'),
    type: z.string().optional().describe('フィールドタイプでの絞り込み'),
    limit: z.number().optional().describe('取得件数'),
    page: z.number().optional().describe('ページ番号')
  },

  /**
   * カスタムフィールドの一覧を取得するハンドラー
   * @param input 入力パラメータ
   * @returns カスタムフィールドの一覧
   */
  handler: async function (input: { status?: number; name?: string; type?: string; limit?: number; page?: number }) {
    const { status, name, type, limit, page } = input;
    const apiClient = await createApiClient();

    try {
      // オプションパラメータを構築
      const options: Record<string, any> = { admin: true };
      if (status !== undefined) options.status = status;
      if (name) options.name = name;
      if (type) options.type = type;
      if (limit) options.limit = limit;
      if (page) options.page = page;

      const result = await getCustomFields(apiClient, options);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'カスタムフィールド一覧の取得に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  }
};

/**
 * カスタムフィールド編集ツール
 * 指定されたIDのカスタムフィールドを編集します
 */
export const editCustomFieldTool: ToolDefinition = {
  name: 'editCustomField',
  description: 'カスタムフィールドを編集します',
  inputSchema: {
    id: z.number().describe('カスタムフィールドID（必須）'),
    name: z.string().optional().describe('フィールド名'),
    title: z.string().optional().describe('フィールドタイトル'),
    type: z.enum([
      'BcCcAutoZip',
      'BcCcCheckbox',
      'BcCcDate',
      'BcCcDateTime',
      'BcCcEmail',
      'BcCcFile',
      'BcCcHidden',
      'BcCcMultiple',
      'BcCcPassword',
      'BcCcPref',
      'BcCcRadio',
      'BcCcRelated',
      'BcCcSelect',
      'BcCcTel',
      'BcCcText',
      'BcCcTextarea',
      'BcCcWysiwyg',
      'CuCcBurgerEditor'
    ]).optional().describe('フィールドタイプ'),
    source: z.string().optional().describe('選択肢（ラジオボタンやセレクトボックスの場合、改行で区切って指定する）'),
    status: z.number().optional().describe('ステータス（0: 無効, 1: 有効）')
  },

  /**
   * カスタムフィールドを編集するハンドラー
   * @param input 入力パラメータ
   * @returns 編集されたカスタムフィールドの情報
   */
  handler: async function (input: {
    id: number;
    name?: string;
    title?: string;
    type?: string;
    source?: string;
    status?: number;
  }) {
    const { id, name, title, type, source, status } = input;

    if (!id) {
      throw new Error('idが指定されていません');
    }

    const apiClient = await createApiClient();

    try {
      // 編集データを構築
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (title !== undefined) updateData.title = title;
      if (type !== undefined) updateData.type = type;
      if (source !== undefined) updateData.source = source;
      if (status !== undefined) updateData.status = status;

      const result = await editCustomField(apiClient, String(id), updateData);

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'カスタムフィールドの編集に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  }
};

/**
 * カスタムフィールド削除ツール
 * 指定されたIDのカスタムフィールドを削除します
 */
export const deleteCustomFieldTool: ToolDefinition = {
  name: 'deleteCustomField',
  description: '指定されたIDのカスタムフィールドを削除します',
  inputSchema: {
    id: z.number().describe('カスタムフィールドID（必須）')
  },

  /**
   * カスタムフィールドを削除するハンドラー
   * @param input 入力パラメータ
   * @param input.id カスタムフィールドID（必須）
   * @returns 削除結果の情報
   */
  handler: async function (input: { id: number }) {
    const { id } = input;

    if (!id) {
      throw new Error('idが指定されていません');
    }

    const apiClient = await createApiClient();

    try {
      const result = await deleteCustomField(apiClient, String(id));

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            message: `カスタムフィールドID ${id} を削除しました。`,
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
            error: 'カスタムフィールドの削除に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  }
};
