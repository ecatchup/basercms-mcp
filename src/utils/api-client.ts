import { ApiClient } from '@ryuring/basercms-js-sdk';

/**
 * baserCMS APIクライアント ユーティリティ
 * baserCMS APIとの通信を管理するためのヘルパー関数
 */

/**
 * APIクライアントを作成し、ログインを実行する
 * @returns 認証済みのAPIクライアントインスタンス
 */
export async function createApiClient(): Promise<ApiClient> {
  const apiClient = new ApiClient();
  await apiClient.login();
  return apiClient;
}
