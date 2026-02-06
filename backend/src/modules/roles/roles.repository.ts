import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GenericRepository } from '../../shared/repository/generic.repository';
import { Role, RoleDocument } from './schemas/role.schema';

@Injectable()
export class RolesRepository extends GenericRepository<RoleDocument> {
    constructor(@InjectModel(Role.name) roleModel: Model<RoleDocument>) {
        super(roleModel);
    }

    async findByName(name: string): Promise<RoleDocument | null> {
        return this.model.findOne({ name }).lean().exec();
    }
}
