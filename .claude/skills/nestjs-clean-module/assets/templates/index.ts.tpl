// Public API của module: chỉ export những gì module khác được phép dùng.
// Không export handler, repository, entity hay mapper.
export { Create__Name__Command } from './application/commands/create-__kebab__/create-__kebab__.command';
export { Rename__Name__Command } from './application/commands/rename-__kebab__/rename-__kebab__.command';
export { Get__Name__Query } from './application/queries/get-__kebab__/get-__kebab__.query';
export { List__Names__Query } from './application/queries/list-__kebabs__/list-__kebabs__.query';
export type { __Name__ReadModel } from './application/read-models/__kebab__.read-model';
export { __Name__CreatedEvent } from './domain/events/__kebab__-created.event';
export { __Names__Module } from './__kebabs__.module';
