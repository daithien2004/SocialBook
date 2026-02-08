import { getServerSession } from 'next-auth/next';
import serverApi from '@/lib/server-api';
import { authOptions } from '../app/api/auth/[...nextauth]/route';

export async function getAuthenticatedServerApi() {
  const session = await getServerSession(authOptions);
  if (!session || !session.accessToken) {
    throw new Error('Unauthorized: Missing valid session or access token.');
  }

  const accessToken = session.accessToken;

  return serverApi.create({
    headers: {
      ...serverApi.defaults.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
