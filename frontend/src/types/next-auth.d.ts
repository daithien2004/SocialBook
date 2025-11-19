import 'next-auth';

declare module 'next-auth' {
  interface User extends DefaultUser {
    username: string; // <-- Bắt buộc phải có
    role:string;
    accessToken: string;
    refreshToken: string;
  }

  interface Session {
    user: {
      id: string;
      username: string;
      role: string;
    } & DefaultSession['user'];

    accessToken: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    // Thêm các thuộc tính bạn muốn lưu trong token
    id: string;
    email: string;
    username: string;
    image?: string;
    role: string; 
    accessToken: string;
    refreshToken: string;
  }
}
