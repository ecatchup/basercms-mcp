import { z } from 'zod';
import { ToolDefinition } from '../../types/tool';
import { OpenAIService } from '../../utils/openai';

export const addCustomFieldTool: ToolDefinition = {
  name: 'addCustomField',
  description: 'カスタムフィールドを追加します。typeには以下の値が指定可能: BcCcAutoZip, BcCcCheckbox, BcCcDate, BcCcDateTime, BcCcEmail, BcCcFile, BcCcHidden, BcCcMultiple, BcCcPassword, BcCcPref, BcCcRadio, BcCcRelated, BcCcSelect, BcCcTel, BcCcText, BcCcTextarea, BcCcWysiwyg',
  inputSchema:  {
  name: z.string().describe('フィールド名'),
  title: z.string().describe('フィールドタイトル'),
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
    'BcCcWysiwyg'
  ]).describe('フィールドタイプ'),
  source: z.array(z.string()).optional().describe('選択肢（ラジオボタンやセレクトボックスの場合）')
  },
  /**
   * カスタムフィールドを追加するハンドラー
   * @param input 入力パラメータ
   * @param input.model モデル名（必須）
   * @param input.name フィールド名（必須）
   * @param input.type フィールドタイプ（必須）
   * @param input.label ラベル（省略時はAIで生成）
   * @param input.options オプション（typeがselect等の場合）
   * @param input.email ユーザーのメールアドレス（省略時はデフォルトユーザー）
   * @returns 作成されたカスタムフィールドの情報
   */
  handler: async function(input: { name: string; title: string; type: string; source?: string[]; }) {
    const { name, title, type, source } = input;
    if (!name || !title || !type) {
      throw new Error('name, typeは必須です');
    }
    const openaiService = new OpenAIService();
    const result = {
      name,
      title,
      type,
      status: 1,
      source
    };
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(result) }]
    };
  }
};
