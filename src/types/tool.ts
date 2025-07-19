/**
 * ツール定義インターフェース
 * MCPツールの基本構造を定義し、追加のプロパティやメソッドを許可する
 */
export interface ToolDefinition {
  /** ツール名 */
  name: string;
  /** ツールの説明 */
  description: string;
  /** 入力スキーマ */
  inputSchema: any;
  /** ツールのハンドラー関数 */
  handler: (input: any) => Promise<any>;
  /** 追加のプロパティを許可（カスタムメソッドやメタデータなど） */
  [key: string]: any;
}
