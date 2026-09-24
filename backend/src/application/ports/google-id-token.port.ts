export interface GoogleIdTokenPayload {
  email: string;
  sub: string;
  name?: string;
  picture?: string;
}

export abstract class GoogleIdTokenPort {
  abstract verify(idToken: string): Promise<GoogleIdTokenPayload | null>;
}
