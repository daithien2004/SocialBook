export interface AIRateLimitConfigReadModel {
  guestLimit: number;
  userLimit: number;
  ttl: number;
  blockDuration: number;
}
