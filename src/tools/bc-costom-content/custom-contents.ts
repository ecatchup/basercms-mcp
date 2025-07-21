import { z } from 'zod';
import { ToolDefinition } from '../../types/tool';
import { createApiClient } from '../../utils/api-client';
import { ApiClient, addCustomContent } from '@ryuring/basercms-js-sdk';

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
  handler: async function(input: { 
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
