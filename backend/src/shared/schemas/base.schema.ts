import { Prop, Schema } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class BaseSchema extends Document {
    declare _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}


@Schema({ timestamps: true })
export class BaseSoftDeleteSchema extends BaseSchema {
    @Prop({ type: Date, default: null })
    deletedAt: Date | null;

    @Prop({ default: false })
    isDeleted: boolean;
}

export const withoutDeleted = () => ({ deletedAt: null });
