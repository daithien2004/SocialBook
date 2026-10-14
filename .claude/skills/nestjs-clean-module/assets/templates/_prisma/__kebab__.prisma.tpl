model __Name__ {
  id        String    @id @db.Uuid
  ownerId   String    @map("owner_id") @db.Uuid
  title     String
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")

  @@index([ownerId])
  @@map("__snakes__")
}
