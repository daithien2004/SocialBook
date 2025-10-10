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
            avatar: user.image,
          });
          authData = response.data.data;

          user.accessToken = authData.accessToken;
          user.refreshToken = authData.refreshToken;

          return true; // Cho phép đăng nhập
        } catch (error) {
          console.error('Social login failed', error);
          return false; // Chặn đăng nhập nếu có lỗi
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;

        token.id = user.id;
        token.username = user.username;
        token.email = user.email!;
        token.image = user.image!;

        // Giải mã token để lấy thời gian hết hạn
        const decodedAccessToken = jwtDecode<{ exp: number }>(user.accessToken);
        token.accessTokenExpires = decodedAccessToken.exp * 1000;

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
        session.user.image = token.picture; // Vẫn giữ ảnh (từ Google)

        session.accessToken = token.accessToken;
      }
      return session;
    },

    // Callback khi redirect sau khi đăng nhập
    async redirect({ url, baseUrl }) {
      // Luôn chuyển về dashboard sau khi đăng nhập thành công
      if (url.startsWith(baseUrl)) {
        return url;
      }
      // Nếu url không hợp lệ, chuyển về dashboard
      return `${baseUrl}/dashboard`;
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
