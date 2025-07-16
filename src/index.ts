import { config } from 'dotenv';
import OpenAI from 'openai';
import { ApiClient, addBlogPost } from '@ryuring/basercms-js-sdk';

config();

// OpenAIの初期化
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// baserCMS SDKの初期化
const apiClient = new ApiClient();

// 自然言語から記事登録内容を抽出し、baserCMSに登録する関数
async function registerBlogArticleByAI(naturalText: string) {
  // OpenAIで記事タイトル・本文を抽出
  const prompt = `次の指示からブログ記事のタイトルと本文を抽出してください。\n指示: ${naturalText}\n出力形式: JSON {\"title\":\"タイトル\", \"content\":\"本文\"}`;
  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'あなたはブログ記事の登録アシスタントです。' },
      { role: 'user', content: prompt },
    ],
    max_tokens: 500,
  });
  const aiResponse = completion.choices[0].message?.content || '';
  let article;
  try {
    // コードブロック（```json ... ```）を除去
    const cleaned = aiResponse.replace(/```json[\s\r\n]*|```/g, '').trim();
    article = JSON.parse(cleaned);
  } catch (e) {
    throw new Error('AIの出力が不正です: ' + aiResponse);
  }

  // baserCMSにログイン（JWT取得）
  await apiClient.login();

  // baserCMSに記事登録
  // 今日の日付（YYYY-MM-DD）を生成
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const posted = `${yyyy}-${mm}-${dd} 00:00:00`;

  const result = await addBlogPost(apiClient, {
    blog_content_id: Number(process.env.BLOG_CONTENT_ID),
    no: null,
    name: '',
    title: article.title,
    content: article.content,
    detail: '',
    blog_category_id: 1,
    user_id: 1,
    status: 1,
    eye_catch: '',
    posted: posted,
  } as any);
  return result;
}

// サンプル実行
type Main = () => Promise<void>;
const main: Main = async () => {
  const input = process.argv.slice(2).join(' ');
  if (!input) {
    console.log('自然言語で記事登録指示を入力してください。');
    return;
  }
  try {
    const res = await registerBlogArticleByAI(input);
    console.log('記事を登録しました:', res);
  } catch (e) {
    console.error('エラー:', e);
  }
};

main();
