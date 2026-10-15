export interface CollectionReadModel {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  userId: string;
  bookCount: number;
  createdAt: Date;
  updatedAt: Date;
}
