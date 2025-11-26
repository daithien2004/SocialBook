import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Progress, ProgressDocument } from '../progress/schemas/progress.schema';

@Injectable()
export class ProgressMigrationService {
    constructor(
        @InjectModel(Progress.name) private progressModel: Model<ProgressDocument>,
    ) { }

    /**
     * Update all existing progress records to set status based on progress value
     * Should be called once to migrate old data
     */
    async migrateProgressStatus() {
        // Find all progress records
        const allProgress = await this.progressModel.find().lean();

        let updated = 0;
        let skipped = 0;

        for (const record of allProgress) {
            const currentStatus = record.status;
            const progress = record.progress || 0;
            const newStatus = progress >= 60 ? 'completed' : 'reading';

            // Only update if status needs to change
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
