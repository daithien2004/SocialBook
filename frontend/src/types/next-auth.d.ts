import 'next-auth';

declare module 'next-auth' {
  interface User extends DefaultUser {
    username: string;
    role:string;
    accessToken: string;
    refreshToken: string;
    onboardingCompleted: boolean;
    onboardingId: string;
  }

  interface Session {
    user: {
      id: string;
      username: string;
      role: string;
      onboardingCompleted: boolean;
      onboardingId: string;
    } & DefaultSession['user'];

    accessToken: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    email: string;
    username: string;
    image?: string;
    role: string; 
    accessToken: string;
    refreshToken: string;
    onboardingCompleted: boolean;
    onboardingId: string;
  }
}
