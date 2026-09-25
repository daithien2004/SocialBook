import { serverApiRequest } from '@/lib/api-server';

export async function userServerApi() {
  return {
    async getIsUserExist(userId: string): Promise<boolean> {
      try {
        const res = await serverApiRequest<boolean>(`/users/${userId}/exist`);
        return res ?? false;
      } catch {
        return false;
      }
    },
  };
}
