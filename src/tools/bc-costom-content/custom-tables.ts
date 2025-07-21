import { z } from 'zod';
import { ToolDefinition } from '../../types/tool';
import { createApiClient } from '../../utils/api-client';
import { addCustomTable, editCustomTable, getCustomFields } from '@ryuring/basercms-js-sdk';
import { ApiClient } from '@ryuring/basercms-js-sdk';

export const addCustomTableTool: ToolDefinition = {
  name: 'addCustomTable',
  description: 'カスタムテーブルを追加し、指定されたカスタムフィールドを関連付けます',
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
  handler: async function(input: { name: string; title: string; custom_field_names?: string[]; }) {
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
            title: customField.title
          };
        }
      }
    } catch (error) {
      // カスタムフィールドの取得に失敗した場合はスキップ
    }
    return customLinks;
  }
};
