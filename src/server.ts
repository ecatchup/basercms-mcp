import express, { Request, Response } from 'express';
import { config } from 'dotenv';
import { ApiClient, addBlogPost, getBlogPosts } from '@ryuring/basercms-js-sdk';

config();

const app = express();
app.use(express.json());

// 記事一覧取得API
app.get('/articles', async (_req: Request, res: Response) => {
  try {
    const apiClient = new ApiClient();
    await apiClient.login();
    const posts = await getBlogPosts(apiClient, Number(process.env.BLOG_CONTENT_ID));
    res.json(posts);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// 記事追加API
app.post('/articles', async (req: Request, res: Response) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'title, contentは必須です' });
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
      detail: '',
      blog_category_id: 1,
      user_id: 1,
      status: 1,
      eye_catch: '',
      posted,
    } as any);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ message: e.message });
  }
});

// ヘルスチェック
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`MCPサーバー起動: http://localhost:${port}`);
});
