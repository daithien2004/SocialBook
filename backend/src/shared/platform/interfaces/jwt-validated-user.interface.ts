export interface JwtValidatedUser {
  id: string;
  email: string;
  roles: readonly [string, ...string[]];
}
