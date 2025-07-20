import { z } from 'zod';
import { ToolDefinition } from '../../types/tool';
import { createApiClient } from '../../utils/api-client';
import { ApiClient, addCustomEntry, getCustomEntries } from '@ryuring/basercms-js-sdk';

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
    custom_fields: z.record(z.any()).optional().describe('カスタムフィールドの値（フィールド名をキーとするオブジェクト）')
  },
  
  /**
   * カスタムエントリーを追加するハンドラー
   * @param input ユーザーからの入力データ
   * @returns 作成されたカスタムエントリーの情報またはエラー
   */
  handler: async function(input: { 
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
        created: new Date().toISOString().slice(0, 19).replace('T', ' '),
        modified: new Date().toISOString().slice(0, 19).replace('T', ' '),
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
  handler: async function(input: { 
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
