import { z } from 'zod';
import { ToolDefinition } from '../../types/tool';
import { createApiClient } from '../../utils/api-client';
import { getBlogContent, getBlogContents, addBlogContent, editBlogContent, deleteBlogContent } from '@ryuring/basercms-js-sdk';

/**
 * ブログコンテンツ単一取得ツール
 * baserCMSの単一ブログコンテンツを取得するためのMCPツール
 */
export const getBlogContentTool: ToolDefinition = {
  name: 'getBlogContent',
  description: '指定されたIDのブログコンテンツを取得します',
  inputSchema: {
    id: z.number().describe('ブログコンテンツID（必須）')
  },

  /**
   * ブログコンテンツを取得するハンドラー
   * @param input 入力パラメータ
   * @param input.id ブログコンテンツID（必須）
   * @returns 取得されたブログコンテンツの情報
   */
  handler: async function (input: { id: number }) {
    const { id } = input;

    if (!id) {
      throw new Error('idが指定されていません');
    }

    const apiClient = await createApiClient();

    try {
      // ブログコンテンツを取得（SDKのgetBlogContentを使用）
      const result = await getBlogContent(apiClient, id);

      if (!result) {
        throw new Error(`ID ${id} のブログコンテンツが見つかりません`);
      }

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'ブログコンテンツの取得に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  }
};

/**
 * ブログコンテンツ一覧取得ツール
 * baserCMSのブログコンテンツ一覧を取得するためのMCPツール
 */
export const getBlogContentsTool: ToolDefinition = {
  name: 'getBlogContents',
  description: 'ブログコンテンツの一覧を取得します',
  inputSchema: {
    limit: z.number().optional().describe('取得件数（省略時は制限なし）'),
    page: z.number().optional().describe('ページ番号（省略時は1ページ目）'),
    keyword: z.string().optional().describe('検索キーワード'),
    status: z.number().optional().describe('ステータス（0: 非公開, 1: 公開）'),
    site_id: z.number().optional().describe('サイトID')
  },

  /**
   * ブログコンテンツ一覧を取得するハンドラー
   * @param input 入力パラメータ
   * @param input.limit 取得件数（省略時は制限なし）
   * @param input.page ページ番号（省略時は1ページ目）
   * @param input.keyword 検索キーワード
   * @param input.status ステータス
   * @param input.site_id サイトID
   * @returns 取得されたブログコンテンツ一覧の情報
   */
  handler: async function (input: {
    limit?: number;
    page?: number;
    keyword?: string;
    status?: number;
    site_id?: number;
  }) {
    const { limit, page, keyword, status, site_id } = input;

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

      // ブログコンテンツ一覧を取得（SDKのgetBlogContentsを使用）
      const result = await getBlogContents(apiClient, options);

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'ブログコンテンツ一覧の取得に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  }
};

/**
 * ブログコンテンツ追加ツール
 * baserCMSのブログコンテンツを追加するためのMCPツール
 */
export const addBlogContentTool: ToolDefinition = {
  name: 'addBlogContent',
  description: 'ブログコンテンツを追加します',
  inputSchema: {
    name: z.string().describe('ブログコンテンツ名、URLに影響します（必須）'),
    title: z.string().describe('ブログコンテンツのタイトル（必須）'),
    description: z.string().optional().describe('説明文'),
    template: z.string().optional().describe('テンプレート名'),
    list_count: z.number().optional().describe('リスト表示件数'),
    list_direction: z.enum(['ASC', 'DESC']).optional().describe('リスト表示方向（ASC|DESC）'),
    feed_count: z.number().optional().describe('フィード件数'),
    tag_use: z.boolean().optional().describe('タグ機能を使用するか'),
    comment_use: z.boolean().optional().describe('コメント機能を使用するか'),
    comment_approve: z.boolean().optional().describe('コメント承認制にするか'),
    widget_area: z.number().optional().describe('ウィジェットエリア'),
    eye_catch_size: z.string().optional().describe('アイキャッチサイズ'),
    use_content: z.boolean().optional().describe('コンテンツを使用するか'),
    site_id: z.number().optional().describe('サイトID'),
    parent_id: z.number().optional().describe('親ID'),
    status: z.number().optional().describe('公開状態（0: 非公開状態, 1: 公開状態）')
  },

  /**
   * ブログコンテンツを追加するハンドラー
   * @param input 入力パラメータ
   * @param input.name ブログコンテンツ名（必須）
   * @param input.title ブログコンテンツのタイトル（必須）
   * @param input.description 説明文
   * @param input.template テンプレート名
   * @param input.list_count リスト表示件数
   * @param input.list_direction リスト表示方向
   * @param input.feed_count フィード件数
   * @param input.tag_use タグ機能を使用するか
   * @param input.comment_use コメント機能を使用するか
   * @param input.comment_approve コメント承認制にするか
   * @param input.widget_area ウィジェットエリア
   * @param input.eye_catch_size アイキャッチサイズ
   * @param input.use_content コンテンツを使用するか
   * @param input.site_id サイトID
   * @param input.parent_id 親ID
   * @param input.status 公開状態
   * @returns 作成されたブログコンテンツの情報
   */
  handler: async function (input: {
    name: string;
    title: string;
    description?: string;
    template?: string;
    list_count?: number;
    list_direction?: 'ASC' | 'DESC';
    feed_count?: number;
    tag_use?: boolean;
    comment_use?: boolean;
    comment_approve?: boolean;
    widget_area?: number;
    eye_catch_size?: string;
    use_content?: boolean;
    site_id?: number;
    parent_id?: number;
    status?: number;
  }) {
    const {
      name,
      title,
      description,
      template = 'blog',
      list_count = 10,
      list_direction = 'DESC',
      feed_count = 10,
      tag_use = true,
      comment_use = false,
      comment_approve = false,
      widget_area = 0,
      eye_catch_size = '',
      use_content = true,
      site_id = 1,
      parent_id = 1,
      status = 0
    } = input;

    if (!name) {
      throw new Error('nameが指定されていません');
    }

    if (!title) {
      throw new Error('titleが指定されていません');
    }

    const apiClient = await createApiClient();

    try {
      // ブログコンテンツデータを構築
      const blogContentData = {
        description: description || '',
        template,
        list_count,
        list_direction,
        feed_count,
        tag_use,
        comment_use,
        comment_approve,
        widget_area,
        eye_catch_size,
        use_content,
        content: {
          site_id,
          parent_id,
          name,
          title,
          status
        }
      } as any;

      // ブログコンテンツを追加（SDKのaddBlogContentを使用）
      const result = await addBlogContent(apiClient, blogContentData);

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'ブログコンテンツの追加に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  }
};

/**
 * ブログコンテンツ編集ツール
 * baserCMSのブログコンテンツを編集するためのMCPツール
 */
export const editBlogContentTool: ToolDefinition = {
  name: 'editBlogContent',
  description: '指定されたIDのブログコンテンツを編集します',
  inputSchema: {
    id: z.number().describe('ブログコンテンツID（必須）'),
    name: z.string().optional().describe('ブログコンテンツ名'),
    title: z.string().optional().describe('ブログコンテンツのタイトル'),
    description: z.string().optional().describe('説明文'),
    template: z.string().optional().describe('テンプレート名'),
    list_count: z.number().optional().describe('リスト表示件数'),
    list_direction: z.enum(['ASC', 'DESC']).optional().describe('リスト表示方向（ASC|DESC）'),
    feed_count: z.number().optional().describe('フィード件数'),
    tag_use: z.boolean().optional().describe('タグ機能を使用するか'),
    comment_use: z.boolean().optional().describe('コメント機能を使用するか'),
    comment_approve: z.boolean().optional().describe('コメント承認制にするか'),
    widget_area: z.number().optional().describe('ウィジェットエリア'),
    eye_catch_size: z.string().optional().describe('アイキャッチサイズ'),
    use_content: z.boolean().optional().describe('コンテンツを使用するか'),
    status: z.number().optional().describe('公開状態（0: 非公開状態, 1: 公開状態）')
  },

  /**
   * ブログコンテンツを編集するハンドラー
   * @param input 入力パラメータ
   * @param input.id ブログコンテンツID（必須）
   * @param input.name ブログコンテンツ名
   * @param input.title ブログコンテンツのタイトル
   * @param input.description 説明文
   * @param input.template テンプレート名
   * @param input.list_count リスト表示件数
   * @param input.list_direction リスト表示方向
   * @param input.feed_count フィード件数
   * @param input.tag_use タグ機能を使用するか
   * @param input.comment_use コメント機能を使用するか
   * @param input.comment_approve コメント承認制にするか
   * @param input.widget_area ウィジェットエリア
   * @param input.eye_catch_size アイキャッチサイズ
   * @param input.use_content コンテンツを使用するか
   * @param input.status 公開状態
   * @returns 編集されたブログコンテンツの情報
   */
  handler: async function (input: {
    id: number;
    name?: string;
    title?: string;
    description?: string;
    template?: string;
    list_count?: number;
    list_direction?: 'ASC' | 'DESC';
    feed_count?: number;
    tag_use?: boolean;
    comment_use?: boolean;
    comment_approve?: boolean;
    widget_area?: number;
    eye_catch_size?: string;
    use_content?: boolean;
    status?: number;
  }) {
    const {
      id,
      name,
      title,
      description,
      template,
      list_count,
      list_direction,
      feed_count,
      tag_use,
      comment_use,
      comment_approve,
      widget_area,
      eye_catch_size,
      use_content,
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
      if (description !== undefined) updateData.description = description;
      if (template !== undefined) updateData.template = template;
      if (list_count !== undefined) updateData.list_count = list_count;
      if (list_direction !== undefined) updateData.list_direction = list_direction;
      if (feed_count !== undefined) updateData.feed_count = feed_count;
      if (tag_use !== undefined) updateData.tag_use = tag_use;
      if (comment_use !== undefined) updateData.comment_use = comment_use;
      if (comment_approve !== undefined) updateData.comment_approve = comment_approve;
      if (widget_area !== undefined) updateData.widget_area = widget_area;
      if (eye_catch_size !== undefined) updateData.eye_catch_size = eye_catch_size;
      if (use_content !== undefined) updateData.use_content = use_content;
      if (status !== undefined) updateData.status = status;

      updateData.modified = new Date().toISOString();

      // ブログコンテンツを編集（SDKのeditBlogContentを使用）
      const result = await editBlogContent(apiClient, String(id), updateData);

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'ブログコンテンツの編集に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  }
};

/**
 * ブログコンテンツ削除ツール
 * baserCMSのブログコンテンツを削除するためのMCPツール
 */
export const deleteBlogContentTool: ToolDefinition = {
  name: 'deleteBlogContent',
  description: '指定されたIDのブログコンテンツを削除します',
  inputSchema: {
    id: z.number().describe('ブログコンテンツID（必須）')
  },

  /**
   * ブログコンテンツを削除するハンドラー
   * @param input 入力パラメータ
   * @param input.id ブログコンテンツID（必須）
   * @returns 削除結果の情報
   */
  handler: async function (input: { id: number }) {
    const { id } = input;

    if (!id) {
      throw new Error('idが指定されていません');
    }

    const apiClient = await createApiClient();

    try {
      // ブログコンテンツを削除（SDKのdeleteBlogContentを使用）
      const result = await deleteBlogContent(apiClient, String(id));

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            message: `ブログコンテンツ ID ${id} を削除しました`,
            data: result
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            error: 'ブログコンテンツの削除に失敗しました: ' + (error as Error).message
          }, null, 2)
        }]
      };
    }
  }
};
