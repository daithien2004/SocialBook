import { __Name__ } from '../entities/__kebab__.entity';

// Port ghi: chỉ làm việc với aggregate, không biết gì về quyền hay Prisma.
export abstract class __Name__Repository {
  abstract findById(id: string): Promise<__Name__ | null>;
  abstract save(entity: __Name__): Promise<void>;
}
