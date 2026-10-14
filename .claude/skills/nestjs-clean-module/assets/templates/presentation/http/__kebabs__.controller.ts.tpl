import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '__AUTH_GUARD_IMPORT__';
import { Actor } from '@/shared/casl/actor';
import { CheckPolicy, PoliciesGuard } from '@/shared/casl/policies';
import { Page } from '@/shared/domain/page';
import { CurrentActor } from '@/shared/presentation/current-actor.decorator';
import { Get__Name__Query } from '../../application/queries/get-__kebab__/get-__kebab__.query';
import { List__Names__Query } from '../../application/queries/list-__kebabs__/list-__kebabs__.query';
import { __Name__ReadModel } from '../../application/read-models/__kebab__.read-model';
import { Create__Name__Dto } from './dto/create-__kebab__.dto';
import { List__Names__Dto } from './dto/list-__kebabs__.dto';
import { Rename__Name__Dto } from './dto/rename-__kebab__.dto';
import { __Name__Response } from './dto/__kebab__.response';

// Controller mỏng: nhận DTO, dispatch đúng một command hoặc query, trả response.
// Không logic nghiệp vụ, không try/catch lỗi domain, không inject handler hay repository.
@ApiTags('__kebabs__')
@Controller('__kebabs__')
@UseGuards(JwtAuthGuard, PoliciesGuard)
export class __Names__Controller {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @CheckPolicy('create', '__Name__')
  async create(
    @Body() dto: Create__Name__Dto,
    @CurrentActor() actor: Actor,
  ): Promise<{ id: string }> {
    const id: string = await this.commandBus.execute(dto.toCommand(actor));
    return { id };
  }

  @Patch(':id')
  @CheckPolicy('update', '__Name__')
  @HttpCode(204)
  async rename(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: Rename__Name__Dto,
    @CurrentActor() actor: Actor,
  ): Promise<void> {
    await this.commandBus.execute(dto.toCommand(id, actor));
  }

  @Get()
  @CheckPolicy('read', '__Name__')
  async list(
    @Query() q: List__Names__Dto,
    @CurrentActor() actor: Actor,
  ): Promise<Page<__Name__Response>> {
    const result: Page<__Name__ReadModel> = await this.queryBus.execute(
      new List__Names__Query(q.toFilter(), q.toPage(), actor),
    );
    return { ...result, items: result.items.map(__Name__Response.from) };
  }

  @Get(':id')
  @CheckPolicy('read', '__Name__')
  async get(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentActor() actor: Actor,
  ): Promise<__Name__Response> {
    const model: __Name__ReadModel = await this.queryBus.execute(new Get__Name__Query(id, actor));
    return __Name__Response.from(model);
  }
}
