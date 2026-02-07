import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IOnboardingRepository } from '../../domain/repositories/onboarding.repository.interface';
import { Onboarding } from '../../domain/entities/onboarding.entity';
import { OnboardingMapper } from '../mappers/onboarding.mapper';
import { UserOnboarding, UserOnboardingDocument } from '../schemas/user-onboarding.schema';

@Injectable()
export class OnboardingRepository implements IOnboardingRepository {
  constructor(
    @InjectModel(UserOnboarding.name)
    private readonly model: Model<UserOnboardingDocument>,
  ) {}

  async findByUserId(userId: string): Promise<Onboarding | null> {
    const document = await this.model.findOne({ userId: new Types.ObjectId(userId) }).exec();
    return OnboardingMapper.toDomain(document);
  }

  async create(onboarding: Onboarding): Promise<Onboarding> {
    const persistenceModel = OnboardingMapper.toPersistence(onboarding);
    const created = await this.model.create(persistenceModel);
    const domain = OnboardingMapper.toDomain(created);
    if (!domain) throw new Error('Failed to map created onboarding');
    return domain;
  }

  async update(onboarding: Onboarding): Promise<Onboarding> {
    const persistenceModel = OnboardingMapper.toPersistence(onboarding);
    const updated = await this.model
      .findByIdAndUpdate(persistenceModel._id, persistenceModel, { new: true })
      .exec();
    const domain = OnboardingMapper.toDomain(updated);
    if (!domain) throw new Error('Failed to map updated onboarding');
    return domain;
  }
}
