import { __Name__ReadModel } from '../../application/read-models/__kebab__.read-model';
import { __Name__ } from '../../domain/entities/__kebab__.entity';

// Hình dạng bản ghi mà mapper cần. Khai báo ở đây để không phụ thuộc kiểu Prisma generate.
export interface __Name__Row {
  id: string;
  ownerId: string;
  title: string;
  createdAt: Date;
}

// Nơi duy nhất biết cả hai hình dạng dữ liệu: domain entity và bản ghi DB.
export class __Name__Mapper {
  static toDomain(row: __Name__Row): __Name__ {
    return __Name__.rehydrate({
      id: row.id,
      ownerId: row.ownerId,
      title: row.title,
      createdAt: row.createdAt,
    });
  }

  static toPersistence(entity: __Name__): __Name__Row {
    return {
      id: entity.id,
      ownerId: entity.ownerId,
      title: entity.title,
      createdAt: entity.createdAt,
    };
  }

  static toReadModel(row: __Name__Row): __Name__ReadModel {
    return {
      id: row.id,
      ownerId: row.ownerId,
      title: row.title,
      createdAt: row.createdAt,
    };
  }
}
