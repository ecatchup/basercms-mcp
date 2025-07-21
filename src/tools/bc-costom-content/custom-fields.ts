import { z } from 'zod';
import { ToolDefinition } from '../../types/tool';
import { createApiClient } from '../../utils/api-client';
import { addCustomField, getCustomFields } from '@ryuring/basercms-js-sdk';
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
  handler: async function(input: { status?: number; name?: string; type?: string; }) {
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
  handler: async function(input: { name: string; title: string; type: string; source?: string; }) {
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
