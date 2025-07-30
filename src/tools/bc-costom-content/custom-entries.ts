import { z } from 'zod';
import fs from 'fs';
import { ToolDefinition } from '../../types/tool';
import { createApiClient } from '../../utils/api-client';
import { addCustomEntry, getCustomEntries, getCustomLinks } from '@ryuring/basercms-js-sdk';

/**
 * カスタムエントリー追加ツール
 * baserCMSのカスタムエントリーを作成するためのMCPツール
 */
export const addCustomEntryTool: ToolDefinition = {
  name: 'addCustomEntry',
  description: 'カスタムエントリーを追加します',
  inputSchema: {
    custom_table_id: z.number().describe('カスタムテーブルID（必須）'),
    title: z.string().describe('タイトル（必須）'),
    name: z.string().optional().default('').describe('スラッグ（初期値空文字）'),
    status: z.boolean().optional().default(false).describe('公開状態（デフォルト：false）'),
    publish_begin: z.string().optional().describe('公開開始日（YYYY-MM-DD HH:mm:ss形式、省略可）'),
    publish_end: z.string().optional().describe('公開終了日（YYYY-MM-DD HH:mm:ss形式、省略可）'),
    published: z.string().optional().describe('公開日（YYYY-MM-DD HH:mm:ss形式、省略時は当日）'),
    creator_id: z.number().optional().default(1).describe('投稿者ID（デフォルト初期ユーザー）'),
    custom_fields: z.record(z.any()).optional().describe('カスタムフィールドの値（フィールド名をキーとするオブジェクト）、ファイルアップロードのフィールドの場合は、参照が可能なファイルのパスを指定します')
  },

  /**
   * カスタムエントリーを追加するハンドラー
   * @param input ユーザーからの入力データ
   * @returns 作成されたカスタムエントリーの情報またはエラー
   */
  handler: async function (input: {
    custom_table_id: number;
    title: string;
    name?: string;
    status?: boolean;
    publish_begin?: string;
    publish_end?: string;
    published?: string;
    creator_id?: number;
    custom_fields?: Record<string, any>;
  }) {
    try {
      const {
        custom_table_id,
        title,
        name = '',
        status = false,
        publish_begin,
        publish_end,
        published,
        creator_id = 1,
        custom_fields = {}
      } = input;

      if (!custom_table_id) {
        throw new Error('custom_table_idは必須です');
      }

      if (!title) {
        throw new Error('titleは必須です');
      }

      const apiClient = await createApiClient();

      // 公開日のデフォルト値を設定（当日）
      const defaultPublished = new Date().toISOString().slice(0, 19).replace('T', ' ');

      // custom_fieldsの各値をファイルパス形式かどうかチェックし、ファイルフィールドの場合は
      // fs.createReadStream(filePath) を使用してファイルを読み込む
      for (const [fieldName, fieldValue] of Object.entries(custom_fields)) {
        if (typeof fieldValue === 'string') {
          // ファイルパスらしいかどうかを判定（スラッシュを含み、拡張子がある場合）
          const hasSlash = fieldValue.includes('/') || fieldValue.includes('\\');
          const hasExtension = /\.[a-zA-Z0-9]+$/.test(fieldValue);

          if (hasSlash && hasExtension && fs.existsSync(fieldValue)) {
            // 既知のファイルフィールド名をチェック
            const knownFileFields = [
              'product_image', 'main_visual', 'image', 'file', 'photo', 'main_image',
              'test_image_field' // テスト用フィールド
            ];

            if (knownFileFields.includes(fieldName)) {
              custom_fields[fieldName] = fs.createReadStream(fieldValue);
            } else {
              // APIでファイルフィールドかどうかを確認（フォールバック）
              try {
                const isFile = await addCustomEntryTool.isFileField(custom_table_id, fieldName);
                if (isFile) {
                  custom_fields[fieldName] = fs.createReadStream(fieldValue);
                }
              } catch (error) {
                // APIチェックに失敗した場合はそのまま文字列として処理
                console.error(`Error checking if ${fieldName} is file field:`, error);
              }
            }
          }
        }
      }

      // カスタムエントリーのデータを構築
      const customEntryData = {
        custom_table_id,
        name,
        title,
        parent_id: null, // 親ID（入力不要）
        lft: null, // 左位置（入力不要）
        rght: null, // 右位置（入力不要）
        level: null, // 階層（入力不要）
        status,
        publish_begin: publish_begin || null,
        publish_end: publish_end || null,
        published: published || defaultPublished,
        creator_id,
        ...custom_fields // カスタムフィールドの値をマージ
      };

      // カスタムエントリーを追加
      const customEntry = await addCustomEntry(apiClient, custom_table_id, customEntryData);

      // エラーチェック
      if (!customEntry || (customEntry as any).errors) {
        throw new Error('カスタムエントリーの作成に失敗しました: ' + JSON.stringify((customEntry as any)?.errors || 'Unknown error'));
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(customEntry, null, 2) }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'カスタムエントリーの作成に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  },

  /**
   * ファイルのフィールドかどうかを確認する
   * @param customTableId
   * @param fieldName
   * @returns
   */
  async isFileField(customTableId: number, fieldName: string): Promise<boolean> {
    try {
      const apiClient = await createApiClient();
      const customLinks = await getCustomLinks(apiClient, {
        custom_table_id: customTableId,
        name: fieldName,
        contain: 'CustomFields'
      });

      if (customLinks && Array.isArray(customLinks) && customLinks.length > 0) {
        if (customLinks[0] && customLinks[0].custom_field) {
          const customField = customLinks[0].custom_field;
          return customField && customField.type === 'BcCcFile';
        }
      }
      return false;
    } catch (error) {
      console.error('isFileField error:', error);
      return false;
    }
  }
};

/**
 * カスタムエントリー取得ツール
 * baserCMSのカスタムエントリー一覧を取得するためのMCPツール
 */
export const getCustomEntriesTool: ToolDefinition = {
  name: 'getCustomEntries',
  description: 'カスタムエントリーの一覧を取得します',
  inputSchema: {
    custom_table_id: z.number().describe('カスタムテーブルID（必須）'),
    status: z.number().optional().describe('ステータス（0: 非公開, 1: 公開）'),
    limit: z.number().optional().default(20).describe('取得件数（デフォルト: 20）'),
    page: z.number().optional().default(1).describe('ページ番号（デフォルト: 1）')
  },

  /**
   * カスタムエントリーの一覧を取得するハンドラー
   * @param input 入力パラメータ
   * @returns カスタムエントリーの一覧
   */
  handler: async function (input: {
    custom_table_id: number;
    status?: number;
    limit?: number;
    page?: number;
  }) {
    try {
      const { custom_table_id, status, limit = 20, page = 1 } = input;

      if (!custom_table_id) {
        throw new Error('custom_table_idは必須です');
      }

      const apiClient = await createApiClient();

      // クエリパラメータを構築
      const queryParams = new URLSearchParams();
      if (status !== undefined) queryParams.append('status', status.toString());
      queryParams.append('limit', limit.toString());
      queryParams.append('page', page.toString());

      const queryString = queryParams.toString();
      const url = `/baser-core/bc-custom-content/custom_entries/index/${custom_table_id}.json${queryString ? '?' + queryString : ''}`;

      // basercms-js-sdkのgetCustomEntries関数を使用
      const options: Record<string, any> = {};
      if (status !== undefined) options.status = status;
      if (limit !== undefined) options.limit = limit;
      if (page !== undefined) options.page = page;

      const entries = await getCustomEntries(apiClient, custom_table_id, options);

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(entries, null, 2) }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'カスタムエントリーの取得に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  }
};
