import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Progress,
  ProgressDocument,
} from '../progress/schemas/progress.schema';

@Injectable()
export class ProgressMigrationService {
  constructor(
    @InjectModel(Progress.name) private progressModel: Model<ProgressDocument>,
  ) {}

  async migrateProgressStatus() {
    const allProgress = await this.progressModel.find().lean();

    let updated = 0;
    let skipped = 0;

    for (const record of allProgress) {
      const currentStatus = record.status;
      const progress = record.progress || 0;
      const newStatus = progress >= 60 ? 'completed' : 'reading';

      if (currentStatus !== newStatus) {
        await this.progressModel.updateOne(
          { _id: record._id },
          { $set: { status: newStatus } },
        );
        updated++;
      } else {
        skipped++;
      }
    }

    return {
      total: allProgress.length,
      updated,
      skipped,
      message: `Migration complete: ${updated} records updated, ${skipped} already correct`,
    };
  }
}
