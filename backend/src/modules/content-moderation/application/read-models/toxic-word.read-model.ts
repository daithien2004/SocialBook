export interface ToxicWordReadModel {
  id: string;
  pattern: string;
  group: string;
  originalWord: string;
  createdAt: Date;
  updatedAt: Date;
}
