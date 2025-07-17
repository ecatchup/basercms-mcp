import { config } from 'dotenv';
import { ApiClient, addBlogPost, getBlogPosts } from '@ryuring/basercms-js-sdk';
import OpenAI from 'openai';

config();

// 標準入力からMCPリクエスト(JSON)を受け取り、標準出力にレスポンスを返す
process.stdin.setEncoding('utf8');

async function handleRequest(input: any) {
  if (input.action === 'help' || input.action === 'rpc.discover') {
    return {
      actions: [
        {
          name: 'addArticle',
          description: 'ブログ記事を追加します。title（必須）、detail（省略可）を指定できます。',
          params: ['title', 'detail?']
        },
        {
          name: 'getArticles',
          description: 'ブログ記事一覧を取得します。',
          params: []
        },
        {
          name: 'health',
          description: 'サーバーヘルスチェック',
          params: []
        },
        {
          name: 'help',
          description: 'サポートしているアクション一覧を返します',
          params: []
        },
        {
          name: 'rpc.discover',
          description: 'MCPクライアント向けアクション一覧',
          params: []
        }
      ]
    };
  }
  if (input.action === 'addArticle') {
    const { title, detail: reqDetail } = input;
    if (!title) {
      return { error: 'titleは必須です' };
    }
    let detail = reqDetail;
    let content = '';
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    if (!detail) {
      // OpenAIでdetail自動生成
      const prompt = `${title} について、200文字程度で詳しく説明してください。`;
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'あなたは日本語で分かりやすく解説するAIです。' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000
      });
      detail = completion.choices[0]?.message?.content || '';
    }
    // detailの要約をcontentに格納
    if (detail) {
      const summaryPrompt = `次の内容を100文字以内で要約してください。\n\n${detail}`;
      const summaryCompletion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'あなたは日本語で要約するAIです。' },
          { role: 'user', content: summaryPrompt }
        ],
        max_tokens: 200
      });
      content = summaryCompletion.choices[0]?.message?.content || '';
    }
    const apiClient = new ApiClient();
    await apiClient.login();
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const posted = `${yyyy}-${mm}-${dd} 00:00:00`;
    const result = await addBlogPost(apiClient, {
      blog_content_id: Number(process.env.BLOG_CONTENT_ID),
      no: null,
      name: '',
      title,
      content,
      detail,
      blog_category_id: 1,
      user_id: 1,
      status: 1,
      eye_catch: '',
      posted,
    } as any);
    return result;
  } else if (input.action === 'getArticles') {
    const apiClient = new ApiClient();
    await apiClient.login();
    const posts = await getBlogPosts(apiClient, Number(process.env.BLOG_CONTENT_ID));
    return posts;
  } else if (input.action === 'health') {
    return { status: 'ok' };
  } else {
    return { error: 'unknown action' };
  }
}

let buffer = '';
process.stdin.on('data', async (chunk) => {
  buffer += chunk;
  let boundary = buffer.indexOf('\n');
  while (boundary !== -1) {
    const line = buffer.slice(0, boundary);
    buffer = buffer.slice(boundary + 1);
    try {
      const input = JSON.parse(line);
      const result = await handleRequest(input);
      process.stdout.write(JSON.stringify(result) + '\n');
    } catch (e: any) {
      process.stdout.write(JSON.stringify({ error: e.message }) + '\n');
    }
    boundary = buffer.indexOf('\n');
  }
});
