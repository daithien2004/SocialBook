import { NextAuthOptions } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import serverApi from '@/lib/server-api';
import { getErrorMessage } from '@/lib/utils';
import { jwtDecode } from 'jwt-decode';

async function refreshAccessToken(token: JWT) {
  try {
    const response = await serverApi.post('/auth/refresh', {
      refreshToken: token.refreshToken,
    });

    const refreshedTokens = response.data.data;

    if (!refreshedTokens) {
      throw new Error('No refreshed tokens found');
    }

    const decodedAccessToken = jwtDecode<{ exp: number }>(
      refreshedTokens.accessToken,
    );

    return {
      ...token,
      accessToken: refreshedTokens.accessToken,
      refreshToken: refreshedTokens.refreshToken ?? token.refreshToken,
      accessTokenExpires: decodedAccessToken.exp * 1000,
    };
  } catch {
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials) {
        try {
          const res = await serverApi.post('/auth/login', {
            email: credentials?.email,
            password: credentials?.password,
          });
          const { user, accessToken, refreshToken } = res.data.data;
          if (user && accessToken && refreshToken) {
            return {
              ...user,
              accessToken,
              refreshToken,
            };
          }

          return null;
        } catch (error) {
          throw new Error(getErrorMessage(error));
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          const response = await serverApi.post('/auth/google/login', {
            email: user.email,
            name: user.name,
            googleId: user.id,
            image: user.image,
          });

          const authData = response.data.data;
          user.id = authData.user.id;
          user.accessToken = authData.accessToken;
          user.refreshToken = authData.refreshToken;
          if (authData.user?.role) {
            user.role = authData.user.role;
          }

          return true;
        } catch {
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;

        token.id = user.id;
        token.username = user.username;
        token.email = user.email!;
        token.image = user.image!;
        token.role = user.role || 'user';

        const decodedAccessToken = jwtDecode<{ exp: number }>(user.accessToken);
        token.accessTokenExpires = decodedAccessToken.exp * 1000;

        return token;
      }

      if (trigger === 'update' && session) {
        return token;
      }

      if (Date.now() < (token.accessTokenExpires as number) - 60000) {
        return token;
      }

      return await refreshAccessToken(token);
    },

    async session({ session, token }) {
      if (token) {
        session.user.name = token.username;
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.email = token.email;
        session.user.image = token.image as string;
        session.user.role = token.role;
        session.accessToken = token.accessToken;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) {
        return url;
      }
      return `${baseUrl}`;
    },
  },

  pages: {
    signIn: '/login',
  },

  session: {
    strategy: 'jwt',
  },

  secret: process.env.NEXTAUTH_SECRET,
};
