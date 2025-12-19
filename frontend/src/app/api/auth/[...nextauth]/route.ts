import NextAuth from 'next-auth';

import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import serverApi from '@/src/lib/server-api';
import { jwtDecode } from 'jwt-decode';
import { JWT } from 'next-auth/jwt';

async function refreshAccessToken(token: JWT) {
  try {
    const response = await serverApi.post('/auth/refresh', {
      refreshToken: token.refreshToken,
    });

    const refreshedTokens = response.data.data;

    if (!refreshedTokens) {
      throw new Error('No refreshed tokens found');
    }

    // Giải mã accessToken mới để lấy thời gian hết hạn (exp)
    const decodedAccessToken = jwtDecode<{ exp: number }>(
      refreshedTokens.accessToken
    );

    // Cập nhật lại token với các giá trị mới
    return {
      ...token, // Giữ lại thông tin cũ như user, refreshToken (nếu không được làm mới)
      accessToken: refreshedTokens.accessToken,
      // Cập nhật refreshToken nếu backend trả về cái mới
      refreshToken: refreshedTokens.refreshToken ?? token.refreshToken,
      // `exp` là timestamp tính bằng giây, cần nhân 1000 để thành mili giây
      accessTokenExpires: decodedAccessToken.exp * 1000,
    };
  } catch (error) {
    console.error('RefreshAccessTokenError', error);
    // Nếu refresh thất bại, trả về token với một lỗi để client có thể xử lý
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

      // Đây là hàm xử lý logic xác thực
      async authorize(credentials, req) {
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
              onboardingCompleted: user.onboardingCompleted,
              onboardingId: user.onboardingId,
            };
          }

          return null;
        } catch (error: any) {
          console.error('Authorize error:', error.response.data);
          throw new Error(
            error.response.data.message || 'Authentication failed'
          );
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          let authData: any;

          const response = await serverApi.post('/auth/google/login', {
            email: user.email,
            name: user.name,
            googleId: user.id,
            image: user.image,
          });
          authData = response.data.data;
          user.id = authData.user.id;
          user.accessToken = authData.accessToken;
          user.refreshToken = authData.refreshToken;
          // Lưu role từ backend response
          if (authData.user?.role) {
            user.role = authData.user.role;
          }
          user.onboardingCompleted = authData.user?.onboardingCompleted;
          user.onboardingId = authData.user?.onboardingId;

          return true; // Cho phép đăng nhập
        } catch (error) {
          console.error('Social login failed', error);
          return false; // Chặn đăng nhập nếu có lỗi
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
        token.onboardingCompleted = user.onboardingCompleted;
        token.onboardingId = user.onboardingId;

        // Giải mã token để lấy thời gian hết hạn
        const decodedAccessToken = jwtDecode<{ exp: number }>(user.accessToken);
        token.accessTokenExpires = decodedAccessToken.exp * 1000;

        return token;
      }

      // Handle session update
      if (trigger === "update" && session) {
        if (session.user?.onboardingCompleted !== undefined) {
             token.onboardingCompleted = session.user.onboardingCompleted;
        }
        return token;
      }

      // Kiểm tra xem accessToken còn hạn không. Thêm một khoảng đệm 60 giây.
      if (Date.now() < (token.accessTokenExpires as number) - 60000) {
        // Nếu còn hạn, trả về token hiện tại
        return token;
      }

      console.log('Access token has expired, refreshing...');
      return await refreshAccessToken(token);
    },

    async session({ session, token }) {
      // `token` ở đây là object được trả về từ callback `jwt` ở trên
      if (token) {
        session.user.name = token.username; // Vẫn giữ tên hiển thị

        session.user.id = token.id;
        session.user.username = token.username; // <-- Quan trọng
        session.user.email = token.email; // Vẫn giữ email
        session.user.image = token.image as string;
        session.user.role = token.role;
        session.user.onboardingCompleted = token.onboardingCompleted;
        session.user.onboardingId = token.onboardingId;
        session.accessToken = token.accessToken;
      }
      return session;
    },

    // Callback khi redirect sau khi đăng nhập
    async redirect({ url, baseUrl }) {
      // Nếu url đã được chỉ định và hợp lệ, sử dụng nó
      if (url.startsWith(baseUrl)) {
        return url;
      }
      // Nếu url không hợp lệ, chuyển về url gốc (sẽ được xử lý bởi client)
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

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
