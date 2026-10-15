export interface AdminUserReadModel {
  id: string;
  username: string;
  email: string;
  roleId: string;
  isVerified: boolean;
  isBanned: boolean;
  provider: string;
  image?: string;
  bio?: string;
  location?: string;
  website?: string;
  createdAt: Date;
  updatedAt: Date;
}
