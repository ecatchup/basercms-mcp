import OpenAI from 'openai';

/**
 * OpenAI ユーティリティクラス
 * OpenAI APIを使用したテキスト生成機能を提供する
 */
export class OpenAIService {
  private client: OpenAI;
  private model: string;
  private detailMaxTokens: number;
  private summaryMaxTokens: number;

  /**
   * OpenAIServiceのコンストラクタ
   */
  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    this.detailMaxTokens = parseInt(process.env.DETAIL_MAX_AI_TOKENS || '1000');
    this.summaryMaxTokens = parseInt(process.env.SUMMARY_MAX_AI_TOKENS || '200');
  }

  /**
   * OpenAI APIが利用可能かチェック
   * @returns APIキーが設定されているかどうか
   */
  private isAvailable(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }

  /**
   * タイトルから詳細な説明文を生成する
   * @param title 記事タイトル
   * @returns HTMLタグを使用した詳細説明
   */
  async generateDetail(title: string): Promise<string> {
    // OPENAI_API_KEYがない場合は自動生成をスキップ
    if (!this.isAvailable()) {
      return `<p>${title}についての詳細説明</p>`;
    }

    // 日本語の場合、1トークン ≈ 1.5文字程度として計算
    const targetChars = Math.floor(this.detailMaxTokens * 1.5);

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: 'あなたは日本語で分かりやすく解説するAIです。出力は必ずHTMLタグを使用してください。マークダウン記法（#、##、**、-など）は一切使用しないでください。' },
        { role: 'user', content: `${title} について、${targetChars}文字程度で詳しく説明してください。見出しは<h4>、<h5>タグ、強調は<strong>タグ、リストは<ul><li>タグ、段落は<p>タグを使用してHTMLで記述してください。マークダウン記法は絶対に使用しないでください。` }
      ],
      max_tokens: this.detailMaxTokens
    });
    return completion.choices[0]?.message?.content ?? '';
  }

  /**
   * 詳細説明から要約を生成する
   * @param detail 詳細説明文
   * @returns 指定文字数以内の要約
   */
  async generateSummary(detail: string): Promise<string> {
    // OPENAI_API_KEYがない場合は自動生成をスキップ
    if (!this.isAvailable()) {
      return detail.substring(0, 100) + '...';
    }

    // 日本語の場合、1トークン ≈ 1.5文字程度として計算
    const targetChars = Math.floor(this.summaryMaxTokens * 1.5);

    const summaryCompletion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: 'あなたは日本語で要約するAIです。' },
        { role: 'user', content: `次の内容を${targetChars}文字以内で要約してください。\n\n${detail}` }
      ],
      max_tokens: this.summaryMaxTokens
    });
    return summaryCompletion.choices[0]?.message?.content ?? '';
  }
}
