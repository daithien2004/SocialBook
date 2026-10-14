import { Module, Provider } from '@nestjs/common';
import { Create__Name__Handler } from './application/commands/create-__kebab__/create-__kebab__.handler';
import { Rename__Name__Handler } from './application/commands/rename-__kebab__/rename-__kebab__.handler';
import { __Name__QueryRepository } from './application/ports/__kebab__-query.repository';
import { Get__Name__Handler } from './application/queries/get-__kebab__/get-__kebab__.handler';
import { List__Names__Handler } from './application/queries/list-__kebabs__/list-__kebabs__.handler';
import { __Name__Repository } from './domain/repositories/__kebab__.repository';
import { Prisma__Name__QueryRepository } from './infrastructure/persistence/prisma-__kebab__-query.repository';
import { Prisma__Name__Repository } from './infrastructure/persistence/prisma-__kebab__.repository';
import { __Names__Controller } from './presentation/http/__kebabs__.controller';

const CommandHandlers = [Create__Name__Handler, Rename__Name__Handler];
const QueryHandlers = [List__Names__Handler, Get__Name__Handler];
// Thêm handler xử lý domain event vào đây (application/event-handlers/).
const EventHandlers: Provider[] = [];

// PrismaModule, ClsModule và CqrsModule được đăng ký ở AppModule, không import lại ở đây.
@Module({
  controllers: [__Names__Controller],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
    { provide: __Name__Repository, useClass: Prisma__Name__Repository },
    { provide: __Name__QueryRepository, useClass: Prisma__Name__QueryRepository },
  ],
  // Không export handler: module khác giao tiếp qua CommandBus, QueryBus, EventBus.
})
export class __Names__Module {}
